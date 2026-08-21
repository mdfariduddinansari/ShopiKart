const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');

// ==================== PUBLIC ROUTES ====================

// @desc    Validate referral code and get referee discount
// @route   GET /api/referrals/validate/:code
// @access  Public
router.get('/validate/:code', async (req, res) => {
  try {
    const referral = await Referral.findOne({ 
      referralCode: req.params.code.toUpperCase(),
      isActive: true,
    }).populate('referrer', 'name');

    if (!referral) {
      return res.status(404).json({ success: false, message: 'Invalid referral code' });
    }

    // Check if max referrals reached
    if (referral.maxReferrals && referral.totalReferrals >= referral.maxReferrals) {
      return res.status(400).json({ success: false, message: 'This referral code has reached its limit' });
    }

    res.json({
      success: true,
      data: {
        referrerName: referral.referrer?.name?.split(' ')[0] || 'A friend',
        refereeReward: referral.refereeReward,
        message: `You'll get ${referral.refereeReward.value}${referral.refereeReward.type === 'percentage' ? '%' : '₹'} off on your first order!`,
      }
    });
  } catch (error) {
    console.error('Error validating referral:', error);
    res.status(500).json({ success: false, message: 'Error validating referral code' });
  }
});

// @desc    Track referral signup (called during registration)
// @route   POST /api/referrals/track-signup
// @access  Public
router.post('/track-signup', async (req, res) => {
  try {
    const { referralCode, email, userId } = req.body;

    if (!referralCode || !email) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const referral = await Referral.findOne({ 
      referralCode: referralCode.toUpperCase(),
      isActive: true,
    });

    if (!referral) {
      return res.status(404).json({ success: false, message: 'Invalid referral code' });
    }

    // Check if user is trying to refer themselves
    const referrer = await User.findById(referral.referrer);
    if (referrer && referrer.email === email) {
      return res.status(400).json({ success: false, message: 'You cannot refer yourself' });
    }

    // Check if already referred
    const existingReferral = referral.referredUsers.find(r => r.email === email);
    if (existingReferral) {
      // Update with userId if signing up
      if (userId && !existingReferral.user) {
        await referral.markSignup(email, userId);
      }
      return res.json({ success: true, message: 'Referral already tracked' });
    }

    // Add new referral
    await referral.addReferredUser(email, userId);

    // Create welcome coupon for new user if they have an account
    if (userId) {
      const discountValue = referral.refereeReward.type === 'percentage' 
        ? referral.refereeReward.value 
        : null;
      const fixedDiscount = referral.refereeReward.type === 'fixed' 
        ? referral.refereeReward.value 
        : null;

      await Coupon.create({
        code: Coupon.generateCode('WELCOME', 6),
        name: '🎁 Welcome Referral Discount',
        description: `Special discount from ${referrer?.name?.split(' ')[0] || 'a friend'}!`,
        discountType: referral.refereeReward.type === 'percentage' ? 'percentage' : 'fixed',
        discountValue: discountValue || fixedDiscount,
        maxDiscountAmount: referral.refereeReward.maxReward,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        usageLimitPerUser: 1,
        firstPurchaseOnly: true,
        isReferralCoupon: true,
        referralId: referral._id,
        applicableUsers: [userId],
        minimumOrderAmount: 199,
      });
    }

    res.json({
      success: true,
      message: 'Referral tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking referral signup:', error);
    res.status(500).json({ success: false, message: 'Error tracking referral' });
  }
});

// ==================== USER ROUTES ====================

// @desc    Get user's referral info
// @route   GET /api/referrals/my-referral
// @access  Private
router.get('/my-referral', protect, async (req, res) => {
  try {
    const referral = await Referral.getOrCreateForUser(req.user._id);
    
    // Get recent referrals
    const recentReferrals = referral.referredUsers
      .slice(-10)
      .reverse()
      .map(r => ({
        email: r.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
        status: r.status,
        rewardEarned: r.rewardEarned || 0,
        date: r.invitedAt,
      }));

    res.json({
      success: true,
      data: {
        ...referral.getStats(),
        recentReferrals,
      }
    });
  } catch (error) {
    console.error('Error fetching referral info:', error);
    res.status(500).json({ success: false, message: 'Error fetching referral info' });
  }
});

// @desc    Send referral invite
// @route   POST /api/referrals/invite
// @access  Private
router.post('/invite', protect, async (req, res) => {
  try {
    const { emails } = req.body; // Array of emails
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide email addresses' });
    }

    if (emails.length > 10) {
      return res.status(400).json({ success: false, message: 'Maximum 10 invites at once' });
    }

    const referral = await Referral.getOrCreateForUser(req.user._id);
    const results = [];

    for (const email of emails) {
      // Validate email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.push({ email, success: false, message: 'Invalid email' });
        continue;
      }

      // Check if user is trying to invite themselves
      if (email === req.user.email) {
        results.push({ email, success: false, message: 'Cannot invite yourself' });
        continue;
      }

      // Check if already a user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        results.push({ email, success: false, message: 'User already registered' });
        continue;
      }

      // Add referral
      const result = await referral.addReferredUser(email);
      results.push({ email, ...result });

      // TODO: Send email invitation (integrate with email service)
      // await sendReferralEmail(email, referral.referralCode, req.user.name);
    }

    res.json({
      success: true,
      data: results,
      message: `Invitations sent`,
    });
  } catch (error) {
    console.error('Error sending invites:', error);
    res.status(500).json({ success: false, message: 'Error sending invitations' });
  }
});

// @desc    Get referral rewards/coupons
// @route   GET /api/referrals/rewards
// @access  Private
router.get('/rewards', protect, async (req, res) => {
  try {
    const now = new Date();
    
    // Get referral coupons for this user
    const coupons = await Coupon.find({
      isReferralCoupon: true,
      applicableUsers: req.user._id,
      isActive: true,
      endDate: { $gte: now },
    }).select('code name description discountType discountValue endDate minimumOrderAmount');

    // Get referral stats
    const referral = await Referral.findOne({ referrer: req.user._id });
    const pendingRewards = referral ? 
      referral.referredUsers.filter(r => r.status === 'first_purchase' && !r.rewardPaid).length : 0;

    res.json({
      success: true,
      data: {
        coupons,
        pendingRewards,
        totalEarnings: referral?.totalEarnings || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching referral rewards:', error);
    res.status(500).json({ success: false, message: 'Error fetching rewards' });
  }
});

// @desc    Get referral leaderboard
// @route   GET /api/referrals/leaderboard
// @access  Private
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const leaderboard = await Referral.find({ successfulReferrals: { $gt: 0 } })
      .populate('referrer', 'name')
      .sort({ successfulReferrals: -1 })
      .limit(10)
      .select('referrer successfulReferrals totalEarnings tier');

    const formattedLeaderboard = leaderboard.map((r, index) => ({
      rank: index + 1,
      name: r.referrer?.name?.split(' ')[0] + ' ' + (r.referrer?.name?.split(' ')[1]?.[0] || '') + '.',
      referrals: r.successfulReferrals,
      tier: r.tier,
    }));

    // Get current user's rank
    const userReferral = await Referral.findOne({ referrer: req.user._id });
    let userRank = null;
    if (userReferral && userReferral.successfulReferrals > 0) {
      const higherCount = await Referral.countDocuments({
        successfulReferrals: { $gt: userReferral.successfulReferrals }
      });
      userRank = higherCount + 1;
    }

    res.json({
      success: true,
      data: {
        leaderboard: formattedLeaderboard,
        userRank,
        userReferrals: userReferral?.successfulReferrals || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, message: 'Error fetching leaderboard' });
  }
});

// ==================== ADMIN ROUTES ====================

// @desc    Get all referrals (admin)
// @route   GET /api/referrals/admin/all
// @access  Admin
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const total = await Referral.countDocuments();
    const referrals = await Referral.find()
      .populate('referrer', 'name email')
      .sort({ successfulReferrals: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: referrals.map(r => ({
        _id: r._id,
        referrer: r.referrer,
        code: r.referralCode,
        totalReferrals: r.totalReferrals,
        successfulReferrals: r.successfulReferrals,
        totalEarnings: r.totalEarnings,
        tier: r.tier,
        isActive: r.isActive,
        createdAt: r.createdAt,
      })),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ success: false, message: 'Error fetching referrals' });
  }
});

// @desc    Get referral statistics (admin)
// @route   GET /api/referrals/admin/stats
// @access  Admin
router.get('/admin/stats', protect, admin, async (req, res) => {
  try {
    const stats = await Referral.aggregate([
      {
        $group: {
          _id: null,
          totalReferrers: { $sum: 1 },
          totalReferrals: { $sum: '$totalReferrals' },
          successfulReferrals: { $sum: '$successfulReferrals' },
          totalEarnings: { $sum: '$totalEarnings' },
        }
      }
    ]);

    const tierDistribution = await Referral.aggregate([
      { $group: { _id: '$tier', count: { $sum: 1 } } }
    ]);

    // Recent successful referrals
    const recentReferrals = await Referral.find({
      'referredUsers.status': 'first_purchase'
    })
      .populate('referrer', 'name')
      .sort({ 'referredUsers.firstPurchaseAt': -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        ...stats[0],
        tierDistribution: tierDistribution.reduce((acc, t) => {
          acc[t._id] = t.count;
          return acc;
        }, {}),
        conversionRate: stats[0] ? 
          ((stats[0].successfulReferrals / stats[0].totalReferrals) * 100).toFixed(1) : 0,
      }
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching statistics' });
  }
});

// @desc    Toggle referral status (admin)
// @route   PATCH /api/referrals/admin/:id/toggle
// @access  Admin
router.patch('/admin/:id/toggle', protect, admin, async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id);
    
    if (!referral) {
      return res.status(404).json({ success: false, message: 'Referral not found' });
    }

    referral.isActive = !referral.isActive;
    await referral.save();

    res.json({
      success: true,
      message: `Referral ${referral.isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (error) {
    console.error('Error toggling referral:', error);
    res.status(500).json({ success: false, message: 'Error toggling referral' });
  }
});

// @desc    Update referral rewards config (admin)
// @route   PUT /api/referrals/admin/config
// @access  Admin
router.put('/admin/config', protect, admin, async (req, res) => {
  try {
    const { referrerReward, refereeReward, maxRewardPerMonth } = req.body;

    // Update all active referrals with new config
    const updateData = {};
    if (referrerReward) updateData.referrerReward = referrerReward;
    if (refereeReward) updateData.refereeReward = refereeReward;
    if (maxRewardPerMonth) updateData.maxRewardPerMonth = maxRewardPerMonth;

    await Referral.updateMany({ isActive: true }, { $set: updateData });

    res.json({
      success: true,
      message: 'Referral configuration updated for all active referrals',
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ success: false, message: 'Error updating configuration' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const Order = require('../models/order');
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');

// ==================== PUBLIC ROUTES ====================

// @desc    Validate and get coupon details
// @route   POST /api/coupons/validate
// @access  Public/Private
router.post('/validate', optionalAuth, async (req, res) => {
  try {
    const { code, orderTotal, cartItems } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    // Check basic validity
    if (!coupon.isValid()) {
      return res.status(400).json({ success: false, message: 'This coupon has expired or is no longer valid' });
    }

    // Check user-specific validity if logged in
    if (req.user) {
      const userOrderCount = await Order.countDocuments({ user: req.user._id });
      const userCheck = coupon.canUserUse(req.user._id, userOrderCount);
      if (!userCheck.valid) {
        return res.status(400).json({ success: false, message: userCheck.message });
      }
    } else if (coupon.isPersonalized || coupon.applicableUsers?.length > 0) {
      return res.status(401).json({ success: false, message: 'Please login to use this coupon' });
    }

    // Calculate discount
    const discountResult = coupon.calculateDiscount(orderTotal || 0, cartItems || []);
    
    res.json({
      success: true,
      data: {
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount: discountResult.discount,
        message: discountResult.message,
        minimumOrderAmount: coupon.minimumOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        validUntil: coupon.endDate,
        freeShipping: coupon.discountType === 'freeShipping',
      }
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ success: false, message: 'Error validating coupon' });
  }
});

// @desc    Delete/use a coupon after order is placed
// @route   POST /api/coupons/use
// @access  Private
router.post('/use', optionalAuth, async (req, res) => {
  try {
    const { code, orderId, discountApplied } = req.body;
    
    console.log('[Coupon Use] Request to use coupon:', code);
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    
    if (!coupon) {
      console.log('[Coupon Use] Coupon not found:', code);
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    // Track usage
    if (req.user) {
      coupon.usedBy.push({
        userId: req.user._id,
        orderId: orderId || null,
        discountApplied: discountApplied || 0,
        usedAt: new Date(),
      });
    }
    coupon.usageCount += 1;
    console.log('[Coupon Use] Updated usageCount to:', coupon.usageCount);

    // Only delete REFERRAL coupons
    if (coupon.isReferralCoupon) {
      await Coupon.deleteOne({ _id: coupon._id });
      console.log('[Coupon Use] ✓ Referral coupon', code, 'has been DELETED');
    } else if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      // If usage limit reached, deactivate the coupon (but don't delete)
      coupon.isActive = false;
      await coupon.save();
      console.log('[Coupon Use] ✓ Coupon', code, 'deactivated (usage limit reached)');
    } else {
      // Just save the updated usage count
      await coupon.save();
      console.log('[Coupon Use] ✓ Coupon', code, 'usage tracked. Count:', coupon.usageCount);
    }

    res.json({
      success: true,
      message: 'Coupon used successfully',
      usageCount: coupon.usageCount,
    });
  } catch (error) {
    console.error('[Coupon Use] Error:', error);
    res.status(500).json({ success: false, message: 'Error using coupon' });
  }
});

// @desc    Get available public coupons
// @route   GET /api/coupons/available
// @access  Public
router.get('/available', optionalAuth, async (req, res) => {
  try {
    const now = new Date();
    
    const query = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      isPersonalized: false,
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ['$usageCount', '$usageLimit'] } }
      ],
      applicableUsers: { $size: 0 },
    };

    const coupons = await Coupon.find(query)
      .select('code name description discountType discountValue maxDiscountAmount minimumOrderAmount endDate')
      .sort({ discountValue: -1 })
      .limit(10);

    res.json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    console.error('Error fetching available coupons:', error);
    res.status(500).json({ success: false, message: 'Error fetching coupons' });
  }
});

// ==================== USER ROUTES ====================

// @desc    Get user's personalized coupons
// @route   GET /api/coupons/my-coupons
// @access  Private
router.get('/my-coupons', protect, async (req, res) => {
  try {
    const now = new Date();
    const userId = req.user._id;

    // Get personalized coupons
    const personalizedCoupons = await Coupon.find({
      isActive: true,
      endDate: { $gte: now },
      $or: [
        { personalizedFor: userId },
        { applicableUsers: userId },
        { isReferralCoupon: true, applicableUsers: userId },
      ],
    }).select('code name description discountType discountValue maxDiscountAmount minimumOrderAmount endDate personalizedReason isReferralCoupon');

    // Get public coupons user hasn't fully used
    const publicCoupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      isPersonalized: false,
      applicableUsers: { $size: 0 },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ['$usageCount', '$usageLimit'] } }
      ],
    }).select('code name description discountType discountValue maxDiscountAmount minimumOrderAmount endDate');

    // Filter out coupons user has already maxed out
    const filteredPublic = [];
    for (const coupon of publicCoupons) {
      const userUsageCount = coupon.usedBy?.filter(
        u => u.userId?.toString() === userId.toString()
      ).length || 0;
      
      if (userUsageCount < coupon.usageLimitPerUser) {
        filteredPublic.push(coupon);
      }
    }

    res.json({
      success: true,
      data: {
        personalized: personalizedCoupons,
        available: filteredPublic.slice(0, 10),
      }
    });
  } catch (error) {
    console.error('Error fetching user coupons:', error);
    res.status(500).json({ success: false, message: 'Error fetching coupons' });
  }
});

// @desc    Apply coupon to order (internal use during checkout)
// @route   POST /api/coupons/apply
// @access  Private
router.post('/apply', protect, async (req, res) => {
  try {
    const { code, orderId, orderTotal, discountApplied } = req.body;
    
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    // Record usage
    coupon.usedBy.push({
      userId: req.user._id,
      orderId,
      discountApplied,
      usedAt: new Date(),
    });
    coupon.usageCount += 1;
    
    await coupon.save();

    res.json({
      success: true,
      message: 'Coupon applied successfully',
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({ success: false, message: 'Error applying coupon' });
  }
});

// ==================== ADMIN ROUTES ====================

// @desc    Get all coupons (admin)
// @route   GET /api/coupons/admin/all
// @access  Admin
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const now = new Date();
    
    let query = {};
    
    if (status === 'active') {
      query = { isActive: true, endDate: { $gte: now } };
    } else if (status === 'expired') {
      query = { endDate: { $lt: now } };
    } else if (status === 'inactive') {
      query = { isActive: false };
    }
    
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Coupon.countDocuments(query);
    const coupons = await Coupon.find(query)
      .populate('personalizedFor', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: coupons,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ success: false, message: 'Error fetching coupons' });
  }
});

// @desc    Create new coupon
// @route   POST /api/coupons/admin/create
// @access  Admin
router.post('/admin/create', protect, admin, async (req, res) => {
  try {
    const couponData = {
      ...req.body,
      code: req.body.code?.toUpperCase().trim() || Coupon.generateCode(),
      createdBy: req.user._id,
    };

    // Validate dates
    if (new Date(couponData.endDate) <= new Date(couponData.startDate)) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    // Check if code exists
    const existing = await Coupon.findOne({ code: couponData.code });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create(couponData);

    res.status(201).json({
      success: true,
      data: coupon,
      message: 'Coupon created successfully',
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ success: false, message: error.message || 'Error creating coupon' });
  }
});

// @desc    Update coupon
// @route   PUT /api/coupons/admin/:id
// @access  Admin
router.put('/admin/:id', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    // Don't allow changing code if coupon has been used
    if (req.body.code && req.body.code !== coupon.code && coupon.usageCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot change code of a used coupon' });
    }

    Object.assign(coupon, req.body);
    if (req.body.code) coupon.code = req.body.code.toUpperCase().trim();
    
    await coupon.save();

    res.json({
      success: true,
      data: coupon,
      message: 'Coupon updated successfully',
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ success: false, message: 'Error updating coupon' });
  }
});

// @desc    Delete coupon
// @route   DELETE /api/coupons/admin/:id
// @access  Admin
router.delete('/admin/:id', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    await coupon.deleteOne();

    res.json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ success: false, message: 'Error deleting coupon' });
  }
});

// @desc    Toggle coupon status
// @route   PATCH /api/coupons/admin/:id/toggle
// @access  Admin
router.patch('/admin/:id/toggle', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({
      success: true,
      data: coupon,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Error toggling coupon:', error);
    res.status(500).json({ success: false, message: 'Error toggling coupon' });
  }
});

// @desc    Get coupon statistics
// @route   GET /api/coupons/admin/stats
// @access  Admin
router.get('/admin/stats', protect, admin, async (req, res) => {
  try {
    const now = new Date();
    
    const [totalCoupons, activeCoupons, expiredCoupons, usageStats] = await Promise.all([
      Coupon.countDocuments(),
      Coupon.countDocuments({ isActive: true, endDate: { $gte: now } }),
      Coupon.countDocuments({ endDate: { $lt: now } }),
      Coupon.aggregate([
        {
          $group: {
            _id: null,
            totalUsage: { $sum: '$usageCount' },
            totalDiscount: { $sum: { $sum: '$usedBy.discountApplied' } },
          }
        }
      ]),
    ]);

    // Top used coupons
    const topCoupons = await Coupon.find()
      .sort({ usageCount: -1 })
      .limit(5)
      .select('code name usageCount');

    res.json({
      success: true,
      data: {
        totalCoupons,
        activeCoupons,
        expiredCoupons,
        totalUsage: usageStats[0]?.totalUsage || 0,
        totalDiscount: usageStats[0]?.totalDiscount || 0,
        topCoupons,
      }
    });
  } catch (error) {
    console.error('Error fetching coupon stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching statistics' });
  }
});

// @desc    Generate bulk coupons
// @route   POST /api/coupons/admin/bulk-generate
// @access  Admin
router.post('/admin/bulk-generate', protect, admin, async (req, res) => {
  try {
    const { count = 10, prefix = 'BULK', ...couponTemplate } = req.body;
    
    if (count > 100) {
      return res.status(400).json({ success: false, message: 'Maximum 100 coupons can be generated at once' });
    }

    const coupons = [];
    for (let i = 0; i < count; i++) {
      const code = Coupon.generateCode(prefix, 6);
      coupons.push({
        ...couponTemplate,
        code,
        createdBy: req.user._id,
      });
    }

    const created = await Coupon.insertMany(coupons);

    res.status(201).json({
      success: true,
      data: created,
      message: `${created.length} coupons generated successfully`,
    });
  } catch (error) {
    console.error('Error generating bulk coupons:', error);
    res.status(500).json({ success: false, message: 'Error generating coupons' });
  }
});

// @desc    Create personalized coupon for user
// @route   POST /api/coupons/admin/personalized
// @access  Admin
router.post('/admin/personalized', protect, admin, async (req, res) => {
  try {
    const { userId, reason, discountValue } = req.body;
    
    if (!userId || !reason) {
      return res.status(400).json({ success: false, message: 'User ID and reason are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const coupon = await Coupon.createPersonalizedCoupon(userId, reason, discountValue);

    res.status(201).json({
      success: true,
      data: coupon,
      message: `Personalized coupon created for ${user.name}`,
    });
  } catch (error) {
    console.error('Error creating personalized coupon:', error);
    res.status(500).json({ success: false, message: 'Error creating personalized coupon' });
  }
});

module.exports = router;

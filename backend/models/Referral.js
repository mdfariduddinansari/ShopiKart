const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  // Referrer Info
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Unique Referral Code
  referralCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  
  // Referral Link (for sharing)
  referralLink: {
    type: String,
  },

  // Reward Configuration
  referrerReward: {
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'points', 'coupon'],
      default: 'fixed',
    },
    value: {
      type: Number,
      default: 100, // ₹100 or 100 points
    },
    maxReward: {
      type: Number,
      default: 500, // Cap for percentage rewards
    },
  },
  
  refereeReward: {
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'points', 'coupon'],
      default: 'percentage',
    },
    value: {
      type: Number,
      default: 10, // 10% off first order
    },
    maxReward: {
      type: Number,
      default: 200,
    },
  },

  // Referral Statistics
  totalReferrals: {
    type: Number,
    default: 0,
  },
  successfulReferrals: {
    type: Number,
    default: 0,
  },
  pendingReferrals: {
    type: Number,
    default: 0,
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },

  // Referred Users
  referredUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    email: String,
    status: {
      type: String,
      enum: ['invited', 'signed_up', 'first_purchase', 'completed', 'expired'],
      default: 'invited',
    },
    signedUpAt: Date,
    firstPurchaseAt: Date,
    firstPurchaseAmount: Number,
    rewardEarned: Number,
    rewardPaid: {
      type: Boolean,
      default: false,
    },
    couponGenerated: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: Date,
  }],

  // Status
  isActive: {
    type: Boolean,
    default: true,
  },

  // Limits
  maxReferrals: {
    type: Number,
    default: null, // null = unlimited
  },
  maxRewardPerMonth: {
    type: Number,
    default: 2000,
  },
  currentMonthEarnings: {
    type: Number,
    default: 0,
  },
  lastRewardReset: {
    type: Date,
    default: Date.now,
  },

  // Tiers (for gamification)
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze',
  },
  tierProgress: {
    type: Number,
    default: 0,
  },

}, { timestamps: true });

// Indexes
referralSchema.index({ referrer: 1 });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ 'referredUsers.user': 1 });
referralSchema.index({ 'referredUsers.email': 1 });

// Generate unique referral code
referralSchema.statics.generateReferralCode = async function(userId) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  let baseCode = '';
  if (user?.name) {
    baseCode = user.name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
  } else {
    baseCode = 'REF';
  }
  
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  let code = `${baseCode}${randomPart}`;
  
  // Ensure uniqueness
  let exists = await this.findOne({ referralCode: code });
  while (exists) {
    const newRandom = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `${baseCode}${newRandom}`;
    exists = await this.findOne({ referralCode: code });
  }
  
  return code;
};

// Create or get referral for user
referralSchema.statics.getOrCreateForUser = async function(userId) {
  let referral = await this.findOne({ referrer: userId });
  
  if (!referral) {
    const referralCode = await this.generateReferralCode(userId);
    referral = await this.create({
      referrer: userId,
      referralCode,
      referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${referralCode}`,
    });
  }
  
  return referral;
};

// Add referred user
referralSchema.methods.addReferredUser = async function(email, userId = null) {
  // Check if already referred
  const existing = this.referredUsers.find(r => r.email === email);
  if (existing) {
    return { success: false, message: 'User already referred' };
  }

  // Check max referrals
  if (this.maxReferrals && this.totalReferrals >= this.maxReferrals) {
    return { success: false, message: 'Maximum referral limit reached' };
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  this.referredUsers.push({
    email,
    user: userId,
    status: userId ? 'signed_up' : 'invited',
    signedUpAt: userId ? new Date() : null,
    expiresAt,
  });
  
  this.totalReferrals += 1;
  if (!userId) this.pendingReferrals += 1;
  
  await this.save();
  return { success: true, message: 'Referral added successfully' };
};

// Mark signup
referralSchema.methods.markSignup = async function(email, userId) {
  const referral = this.referredUsers.find(r => r.email === email);
  if (referral) {
    referral.user = userId;
    referral.status = 'signed_up';
    referral.signedUpAt = new Date();
    this.pendingReferrals = Math.max(0, this.pendingReferrals - 1);
    await this.save();
    return true;
  }
  return false;
};

// Mark first purchase and calculate rewards
referralSchema.methods.markFirstPurchase = async function(userId, purchaseAmount) {
  const Coupon = mongoose.model('Coupon');
  
  console.log(`[Referral] markFirstPurchase called for userId: ${userId}, amount: ${purchaseAmount}`);
  
  const referral = this.referredUsers.find(
    r => r.user?.toString() === userId.toString() && r.status === 'signed_up'
  );
  
  if (!referral) {
    console.log(`[Referral] No referral found with status 'signed_up' for user ${userId}`);
    return { success: false, message: 'Referral not found' };
  }
  
  console.log(`[Referral] Found referral for user, current status: ${referral.status}`);

  // Calculate referrer reward
  let referrerRewardAmount = 0;
  if (this.referrerReward.type === 'fixed') {
    referrerRewardAmount = this.referrerReward.value;
  } else if (this.referrerReward.type === 'percentage') {
    referrerRewardAmount = Math.min(
      (purchaseAmount * this.referrerReward.value) / 100,
      this.referrerReward.maxReward
    );
  }
  
  console.log(`[Referral] Calculated referrer reward: ₹${referrerRewardAmount}`);

  // Check monthly limit
  this.resetMonthlyEarningsIfNeeded();
  if (this.currentMonthEarnings + referrerRewardAmount > this.maxRewardPerMonth) {
    referrerRewardAmount = this.maxRewardPerMonth - this.currentMonthEarnings;
  }

  // Update referral record
  referral.status = 'first_purchase';
  referral.firstPurchaseAt = new Date();
  referral.firstPurchaseAmount = purchaseAmount;
  referral.rewardEarned = referrerRewardAmount;
  
  this.successfulReferrals += 1;
  this.pendingReferrals = Math.max(0, this.pendingReferrals - 1);
  this.totalEarnings += referrerRewardAmount;
  this.currentMonthEarnings += referrerRewardAmount;
  
  // Update tier
  this.updateTier();

  // Create reward coupon for referrer
  if (referrerRewardAmount > 0) {
    const couponCode = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const coupon = await Coupon.create({
      code: couponCode,
      name: '🎁 Referral Reward',
      description: `Reward for referring a friend who made their first purchase!`,
      discountType: 'fixed',
      discountValue: referrerRewardAmount,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      usageLimitPerUser: 1,
      usageLimit: 1,
      isReferralCoupon: true,
      referralId: this._id,
      applicableUsers: [this.referrer],
      minimumOrderAmount: Math.max(199, referrerRewardAmount * 2),
    });
    
    referral.couponGenerated = coupon._id;
    console.log(`[Referral] ✓ Reward coupon created for referrer: ${couponCode} (₹${referrerRewardAmount})`);
  }
  
  await this.save();
  console.log(`[Referral] ✓ Referral saved - Successful: ${this.successfulReferrals}, Pending: ${this.pendingReferrals}, Earnings: ₹${this.totalEarnings}`);
  
  return { 
    success: true, 
    referrerReward: referrerRewardAmount,
    message: `Referral completed! Earned ₹${referrerRewardAmount}` 
  };
};

// Reset monthly earnings
referralSchema.methods.resetMonthlyEarningsIfNeeded = function() {
  const now = new Date();
  const lastReset = new Date(this.lastRewardReset);
  
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.currentMonthEarnings = 0;
    this.lastRewardReset = now;
  }
};

// Update tier based on successful referrals
referralSchema.methods.updateTier = function() {
  const count = this.successfulReferrals;
  
  if (count >= 50) {
    this.tier = 'platinum';
  } else if (count >= 20) {
    this.tier = 'gold';
  } else if (count >= 10) {
    this.tier = 'silver';
  } else {
    this.tier = 'bronze';
  }
  
  // Calculate progress to next tier
  const tierThresholds = { bronze: 10, silver: 20, gold: 50, platinum: 100 };
  const currentThreshold = tierThresholds[this.tier];
  const prevThreshold = this.tier === 'bronze' ? 0 : 
    this.tier === 'silver' ? 10 : 
    this.tier === 'gold' ? 20 : 50;
  
  this.tierProgress = Math.min(100, ((count - prevThreshold) / (currentThreshold - prevThreshold)) * 100);
};

// Get referral stats
referralSchema.methods.getStats = function() {
  return {
    code: this.referralCode,
    link: this.referralLink,
    tier: this.tier,
    tierProgress: this.tierProgress,
    totalReferrals: this.totalReferrals,
    successfulReferrals: this.successfulReferrals,
    pendingReferrals: this.pendingReferrals,
    totalEarnings: this.totalEarnings,
    currentMonthEarnings: this.currentMonthEarnings,
    maxRewardPerMonth: this.maxRewardPerMonth,
    referrerReward: this.referrerReward,
    refereeReward: this.refereeReward,
  };
};

const Referral = mongoose.model('Referral', referralSchema);
module.exports = Referral;

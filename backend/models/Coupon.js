const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  // Basic Info
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },

  // Discount Type
  discountType: {
    type: String,
    enum: ['percentage', 'fixed', 'freeShipping', 'buyXgetY'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  maxDiscountAmount: {
    type: Number, // Cap for percentage discounts
    default: null,
  },

  // Buy X Get Y Configuration
  buyXgetY: {
    buyQuantity: { type: Number, default: 0 },
    getQuantity: { type: Number, default: 0 },
    getProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    getDiscount: { type: Number, default: 100 }, // Percentage off on "get" item
  },

  // Validity
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },

  // Usage Limits
  usageLimit: {
    type: Number, // Total times coupon can be used
    default: null, // null = unlimited
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  usageLimitPerUser: {
    type: Number, // Times per user
    default: 1,
  },
  usedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date, default: Date.now },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    discountApplied: Number,
  }],

  // Conditions
  minimumOrderAmount: {
    type: Number,
    default: 0,
  },
  maximumOrderAmount: {
    type: Number,
    default: null,
  },

  // Targeting
  applicableCategories: [{
    type: String,
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  
  // User Targeting
  applicableUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  selectedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  userType: {
    type: String,
    enum: ['all', 'new', 'returning', 'vip', 'specific', 'selected'],
    default: 'all',
  },
  
  // First Purchase Only
  firstPurchaseOnly: {
    type: Boolean,
    default: false,
  },

  // Personalization Flags
  isPersonalized: {
    type: Boolean,
    default: false,
  },
  personalizedFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  personalizedReason: {
    type: String, // e.g., 'birthday', 'anniversary', 'win-back', 'loyalty'
  },

  // Referral Connection
  isReferralCoupon: {
    type: Boolean,
    default: false,
  },
  referralId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral',
  },

  // Stackability
  canStackWithOther: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: Number, // Higher priority coupons applied first
    default: 0,
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  campaign: {
    type: String, // Campaign name for tracking
  },
  tags: [String],

}, { timestamps: true });

// Indexes for faster queries
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
couponSchema.index({ 'usedBy.userId': 1 });

// Check if coupon is valid
couponSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (this.usageLimit === null || this.usageCount < this.usageLimit)
  );
};

// Check if user can use this coupon
couponSchema.methods.canUserUse = function(userId, userOrderCount = 0) {
  // Check usage limit per user
  const userUsageCount = this.usedBy.filter(
    u => u.userId.toString() === userId.toString()
  ).length;
  
  if (userUsageCount >= this.usageLimitPerUser) {
    return { valid: false, message: 'You have already used this coupon' };
  }

  // Check first purchase only
  if (this.firstPurchaseOnly && userOrderCount > 0) {
    return { valid: false, message: 'This coupon is only for first-time buyers' };
  }

  // Check user type
  if (this.userType === 'new' && userOrderCount > 0) {
    return { valid: false, message: 'This coupon is only for new customers' };
  }

  // Check selected users list
  if (this.userType === 'selected' && this.selectedUsers && this.selectedUsers.length > 0) {
    if (!this.selectedUsers.some(u => u.toString() === userId.toString())) {
      return { valid: false, message: 'This coupon is not applicable for your account' };
    }
  }

  // Check if personalized for specific user
  if (this.isPersonalized && this.personalizedFor) {
    if (this.personalizedFor.toString() !== userId.toString()) {
      return { valid: false, message: 'This coupon is not applicable for your account' };
    }
  }

  // Check specific users list (legacy)
  if (this.applicableUsers && this.applicableUsers.length > 0) {
    if (!this.applicableUsers.some(u => u.toString() === userId.toString())) {
      return { valid: false, message: 'This coupon is not applicable for your account' };
    }
  }

  return { valid: true };
};

// Calculate discount
couponSchema.methods.calculateDiscount = function(orderTotal, cartItems = []) {
  if (!this.isValid()) {
    return { discount: 0, message: 'Coupon is not valid' };
  }

  // Check minimum order amount
  if (orderTotal < this.minimumOrderAmount) {
    return { 
      discount: 0, 
      message: `Minimum order amount is ₹${this.minimumOrderAmount}` 
    };
  }

  // Check maximum order amount
  if (this.maximumOrderAmount && orderTotal > this.maximumOrderAmount) {
    return { 
      discount: 0, 
      message: `Maximum order amount for this coupon is ₹${this.maximumOrderAmount}` 
    };
  }

  let discount = 0;
  let applicableAmount = orderTotal;

  // Filter applicable items if categories/products specified
  if (this.applicableCategories?.length > 0 || this.applicableProducts?.length > 0) {
    applicableAmount = cartItems.reduce((sum, item) => {
      const isApplicable = 
        (this.applicableCategories?.length === 0 || this.applicableCategories.includes(item.category)) &&
        (this.applicableProducts?.length === 0 || this.applicableProducts.some(p => p.toString() === item.productId?.toString())) &&
        (!this.excludedProducts?.some(p => p.toString() === item.productId?.toString()));
      
      return isApplicable ? sum + (item.price * item.quantity) : sum;
    }, 0);
  }

  switch (this.discountType) {
    case 'percentage':
      discount = (applicableAmount * this.discountValue) / 100;
      if (this.maxDiscountAmount) {
        discount = Math.min(discount, this.maxDiscountAmount);
      }
      break;
    
    case 'fixed':
      discount = Math.min(this.discountValue, applicableAmount);
      break;
    
    case 'freeShipping':
      // This would be handled separately in shipping calculation
      discount = 0;
      break;
    
    case 'buyXgetY':
      // Complex calculation based on cart items
      // Would need specific implementation based on business logic
      break;
  }

  return { 
    discount: Math.round(discount * 100) / 100,
    message: 'Coupon applied successfully',
    discountType: this.discountType,
  };
};

// Static method to generate unique code
couponSchema.statics.generateCode = function(prefix = 'SHOP', length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix;
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Static method to create personalized coupon for user
couponSchema.statics.createPersonalizedCoupon = async function(userId, reason, discountValue = 10) {
  const code = this.generateCode(reason.toUpperCase().substring(0, 4), 6);
  
  const reasonConfig = {
    birthday: { name: '🎂 Birthday Special', days: 7, discount: 15 },
    anniversary: { name: '🎉 Anniversary Gift', days: 14, discount: 10 },
    'win-back': { name: '💝 We Miss You!', days: 30, discount: 20 },
    loyalty: { name: '⭐ Loyalty Reward', days: 30, discount: 10 },
    welcome: { name: '👋 Welcome Gift', days: 7, discount: 15 },
  };

  const config = reasonConfig[reason] || { name: 'Special Offer', days: 14, discount: discountValue };

  const coupon = new this({
    code,
    name: config.name,
    description: `Exclusive ${config.discount}% off just for you!`,
    discountType: 'percentage',
    discountValue: config.discount,
    maxDiscountAmount: 500,
    startDate: new Date(),
    endDate: new Date(Date.now() + config.days * 24 * 60 * 60 * 1000),
    usageLimitPerUser: 1,
    isPersonalized: true,
    personalizedFor: userId,
    personalizedReason: reason,
    minimumOrderAmount: 299,
  });

  return coupon.save();
};

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;

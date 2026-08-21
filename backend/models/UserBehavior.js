const mongoose = require('mongoose');

const userBehaviorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Product interactions
  productViews: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    viewCount: {
      type: Number,
      default: 1
    },
    totalTimeSpent: {
      type: Number, // in seconds
      default: 0
    },
    lastViewed: {
      type: Date,
      default: Date.now
    },
    source: {
      type: String,
      enum: ['search', 'category', 'recommendation', 'direct', 'wishlist'],
      default: 'direct'
    }
  }],
  // Search history
  searchHistory: [{
    query: {
      type: String,
      required: true
    },
    resultsClicked: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Category preferences (calculated from behavior)
  categoryPreferences: [{
    category: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  // Price range preferences
  pricePreferences: {
    minPrice: {
      type: Number,
      default: 0
    },
    maxPrice: {
      type: Number,
      default: 100000
    },
    avgPrice: {
      type: Number,
      default: 0
    }
  },
  // Cart additions (even if not purchased)
  cartHistory: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    wasConverted: {
      type: Boolean,
      default: false
    }
  }],
  // Wishlist interactions
  wishlistHistory: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Purchase patterns
  purchasePatterns: {
    preferredCategories: [String],
    avgOrderValue: {
      type: Number,
      default: 0
    },
    purchaseFrequency: {
      type: String,
      enum: ['rare', 'occasional', 'frequent', 'very_frequent'],
      default: 'occasional'
    },
    lastPurchase: Date,
    totalPurchases: {
      type: Number,
      default: 0
    }
  },
  // Brand preferences
  brandPreferences: [{
    brand: String,
    score: {
      type: Number,
      default: 0
    }
  }],
  // Collaborative filtering data
  similarUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    similarityScore: {
      type: Number,
      default: 0
    }
  }],
  // Session data
  sessions: [{
    sessionStart: {
      type: Date,
      default: Date.now
    },
    sessionEnd: Date,
    pagesVisited: Number,
    productsViewed: Number,
    cartActions: Number,
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      default: 'desktop'
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
userBehaviorSchema.index({ 'productViews.product': 1 });
userBehaviorSchema.index({ 'productViews.lastViewed': -1 });
userBehaviorSchema.index({ 'categoryPreferences.category': 1 });
userBehaviorSchema.index({ 'searchHistory.timestamp': -1 });

// Method to update category preferences based on product view
userBehaviorSchema.methods.updateCategoryPreference = async function(category, weight = 1) {
  const existingPref = this.categoryPreferences.find(p => p.category === category);
  if (existingPref) {
    existingPref.score += weight;
    existingPref.lastUpdated = new Date();
  } else {
    this.categoryPreferences.push({
      category,
      score: weight,
      lastUpdated: new Date()
    });
  }
  await this.save();
};

// Method to get top categories
userBehaviorSchema.methods.getTopCategories = function(limit = 5) {
  return this.categoryPreferences
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(p => p.category);
};

// Method to track product view
userBehaviorSchema.methods.trackProductView = async function(productId, source = 'direct', timeSpent = 0) {
  const existingView = this.productViews.find(
    v => v.product.toString() === productId.toString()
  );
  
  if (existingView) {
    existingView.viewCount += 1;
    existingView.totalTimeSpent += timeSpent;
    existingView.lastViewed = new Date();
    existingView.source = source;
  } else {
    this.productViews.push({
      product: productId,
      viewCount: 1,
      totalTimeSpent: timeSpent,
      lastViewed: new Date(),
      source
    });
  }
  
  // Keep only last 100 viewed products
  if (this.productViews.length > 100) {
    this.productViews = this.productViews
      .sort((a, b) => b.lastViewed - a.lastViewed)
      .slice(0, 100);
  }
  
  await this.save();
};

// Method to get recently viewed products
userBehaviorSchema.methods.getRecentlyViewed = function(limit = 10) {
  return this.productViews
    .sort((a, b) => b.lastViewed - a.lastViewed)
    .slice(0, limit)
    .map(v => v.product);
};

// Static method to find or create behavior record
userBehaviorSchema.statics.findOrCreate = async function(userId) {
  let behavior = await this.findOne({ user: userId });
  if (!behavior) {
    behavior = await this.create({ user: userId });
  }
  return behavior;
};

const UserBehavior = mongoose.model('UserBehavior', userBehaviorSchema);

module.exports = UserBehavior;

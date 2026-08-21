const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['color', 'size', 'storage', 'ram', 'model', 'other'],
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  reorderPoint: {
    type: Number,
    default: 5
  },
  discountPrice: {
    type: Number,
    default: 0
  },
  discountExpires: {
    type: Date,
    default: null,
  },
  image: {
    type: String,
    default: null // URL to variant-specific image
  }
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  discountPrice: {
    type: Number,
    default: 0
  },
  discountExpires: {
    type: Date,
    default: null,
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Books', 'Fashion', 'Home', 'Toys', 'Sports', 'Beauty', 'Others']
  },
  brand: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  reorderPoint: {
    type: Number,
    default: 5
  },
  stockStatus: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'reorder_needed'],
    default: 'in_stock'
  },
  inventoryTracking: {
    enabled: {
      type: Boolean,
      default: true
    },
    lastRestocked: {
      type: Date,
      default: null
    },
    restockHistory: [{
      quantity: Number,
      previousStock: Number,
      newStock: Number,
      date: {
        type: Date,
        default: Date.now
      },
      reason: String,
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    stockMovements: [{
      type: {
        type: String,
        enum: ['sale', 'restock', 'return', 'adjustment', 'damaged', 'expired']
      },
      quantity: Number,
      previousStock: Number,
      newStock: Number,
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
      },
      date: {
        type: Date,
        default: Date.now
      },
      note: String
    }]
  },
  featured: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  },
  images: [{
    type: String,
    required: true
  }],
  variants: [variantSchema],
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true
    },
    comment: {
      type: String,
      required: true
    },
    isGenuineBuyer: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Optional: Link to rental version if this product can also be rented
  canBeRented: {
    type: Boolean,
    default: false
  },
  rentalItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalItem',
    default: null
  },
  // Featured product flag
  isFeatured: {
    type: Boolean,
    default: false
  },
  // Show in product reels feed
  showInReels: {
    type: Boolean,
    default: false
  },
  // Amazon-style product specifications (Technical Details table)
  specifications: [{
    key: { type: String, trim: true },
    value: { type: String, trim: true }
  }],
  // Bullet-point product highlights ("About this item")
  productHighlights: [{
    type: String,
    trim: true
  }],
  // Additional information section
  additionalInfo: [{
    key: { type: String, trim: true },
    value: { type: String, trim: true }
  }]
}, {
  timestamps: true
});

// Auto-generate SKU before saving if not provided
productSchema.pre('save', async function(next) {
  if (!this.sku && this.isNew) {
    const prefix = this.category.substring(0, 3).toUpperCase();
    const brandCode = this.brand.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.sku = `${prefix}-${brandCode}-${timestamp}-${random}`;
  }
  
  // Update stock status based on current stock
  if (this.inventoryTracking.enabled) {
    if (this.stock === 0) {
      this.stockStatus = 'out_of_stock';
    } else if (this.stock <= this.reorderPoint) {
      this.stockStatus = 'reorder_needed';
    } else if (this.stock <= this.lowStockThreshold) {
      this.stockStatus = 'low_stock';
    } else {
      this.stockStatus = 'in_stock';
    }
  }
  
  next();
});

// Method to update stock with automatic tracking
productSchema.methods.updateStock = function(quantity, type = 'adjustment', options = {}) {
  const previousStock = this.stock;
  const newStock = previousStock + quantity;
  
  if (newStock < 0) {
    throw new Error('Insufficient stock available');
  }
  
  this.stock = newStock;
  
  // Track stock movement
  if (this.inventoryTracking.enabled) {
    this.inventoryTracking.stockMovements.push({
      type: type,
      quantity: Math.abs(quantity),
      previousStock: previousStock,
      newStock: newStock,
      orderId: options.orderId || null,
      date: new Date(),
      note: options.note || ''
    });
    
    // Track restock specifically
    if (type === 'restock') {
      this.inventoryTracking.lastRestocked = new Date();
      this.inventoryTracking.restockHistory.push({
        quantity: quantity,
        previousStock: previousStock,
        newStock: newStock,
        date: new Date(),
        reason: options.reason || 'Regular restock',
        performedBy: options.userId || null
      });
    }
  }
  
  return this;
};

// Method to check if product needs reordering
productSchema.methods.needsReorder = function() {
  return this.inventoryTracking.enabled && this.stock <= this.reorderPoint;
};

// Method to check if stock is low
productSchema.methods.isLowStock = function() {
  return this.inventoryTracking.enabled && this.stock > this.reorderPoint && this.stock <= this.lowStockThreshold;
};

// Static method to get all products needing reorder
productSchema.statics.getReorderNeeded = function() {
  return this.find({
    'inventoryTracking.enabled': true,
    $expr: { $lte: ['$stock', '$reorderPoint'] }
  });
};

// Static method to get low stock products
productSchema.statics.getLowStock = function() {
  return this.find({
    'inventoryTracking.enabled': true,
    $expr: { 
      $and: [
        { $gt: ['$stock', '$reorderPoint'] },
        { $lte: ['$stock', '$lowStockThreshold'] }
      ]
    }
  });
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

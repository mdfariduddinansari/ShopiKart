const Product = require('../models/Product');
const { generateSKU, generateVariantSKU } = require('../utils/skuGenerator');
const inventoryManager = require('../utils/inventoryManager');


const getProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.limit) || 12;
    const page = Number(req.query.page) || 1;
    const categoryFilter = req.query.category && req.query.category !== 'all' ? req.query.category : null;
    const isRental = req.query.isRental ? req.query.isRental === 'true' : null;
    const showInReels = req.query.showInReels ? req.query.showInReels === 'true' : null;
    const keyword = req.query.keyword
      ? {
          $or: [
            { name: { $regex: req.query.keyword, $options: 'i' } },
            { brand: { $regex: req.query.keyword, $options: 'i' } }
          ]
        }
      : {};
    const sort = req.query.sort || '-featured';
    const minPrice = Number(req.query.minPrice) || 0;
    const maxPrice = Number(req.query.maxPrice) || 999999;

    const query = {
      ...keyword,
      ...(categoryFilter ? { category: categoryFilter } : {}),
      ...(isRental !== null ? { isRental } : {}),
      ...(showInReels !== null ? { showInReels } : {}),
      price: { $gte: minPrice, $lte: maxPrice }
    };

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sort)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    // Clear expired discounts for returned products (best-effort)
    const now = new Date();
    for (const prod of products) {
      if (prod.discountExpires && new Date(prod.discountExpires) <= now) {
        prod.discountPrice = 0;
        prod.discountExpires = null;
        try { await prod.save(); } catch (e) { /* ignore save errors */ }
      }
    }

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (product) {
      // clear expired discount on single product fetch
      if (product.discountExpires && new Date(product.discountExpires) <= new Date()) {
        product.discountPrice = 0;
        product.discountExpires = null;
        try { await product.save(); } catch (e) { /* ignore */ }
      }
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      brand,
      stock,
      images,
      variants,
      lowStockThreshold,
      reorderPoint
    } = req.body;

    // Auto-generate SKU if not provided
    let sku = req.body.sku;
    if (!sku) {
      sku = await generateSKU(category, brand);
    }

    // Process variants and auto-generate SKUs
    let processedVariants = [];
    if (variants && variants.length > 0) {
      processedVariants = variants.map(variant => ({
        ...variant,
        sku: variant.sku || generateVariantSKU(sku, variant.type, variant.value),
        lowStockThreshold: variant.lowStockThreshold || 5,
        reorderPoint: variant.reorderPoint || 2
      }));
    }

    const product = await Product.create({
      name,
      sku,
      description,
      price,
      discountPrice: req.body.discountPrice || 0,
      discountExpires: req.body.discountExpires || null,
      category,
      brand,
      stock,
      lowStockThreshold: lowStockThreshold || 10,
      reorderPoint: reorderPoint || 5,
      images,
      variants: processedVariants,
      specifications: req.body.specifications || [],
      productHighlights: req.body.productHighlights || [],
      additionalInfo: req.body.additionalInfo || [],
      user: req.user._id,
      inventoryTracking: {
        enabled: true,
        lastRestocked: new Date(),
        restockHistory: [{
          quantity: stock,
          previousStock: 0,
          newStock: stock,
          date: new Date(),
          reason: 'Initial stock',
          performedBy: req.user._id
        }],
        stockMovements: [{
          type: 'restock',
          quantity: stock,
          previousStock: 0,
          newStock: stock,
          date: new Date(),
          note: 'Product created with initial stock'
        }]
      }
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      brand,
      stock,
      images,
      variants,
      lowStockThreshold,
      reorderPoint
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.category = category || product.category;
      product.brand = brand || product.brand;
      product.images = images || product.images;
      
      // Handle stock update with tracking
      if (stock !== undefined && stock !== product.stock) {
        const difference = stock - product.stock;
        product.updateStock(difference, 'adjustment', {
          userId: req.user._id,
          note: `Stock adjusted from ${product.stock} to ${stock}`
        });
      }
      
      // Update inventory thresholds
      if (lowStockThreshold !== undefined) {
        product.lowStockThreshold = lowStockThreshold;
      }
      if (reorderPoint !== undefined) {
        product.reorderPoint = reorderPoint;
      }
      
      // Support discount fields
      if (req.body.discountPrice !== undefined) {
        product.discountPrice = req.body.discountPrice;
      }
      if (req.body.discountExpires !== undefined) {
        product.discountExpires = req.body.discountExpires;
      }
      // Support Amazon-style product info fields
      if (req.body.specifications !== undefined) {
        product.specifications = req.body.specifications;
      }
      if (req.body.productHighlights !== undefined) {
        product.productHighlights = req.body.productHighlights;
      }
      if (req.body.additionalInfo !== undefined) {
        product.additionalInfo = req.body.additionalInfo;
      }
      
      // Handle variants update with SKU generation
      if (variants !== undefined) {
        product.variants = variants.map(variant => ({
          ...variant,
          sku: variant.sku || generateVariantSKU(product.sku, variant.type, variant.value),
          lowStockThreshold: variant.lowStockThreshold || 5,
          reorderPoint: variant.reorderPoint || 2
        }));
      }

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add or update product review (one review per user per product)
const addProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const Order = require('../models/order');
    
    // Validate input
    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    // Check authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Please log in to add a review' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user has purchased this product (genuine buyer verification)
    // Only paid orders qualify as verified purchases
    const userOrder = await Order.findOne({
      user: req.user._id,
      'orderItems.product': req.params.id,
      isPaid: true,
      status: { $in: ['completed', 'pending', 'processing', 'shipped', 'delivered'] }
    });

    const isGenuineBuyer = !!userOrder;

    // Check if user already has a review for this product
    const existingReviewIndex = product.reviews.findIndex(
      (review) => review.user.toString() === req.user._id.toString()
    );

    if (existingReviewIndex !== -1) {
      // Update existing review
      product.reviews[existingReviewIndex].rating = Number(rating);
      product.reviews[existingReviewIndex].comment = comment.trim();
      product.reviews[existingReviewIndex].isGenuineBuyer = isGenuineBuyer;
      product.reviews[existingReviewIndex].updatedAt = new Date();
    } else {
      // Add new review (only one per user)
      const review = {
        user: req.user._id,
        name: req.user.name || 'Anonymous',
        rating: Number(rating),
        comment: comment.trim(),
        isGenuineBuyer: isGenuineBuyer,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      product.reviews.push(review);
    }

    // Calculate rating only from genuine buyers
    const genuineBuyerReviews = product.reviews.filter(r => r.isGenuineBuyer);
    
    if (genuineBuyerReviews.length > 0) {
      product.rating = (
        genuineBuyerReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / genuineBuyerReviews.length
      ).toFixed(1);
    } else {
      product.rating = 0;
    }
    
    product.numReviews = genuineBuyerReviews.length;

    await product.save();
    
    // Return product with reviews
    const updatedProduct = await Product.findById(req.params.id);
    res.status(201).json({ 
      message: existingReviewIndex !== -1 ? 'Review updated successfully' : 'Review added successfully', 
      reviews: updatedProduct.reviews,
      rating: updatedProduct.rating,
      numReviews: updatedProduct.numReviews,
      isGenuineBuyer: isGenuineBuyer
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: error.message });
  }
};

// Check if user has already reviewed this product
const checkUserReview = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Please log in' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const userReview = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString()
    );

    res.json({
      hasReviewed: !!userReview,
      review: userReview || null
    });
  } catch (error) {
    console.error('Error checking review:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete user's review
const deleteProductReview = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Please log in' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const reviewIndex = product.reviews.findIndex(
      (review) => review.user.toString() === req.user._id.toString()
    );

    if (reviewIndex === -1) {
      return res.status(404).json({ message: 'Review not found' });
    }

    product.reviews.splice(reviewIndex, 1);

    // Recalculate rating only from genuine buyers
    const genuineBuyerReviews = product.reviews.filter(r => r.isGenuineBuyer);
    
    if (genuineBuyerReviews.length > 0) {
      product.rating = (
        genuineBuyerReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / genuineBuyerReviews.length
      ).toFixed(1);
    } else {
      product.rating = 0;
    }
    
    product.numReviews = genuineBuyerReviews.length;

    await product.save();

    res.json({ 
      message: 'Review deleted successfully',
      rating: product.rating,
      numReviews: product.numReviews
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: error.message });
  }
};

// ===== RENTAL FUNCTIONS =====
const updateProductRental = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRental, rentalPrice, rentalDurationOptions, rentalAvailability } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isRental = isRental;
    if (isRental) {
      product.rentalPrice = rentalPrice || 0;
      product.rentalDurationOptions = rentalDurationOptions || [];
      product.rentalAvailability = rentalAvailability !== undefined ? rentalAvailability : true;
    }

    await product.save();
    res.json({ message: 'Rental settings updated', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRentalProducts = async (req, res) => {
  try {
    const pageSize = 12;
    const page = Number(req.query.page) || 1;
    const categoryFilter = req.query.category && req.query.category !== 'all' ? req.query.category : null;
    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: 'i',
          },
        }
      : {};

    const query = {
      isRental: true,
      rentalAvailability: true,
      ...keyword,
      ...(categoryFilter ? { category: categoryFilter } : {}),
    };

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort('-createdAt')
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkRentalAvailability = async (req, res) => {
  try {
    const { productId, startDate, endDate } = req.body;
    const product = await Product.findById(productId);

    if (!product || !product.isRental) {
      return res.status(404).json({ message: 'Rental product not found' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if dates overlap with booked dates
    const isAvailable = !product.bookedDates.some(booking => {
      return (start <= booking.endDate && end >= booking.startDate);
    });

    res.json({ available: isAvailable });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bookRental = async (req, res) => {
  try {
    const RentalBooking = require('../models/RentalBooking');
    const { productId, startDate, endDate, durationDays, totalPrice } = req.body;
    const userId = req.user._id;

    const product = await Product.findById(productId);
    if (!product || !product.isRental) {
      return res.status(404).json({ message: 'Rental product not found' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check availability
    const isAvailable = !product.bookedDates.some(booking => {
      return (start <= booking.endDate && end >= booking.startDate);
    });

    if (!isAvailable) {
      return res.status(400).json({ message: 'Product not available for selected dates' });
    }

    // Create booking
    const booking = new RentalBooking({
      product: productId,
      user: userId,
      startDate: start,
      endDate: end,
      totalDays: durationDays,
      totalPrice,
      customerDetails: {
        name: req.user.name,
        email: req.user.email,
        phone: req.body.phone || '',
        address: req.body.address || ''
      }
    });

    await booking.save();

    // Add booked dates to product
    product.bookedDates.push({ startDate: start, endDate: end });
    await product.save();

    res.status(201).json({ message: 'Rental booking created', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
  checkUserReview,
  deleteProductReview,
  updateProductRental,
  getRentalProducts,
  checkRentalAvailability,
  bookRental,
};

// ===== INVENTORY MANAGEMENT ENDPOINTS =====

/**
 * Get inventory status for a product
 */
const getInventoryStatus = async (req, res) => {
  try {
    const status = await inventoryManager.getInventoryStatus(req.params.id);
    res.json(status);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Get products needing reorder
 */
const getReorderList = async (req, res) => {
  try {
    const reorderList = await inventoryManager.getReorderList();
    res.json(reorderList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get low stock alerts
 */
const getLowStockAlerts = async (req, res) => {
  try {
    const alerts = await inventoryManager.getLowStockAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get inventory dashboard statistics
 */
const getInventoryStats = async (req, res) => {
  try {
    const stats = await inventoryManager.getInventoryStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Manually restock product
 */
const restockProduct = async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity required' });
    }
    
    const product = await inventoryManager.addStock(
      req.params.id,
      quantity,
      req.user._id,
      reason || 'Manual restock'
    );
    
    res.json({
      message: 'Stock updated successfully',
      product: {
        id: product._id,
        sku: product.sku,
        name: product.name,
        newStock: product.stock,
        stockStatus: product.stockStatus
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Adjust product stock (manual correction)
 */
const adjustProductStock = async (req, res) => {
  try {
    const { quantity, note } = req.body;
    
    if (quantity === undefined || quantity === 0) {
      return res.status(400).json({ message: 'Valid quantity adjustment required' });
    }
    
    const product = await inventoryManager.adjustStock(
      req.params.id,
      quantity,
      note || 'Manual adjustment'
    );
    
    res.json({
      message: 'Stock adjusted successfully',
      product: {
        id: product._id,
        sku: product.sku,
        name: product.name,
        newStock: product.stock,
        stockStatus: product.stockStatus
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Mark product stock as damaged
 */
const markStockDamaged = async (req, res) => {
  try {
    const { quantity, note } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid quantity required' });
    }
    
    const product = await inventoryManager.markDamaged(
      req.params.id,
      quantity,
      note
    );
    
    res.json({
      message: 'Stock marked as damaged',
      product: {
        id: product._id,
        sku: product.sku,
        name: product.name,
        newStock: product.stock,
        stockStatus: product.stockStatus
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Get stock movement history
 */
const getStockHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await inventoryManager.getStockHistory(req.params.id, limit);
    res.json(history);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Bulk update stock for multiple products
 */
const bulkStockUpdate = async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'Updates array required' });
    }
    
    const results = await inventoryManager.bulkUpdateStock(updates);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    res.json({
      message: `Bulk update completed: ${successCount} successful, ${failCount} failed`,
      results
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
  checkUserReview,
  deleteProductReview,
  updateProductRental,
  getRentalProducts,
  checkRentalAvailability,
  bookRental,
  // Inventory management
  getInventoryStatus,
  getReorderList,
  getLowStockAlerts,
  getInventoryStats,
  restockProduct,
  adjustProductStock,
  markStockDamaged,
  getStockHistory,
  bulkStockUpdate
};

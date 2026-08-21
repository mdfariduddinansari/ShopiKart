const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const RecommendationService = require('../services/recommendationService');
const UserBehavior = require('../models/UserBehavior');
const Product = require('../models/Product');

/**
 * @route   GET /api/recommendations/personalized
 * @desc    Get personalized recommendations for logged-in user
 * @access  Private
 */
router.get('/personalized', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    console.log('[Recommendations] Personalized request:', {
      userId: req.user._id,
      userEmail: req.user.email,
      limit
    });
    
    const recommendations = await RecommendationService.getPersonalizedRecommendations(
      req.user._id,
      limit
    );
    
    console.log('[Recommendations] Personalized results:', {
      userId: req.user._id,
      count: recommendations.length,
      productIds: recommendations.map(r => r._id).slice(0, 3)
    });
    
    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations,
      type: 'personalized'
    });
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/trending
 * @desc    Get trending products (public)
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    console.log(`[Recommendations] Fetching trending products, limit: ${limit}`);
    
    const trending = await RecommendationService.getTrendingProducts(limit);
    console.log(`[Recommendations] Found ${trending.length} trending products`);
    
    res.json({
      success: true,
      count: trending.length,
      data: trending,
      type: 'trending'
    });
  } catch (error) {
    console.error('Error getting trending products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending products',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/similar/:productId
 * @desc    Get similar products to a specific product
 * @access  Public
 */
router.get('/similar/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 8;
    
    console.log(`[Recommendations] Fetching similar products for ${productId}, limit: ${limit}`);
    const similarProducts = await RecommendationService.getSimilarProducts(productId, limit);
    console.log(`[Recommendations] Found ${similarProducts.length} similar products`);
    
    res.json({
      success: true,
      count: similarProducts.length,
      data: similarProducts,
      type: 'similar'
    });
  } catch (error) {
    console.error('Error getting similar products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching similar products',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/frequently-bought/:productId
 * @desc    Get products frequently bought together with a specific product
 * @access  Public
 */
router.get('/frequently-bought/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 4;
    
    const products = await RecommendationService.getFrequentlyBoughtTogether(productId, limit);
    
    res.json({
      success: true,
      count: products.length,
      data: products,
      type: 'frequently-bought-together'
    });
  } catch (error) {
    console.error('Error getting frequently bought together:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching frequently bought together',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/also-viewed/:productId
 * @desc    Get products that customers also viewed
 * @access  Public
 */
router.get('/also-viewed/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 6;
    
    const products = await RecommendationService.getCustomersAlsoViewed(productId, limit);
    
    res.json({
      success: true,
      count: products.length,
      data: products,
      type: 'customers-also-viewed'
    });
  } catch (error) {
    console.error('Error getting customers also viewed:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers also viewed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/recently-viewed
 * @desc    Get user's recently viewed products
 * @access  Private
 */
router.get('/recently-viewed', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const recentlyViewed = await RecommendationService.getRecentlyViewed(req.user._id, limit);
    
    res.json({
      success: true,
      count: recentlyViewed.length,
      data: recentlyViewed,
      type: 'recently-viewed'
    });
  } catch (error) {
    console.error('Error getting recently viewed:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recently viewed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/recommendations/track/view
 * @desc    Track a product view
 * @access  Private (optional auth for guests)
 */
router.post('/track/view', optionalAuth, async (req, res) => {
  try {
    const { productId, source = 'direct', timeSpent = 0 } = req.body;
    
    console.log('[Track View] Request received:', { productId, source, timeSpent });
    console.log('[Track View] User:', req.user ? req.user._id : 'No user (guest)');
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Only track for logged-in users
    if (req.user) {
      console.log('[Track View] Creating/finding UserBehavior for user:', req.user._id);
      const behavior = await UserBehavior.findOrCreate(req.user._id);
      console.log('[Track View] UserBehavior found/created:', behavior._id);
      
      await behavior.trackProductView(productId, source, timeSpent);
      console.log('[Track View] Product view tracked successfully');
      
      // Update category preference
      const product = await Product.findById(productId);
      if (product && product.category) {
        await behavior.updateCategoryPreference(product.category, 1);
        console.log('[Track View] Category preference updated:', product.category);
      }
    } else {
      console.log('[Track View] No authenticated user, skipping tracking');
    }

    res.json({
      success: true,
      message: 'View tracked successfully'
    });
  } catch (error) {
    console.error('[Track View] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking view',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/recommendations/track/cart
 * @desc    Track a cart addition
 * @access  Private
 */
router.post('/track/cart', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const behavior = await UserBehavior.findOrCreate(req.user._id);
    
    // Add to cart history
    behavior.cartHistory.push({
      product: productId,
      addedAt: new Date(),
      wasConverted: false
    });

    // Keep only last 50 cart additions
    if (behavior.cartHistory.length > 50) {
      behavior.cartHistory = behavior.cartHistory.slice(-50);
    }

    await behavior.save();

    res.json({
      success: true,
      message: 'Cart action tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking cart action',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/recommendations/track/search
 * @desc    Track a search query
 * @access  Private
 */
router.post('/track/search', protect, async (req, res) => {
  try {
    const { query, clickedProducts = [] } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const behavior = await UserBehavior.findOrCreate(req.user._id);
    
    behavior.searchHistory.push({
      query,
      resultsClicked: clickedProducts,
      timestamp: new Date()
    });

    // Keep only last 100 searches
    if (behavior.searchHistory.length > 100) {
      behavior.searchHistory = behavior.searchHistory.slice(-100);
    }

    await behavior.save();

    res.json({
      success: true,
      message: 'Search tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking search:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking search',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/recommendations/track/wishlist
 * @desc    Track a wishlist addition
 * @access  Private
 */
router.post('/track/wishlist', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const behavior = await UserBehavior.findOrCreate(req.user._id);
    
    // Check if already in wishlist history
    const exists = behavior.wishlistHistory.some(
      w => w.product.toString() === productId
    );
    
    if (!exists) {
      behavior.wishlistHistory.push({
        product: productId,
        addedAt: new Date()
      });
      
      // Update category preference with higher weight
      const product = await Product.findById(productId);
      if (product && product.category) {
        await behavior.updateCategoryPreference(product.category, 3);
      }
      
      await behavior.save();
    }

    res.json({
      success: true,
      message: 'Wishlist action tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking wishlist action',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/guest
 * @desc    Get recommendations for guest users
 * @access  Public
 */
router.get('/guest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    const viewedProducts = req.query.viewed ? req.query.viewed.split(',') : [];
    const categories = req.query.categories ? req.query.categories.split(',') : [];

    const recommendations = await RecommendationService.getGuestRecommendations(
      { viewedProducts, categories },
      limit
    );

    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations,
      type: 'guest'
    });
  } catch (error) {
    console.error('Error getting guest recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching guest recommendations',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/for-you
 * @desc    Get "For You" recommendations (works for both guests and users)
 * @access  Public (optional auth)
 */
router.get('/for-you', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    let recommendations;

    if (req.user) {
      recommendations = await RecommendationService.getPersonalizedRecommendations(
        req.user._id,
        limit
      );
    } else {
      const viewedProducts = req.query.viewed ? req.query.viewed.split(',') : [];
      recommendations = await RecommendationService.getGuestRecommendations(
        { viewedProducts },
        limit
      );
    }

    res.json({
      success: true,
      count: recommendations.length,
      data: recommendations,
      type: req.user ? 'personalized' : 'guest',
      isPersonalized: !!req.user
    });
  } catch (error) {
    console.error('Error getting for-you recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/user-stats
 * @desc    Get user's behavior statistics
 * @access  Private
 */
router.get('/user-stats', protect, async (req, res) => {
  try {
    const behavior = await UserBehavior.findOne({ user: req.user._id });
    
    if (!behavior) {
      return res.json({
        success: true,
        data: {
          totalViews: 0,
          topCategories: [],
          purchasePatterns: null,
          searchCount: 0
        }
      });
    }

    res.json({
      success: true,
      data: {
        totalViews: behavior.productViews.length,
        topCategories: behavior.getTopCategories(5),
        purchasePatterns: behavior.purchasePatterns,
        searchCount: behavior.searchHistory.length,
        recentSearches: behavior.searchHistory.slice(-5).map(s => s.query),
        pricePreferences: behavior.pricePreferences
      }
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
});

module.exports = router;

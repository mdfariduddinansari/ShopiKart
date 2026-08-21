const express = require('express');
const router = express.Router();
const { analyzeReviews } = require('../services/nlpService');

/**
 * Debug endpoint: List all products with review counts
 * GET /api/reviews/debug/products
 */
router.get('/debug/products', async (req, res) => {
  try {
    const Product = require('../models/Product');
    const products = await Product.find().select('name reviews');
    
    const productList = products.map(p => ({
      id: p._id,
      name: p.name,
      reviewCount: p.reviews ? p.reviews.length : 0,
      reviews: p.reviews || []
    }));
    
    res.json(productList);
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

/**
 * Analyze reviews for a product
 * GET /api/reviews/analyze/:productId
 */
router.get('/analyze/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const Product = require('../models/Product');

    // Get product with reviews
    const product = await Product.findById(productId).select('reviews name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Extract review comments
    const reviews = product.reviews || [];
    
    console.log(`[API] Fetching reviews for product "${product.name}" (${productId})`);
    console.log(`[API] Found ${reviews.length} reviews`);

    if (reviews.length === 0) {
      console.log('[API] No reviews found, returning empty analysis');
      return res.json({
        keywords: [],
        summary: {
          totalReviews: 0,
          positiveKeywords: 0,
          negativeKeywords: 0,
          neutralKeywords: 0,
          overallSentiment: 'neutral',
          averageSentiment: 0,
          message: 'No reviews available for this product'
        }
      });
    }

    // Analyze reviews using NLP service
    const analysis = analyzeReviews(reviews);
    
    console.log(`[API] Analysis complete: ${analysis.keywords.length} emotion keywords found`);

    res.json(analysis);
  } catch (error) {
    console.error('Review analysis error:', error);
    res.status(500).json({ message: 'Error analyzing reviews', error: error.message });
  }
});

/**
 * Analyze multiple reviews (for batch analysis)
 * POST /api/reviews/analyze-batch
 */
router.post('/analyze-batch', async (req, res) => {
  try {
    const { reviews } = req.body;

    if (!Array.isArray(reviews)) {
      return res.status(400).json({ message: 'Reviews must be an array' });
    }

    // Analyze reviews
    const analysis = analyzeReviews(reviews);

    res.json(analysis);
  } catch (error) {
    console.error('Batch review analysis error:', error);
    res.status(500).json({ message: 'Error analyzing reviews', error: error.message });
  }
});

module.exports = router;

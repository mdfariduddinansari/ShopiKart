const express = require('express');
const router = express.Router();
const { analyzeTextSentiment } = require('../services/nlpService');
const {
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
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

// Add or update product review (one per user)
router.post('/:id/reviews', protect, addProductReview);

// Check if user has already reviewed
router.get('/:id/reviews/check', protect, checkUserReview);

// Delete user's review
router.delete('/:id/reviews', protect, deleteProductReview);

// Advanced AI Review Analysis System
router.post('/:id/ai-summary', async (req, res) => {
  try {
    const { reviews } = req.body;
    
    if (!reviews || reviews.length === 0) {
      return res.status(400).json({ success: false, message: 'No reviews provided' });
    }

    // Separate verified and unverified reviews
    const verifiedReviews = reviews.filter(r => r.isGenuineBuyer);
    const unverifiedReviews = reviews.filter(r => !r.isGenuineBuyer);
    
    // Calculate ratings
    const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRatings / reviews.length;
    const verifiedAvg = verifiedReviews.length > 0 
      ? verifiedReviews.reduce((sum, r) => sum + r.rating, 0) / verifiedReviews.length 
      : 0;
    
    // Rating Distribution
    const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => ratingDist[r.rating]++);
    
    // Advanced keyword extraction with categories
    const aspectKeywords = {
      quality: ['quality', 'build', 'material', 'durable', 'sturdy', 'premium', 'cheap', 'flimsy', 'solid', 'well-made'],
      value: ['price', 'worth', 'value', 'money', 'expensive', 'affordable', 'overpriced', 'cheap', 'reasonable', 'cost'],
      performance: ['performance', 'works', 'fast', 'slow', 'efficient', 'effective', 'powerful', 'weak', 'functions', 'operates'],
      design: ['design', 'look', 'appearance', 'aesthetic', 'style', 'color', 'size', 'compact', 'bulky', 'beautiful'],
      durability: ['last', 'durable', 'broke', 'broken', 'stopped', 'failed', 'reliable', 'unreliable', 'sturdy', 'fragile'],
      shipping: ['delivery', 'shipping', 'arrived', 'packaging', 'package', 'damaged', 'late', 'fast', 'quick', 'delayed'],
      service: ['customer service', 'support', 'helpful', 'responsive', 'seller', 'communication', 'warranty', 'return']
    };
    
    const positiveWords = ['excellent', 'amazing', 'great', 'love', 'perfect', 'fantastic', 'wonderful', 'superb', 'outstanding', 'awesome', 'best', 'incredible', 'pleased', 'happy', 'satisfied', 'recommend', 'impressed', 'exceeded', 'brilliant'];
    const negativeWords = ['bad', 'terrible', 'poor', 'worst', 'awful', 'horrible', 'disappointed', 'useless', 'waste', 'defective', 'broke', 'broken', 'issue', 'problem', 'hate', 'regret', 'avoid', 'not recommend'];
    
    // Analyze aspects mentioned in reviews
    const aspectMentions = {};
    const aspectSentiments = {};
    
    Object.keys(aspectKeywords).forEach(aspect => {
      aspectMentions[aspect] = 0;
      aspectSentiments[aspect] = { positive: 0, negative: 0, neutral: 0 };
    });
    
    // Sentiment analysis by aspect
    reviews.forEach(review => {
      const text = review.comment.toLowerCase();
      const rating = review.rating;
      
      Object.keys(aspectKeywords).forEach(aspect => {
        const mentioned = aspectKeywords[aspect].some(kw => text.includes(kw));
        if (mentioned) {
          aspectMentions[aspect]++;
          
          // Determine sentiment
          if (rating >= 4) {
            aspectSentiments[aspect].positive++;
          } else if (rating <= 2) {
            aspectSentiments[aspect].negative++;
          } else {
            aspectSentiments[aspect].neutral++;
          }
        }
      });
    });
    
    // Extract key strengths and weaknesses
    const strengths = [];
    const weaknesses = [];
    
    reviews.forEach(review => {
      const text = review.comment;
      const lowerText = text.toLowerCase();
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
      
      sentences.forEach(sentence => {
        const lowerSentence = sentence.toLowerCase();
        const hasPositive = positiveWords.some(w => lowerSentence.includes(w));
        const hasNegative = negativeWords.some(w => lowerSentence.includes(w));
        
        if (review.rating >= 4 && hasPositive && strengths.length < 5) {
          const cleaned = sentence.trim();
          if (cleaned.length > 15 && !strengths.some(s => s.toLowerCase().includes(cleaned.toLowerCase()))) {
            strengths.push(cleaned);
          }
        }
        
        if (review.rating <= 2 && hasNegative && weaknesses.length < 5) {
          const cleaned = sentence.trim();
          if (cleaned.length > 15 && !weaknesses.some(w => w.toLowerCase().includes(cleaned.toLowerCase()))) {
            weaknesses.push(cleaned);
          }
        }
      });
    });
    
    // Generate comprehensive AI summary
    let aiSummary = '';
    
    // Opening statement
    if (verifiedReviews.length > 0) {
      aiSummary += `Analysis of ${reviews.length} customer reviews (${verifiedReviews.length} from verified buyers) reveals `;
    } else {
      aiSummary += `Analysis of ${reviews.length} customer reviews reveals `;
    }
    
    // Overall sentiment
    if (avgRating >= 4.5) {
      aiSummary += 'overwhelmingly positive sentiment. ';
    } else if (avgRating >= 4) {
      aiSummary += 'generally positive feedback with notable satisfaction. ';
    } else if (avgRating >= 3.5) {
      aiSummary += 'mixed but slightly favorable opinions. ';
    } else if (avgRating >= 3) {
      aiSummary += 'divided opinions with both praise and criticism. ';
    } else {
      aiSummary += 'significant concerns and disappointment among customers. ';
    }
    
    // Most discussed aspects
    const topAspects = Object.entries(aspectMentions)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    if (topAspects.length > 0) {
      aiSummary += `Customers primarily discuss ${topAspects.map(([aspect, _]) => aspect).join(', ')}. `;
      
      // Sentiment breakdown for top aspects
      topAspects.forEach(([aspect, count]) => {
        const sentiment = aspectSentiments[aspect];
        const total = sentiment.positive + sentiment.negative + sentiment.neutral;
        if (total > 0) {
          const positivePercent = Math.round((sentiment.positive / total) * 100);
          const negativePercent = Math.round((sentiment.negative / total) * 100);
          
          if (positivePercent >= 70) {
            aiSummary += `${aspect.charAt(0).toUpperCase() + aspect.slice(1)} receives strong praise (${positivePercent}% positive). `;
          } else if (negativePercent >= 50) {
            aiSummary += `${aspect.charAt(0).toUpperCase() + aspect.slice(1)} raises concerns (${negativePercent}% negative). `;
          }
        }
      });
    }
    
    // Verified vs unverified insight
    if (verifiedReviews.length > 0 && unverifiedReviews.length > 0) {
      const verifiedPositive = verifiedReviews.filter(r => r.rating >= 4).length;
      const unverifiedPositive = unverifiedReviews.filter(r => r.rating >= 4).length;
      const verifiedPct = Math.round((verifiedPositive / verifiedReviews.length) * 100);
      const unverifiedPct = unverifiedReviews.length > 0 ? Math.round((unverifiedPositive / unverifiedReviews.length) * 100) : 0;
      
      if (Math.abs(verifiedPct - unverifiedPct) > 20) {
        aiSummary += `Note: Verified buyers show ${verifiedPct > unverifiedPct ? 'higher' : 'lower'} satisfaction (${verifiedPct}%) compared to all customers (${Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100)}%). `;
      }
    }
    
    // Recommendation insight
    const highRating = reviews.filter(r => r.rating >= 4).length;
    const lowRating = reviews.filter(r => r.rating <= 2).length;
    const recommendPct = Math.round((highRating / reviews.length) * 100);
    
    if (recommendPct >= 80) {
      aiSummary += `Highly recommended by ${recommendPct}% of customers.`;
    } else if (recommendPct >= 60) {
      aiSummary += `Recommended by ${recommendPct}% of customers, with some reservations noted.`;
    } else if (recommendPct >= 40) {
      aiSummary += `Mixed recommendations - consider your specific needs carefully.`;
    } else {
      aiSummary += `${100 - recommendPct}% of customers would not recommend this product.`;
    }
    
    // ---- Enhanced Sentiment Score using NLP ----
    // Combine rating-based score with actual NLP sentiment analysis
    const ratingScore = (avgRating / 5) * 100;
    
    // Run NLP sentiment on each review comment
    let nlpSentimentSum = 0;
    let nlpAnalyzedCount = 0;
    reviews.forEach(review => {
      if (review.comment && review.comment.trim().length > 0) {
        const analysis = analyzeTextSentiment(review.comment);
        // comparative ranges roughly from -5 to +5, normalize to 0-100
        const normalized = Math.max(0, Math.min(100, (analysis.comparative + 3) / 6 * 100));
        nlpSentimentSum += normalized;
        nlpAnalyzedCount++;
      }
    });
    
    const nlpScore = nlpAnalyzedCount > 0 ? nlpSentimentSum / nlpAnalyzedCount : ratingScore;
    // Blend: 55% rating-based + 45% NLP-based for a balanced score
    const sentimentScore = Math.round(ratingScore * 0.55 + nlpScore * 0.45);
    
    // ---- Multi-factor Confidence Calculation ----
    // Factor 1: Review volume (0-30 points)
    let volumeScore = 0;
    if (reviews.length >= 15) volumeScore = 30;
    else if (reviews.length >= 8) volumeScore = 25;
    else if (reviews.length >= 5) volumeScore = 20;
    else if (reviews.length >= 3) volumeScore = 14;
    else if (reviews.length >= 2) volumeScore = 8;
    else volumeScore = 4;
    
    // Factor 2: Verified buyer ratio (0-25 points)
    const verifiedRatio = reviews.length > 0 ? verifiedReviews.length / reviews.length : 0;
    let verifiedScore = 0;
    if (verifiedReviews.length >= 5 && verifiedRatio >= 0.5) verifiedScore = 25;
    else if (verifiedReviews.length >= 3 && verifiedRatio >= 0.3) verifiedScore = 20;
    else if (verifiedReviews.length >= 2) verifiedScore = 15;
    else if (verifiedReviews.length >= 1) verifiedScore = 10;
    else verifiedScore = 2;
    
    // Factor 3: Comment quality - avg comment length (0-20 points)
    const avgCommentLength = reviews.reduce((sum, r) => sum + (r.comment ? r.comment.length : 0), 0) / reviews.length;
    let commentScore = 0;
    if (avgCommentLength >= 100) commentScore = 20;
    else if (avgCommentLength >= 60) commentScore = 16;
    else if (avgCommentLength >= 30) commentScore = 12;
    else if (avgCommentLength >= 15) commentScore = 7;
    else commentScore = 3;
    
    // Factor 4: Aspect coverage (0-15 points) - how many aspects mentioned
    const aspectsCovered = Object.values(aspectMentions).filter(c => c > 0).length;
    let aspectCoverScore = 0;
    if (aspectsCovered >= 4) aspectCoverScore = 15;
    else if (aspectsCovered >= 3) aspectCoverScore = 12;
    else if (aspectsCovered >= 2) aspectCoverScore = 9;
    else if (aspectsCovered >= 1) aspectCoverScore = 5;
    else aspectCoverScore = 1;
    
    // Factor 5: Rating diversity - not all same rating (0-10 points)
    const uniqueRatings = new Set(reviews.map(r => r.rating)).size;
    let diversityScore = 0;
    if (uniqueRatings >= 4) diversityScore = 10;
    else if (uniqueRatings >= 3) diversityScore = 8;
    else if (uniqueRatings >= 2) diversityScore = 5;
    else diversityScore = 2;
    
    const totalConfidenceScore = volumeScore + verifiedScore + commentScore + aspectCoverScore + diversityScore;
    // Map to levels: 0-100 total possible
    let confidenceLevel, confidencePercent;
    if (totalConfidenceScore >= 75) {
      confidenceLevel = 'Very High';
      confidencePercent = Math.min(98, 80 + Math.round((totalConfidenceScore - 75) * 0.72));
    } else if (totalConfidenceScore >= 55) {
      confidenceLevel = 'High';
      confidencePercent = 65 + Math.round((totalConfidenceScore - 55) * 0.75);
    } else if (totalConfidenceScore >= 35) {
      confidenceLevel = 'Medium';
      confidencePercent = 45 + Math.round((totalConfidenceScore - 35) * 1.0);
    } else {
      confidenceLevel = 'Low';
      confidencePercent = Math.max(15, 15 + Math.round((totalConfidenceScore) * 0.86));
    }
    
    res.json({
      success: true,
      data: {
        aiSummary,
        sentimentScore,
        confidenceLevel,
        confidencePercent,
        confidenceFactors: {
          reviewVolume: { score: volumeScore, max: 30 },
          verifiedBuyers: { score: verifiedScore, max: 25 },
          commentQuality: { score: commentScore, max: 20 },
          aspectCoverage: { score: aspectCoverScore, max: 15 },
          ratingDiversity: { score: diversityScore, max: 10 }
        },
        ratingDistribution: ratingDist,
        aspectAnalysis: Object.entries(aspectMentions)
          .filter(([_, count]) => count > 0)
          .map(([aspect, count]) => ({
            aspect,
            mentions: count,
            sentiment: aspectSentiments[aspect],
            positiveRate: Math.round((aspectSentiments[aspect].positive / (aspectSentiments[aspect].positive + aspectSentiments[aspect].negative + aspectSentiments[aspect].neutral)) * 100)
          }))
          .sort((a, b) => b.mentions - a.mentions),
        keyStrengths: strengths.slice(0, 5),
        keyWeaknesses: weaknesses.slice(0, 5),
        statistics: {
          totalReviews: reviews.length,
          verifiedReviews: verifiedReviews.length,
          averageRating: avgRating.toFixed(1),
          verifiedAverage: verifiedAvg.toFixed(1),
          recommendationRate: recommendPct,
          positiveReviews: highRating,
          negativeReviews: lowRating
        }
      }
    });
  } catch (error) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({ success: false, message: 'Error generating AI summary' });
  }
});

// Rental routes
router.get('/rental/products', getRentalProducts);
router.put('/:id/rental', protect, admin, updateProductRental);
router.post('/rental/check-availability', checkRentalAvailability);
router.post('/rental/book', protect, bookRental);

// ===== INVENTORY MANAGEMENT ROUTES =====

// Inventory dashboard and statistics
router.get('/inventory/stats', protect, admin, getInventoryStats);
router.get('/inventory/reorder-list', protect, admin, getReorderList);
router.get('/inventory/low-stock-alerts', protect, admin, getLowStockAlerts);

// Product-specific inventory operations
router.get('/:id/inventory/status', protect, admin, getInventoryStatus);
router.get('/:id/inventory/history', protect, admin, getStockHistory);
router.post('/:id/inventory/restock', protect, admin, restockProduct);
router.post('/:id/inventory/adjust', protect, admin, adjustProductStock);
router.post('/:id/inventory/damaged', protect, admin, markStockDamaged);

// Bulk operations
router.post('/inventory/bulk-update', protect, admin, bulkStockUpdate);

module.exports = router;

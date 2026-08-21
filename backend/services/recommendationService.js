/**
 * Advanced Recommendation Service
 * 
 * Implements multiple recommendation algorithms:
 * 1. Collaborative Filtering - "Users who bought X also bought Y"
 * 2. Content-Based Filtering - Similar products based on attributes
 * 3. Hybrid Approach - Combining multiple signals
 * 4. Trending/Popular Products
 * 5. Personalized recommendations based on user behavior
 */

const Product = require('../models/Product');
const Order = require('../models/order');
const UserBehavior = require('../models/UserBehavior');
const mongoose = require('mongoose');

class RecommendationService {
  
  /**
   * Get personalized recommendations for a user
   * Combines multiple recommendation strategies
   */
  static async getPersonalizedRecommendations(userId, limit = 12) {
    try {
      console.log('[RecommendationService] Getting personalized recommendations for user:', userId);
      
      const behavior = await UserBehavior.findOne({ user: userId });
      
      console.log('[RecommendationService] User behavior:', {
        hasBehavior: !!behavior,
        viewCount: behavior?.productViews?.length || 0,
        categoryPreferences: behavior?.categoryPreferences?.length || 0
      });
      
      if (!behavior || behavior.productViews.length === 0) {
        // New user - return trending products
        console.log('[RecommendationService] New user, returning trending products');
        return await this.getTrendingProducts(limit);
      }

      // Get recommendations from different sources
      console.log('[RecommendationService] Fetching from multiple recommendation sources...');
      const [
        collaborativeRecs,
        contentBasedRecs,
        categoryRecs,
        recentlyViewedSimilar
      ] = await Promise.all([
        this.getCollaborativeRecommendations(userId, Math.ceil(limit / 3)),
        this.getContentBasedRecommendations(userId, Math.ceil(limit / 3)),
        this.getCategoryBasedRecommendations(userId, Math.ceil(limit / 3)),
        this.getSimilarToRecentlyViewed(userId, Math.ceil(limit / 3))
      ]);

      console.log('[RecommendationService] Recommendations from sources:', {
        collaborative: collaborativeRecs.length,
        contentBased: contentBasedRecs.length,
        category: categoryRecs.length,
        recentlyViewedSimilar: recentlyViewedSimilar.length
      });

      // Merge and deduplicate recommendations
      const allRecs = this.mergeRecommendations([
        { items: collaborativeRecs, weight: 0.35 },
        { items: contentBasedRecs, weight: 0.25 },
        { items: categoryRecs, weight: 0.20 },
        { items: recentlyViewedSimilar, weight: 0.20 }
      ]);

      console.log('[RecommendationService] Merged recommendations count:', allRecs.length);

      // Filter out already purchased products only (keep recently viewed — they are relevant)
      const purchasedProducts = await this.getUserPurchasedProducts(userId);
      
      console.log('[RecommendationService] Filtering out purchased:', {
        purchasedCount: purchasedProducts.length
      });
      
      const filteredRecs = allRecs.filter(rec => 
        !purchasedProducts.includes(rec.product.toString())
      );

      console.log('[RecommendationService] Filtered recommendations count:', filteredRecs.length);

      // Get full product details (don't filter by stock — let frontend show stock status)
      let productIds = filteredRecs.slice(0, limit).map(r => r.product);
      let products = await Product.find({ 
        _id: { $in: productIds }
      }).lean();

      console.log('[RecommendationService] Products from filtered recs:', products.length);

      // If we have too few results, augment with trending products
      if (products.length < Math.ceil(limit / 2)) {
        console.log('[RecommendationService] Too few personalized results, augmenting with trending');
        const trending = await this.getTrendingProducts(limit);
        const existingIds = new Set(products.map(p => p._id.toString()));
        const purchasedSet = new Set(purchasedProducts);
        const newProducts = trending.filter(p => 
          !existingIds.has(p._id.toString()) && !purchasedSet.has(p._id.toString())
        );
        products = [...products, ...newProducts].slice(0, limit);
        console.log('[RecommendationService] After augmenting with trending:', products.length);
      }

      console.log('[RecommendationService] Final products returned:', products.length);

      // Sort by recommendation score
      const sorted = products.sort((a, b) => {
        const scoreA = filteredRecs.find(r => r.product.toString() === a._id.toString())?.score || 0;
        const scoreB = filteredRecs.find(r => r.product.toString() === b._id.toString())?.score || 0;
        return scoreB - scoreA;
      });

      return sorted;

    } catch (error) {
      console.error('[RecommendationService] Error getting personalized recommendations:', error);
      return await this.getTrendingProducts(limit);
    }
  }

  /**
   * Collaborative Filtering - "Users who bought X also bought Y"
   * Uses purchase history to find similar user patterns
   */
  static async getCollaborativeRecommendations(userId, limit = 10) {
    try {
      // Get user's purchase history
      const userOrders = await Order.find({ user: userId }).select('orderItems.product');
      const userProducts = userOrders.flatMap(o => o.orderItems.map(i => i.product.toString()));
      
      if (userProducts.length === 0) return [];

      // Find other users who bought the same products
      const similarUsers = await Order.aggregate([
        {
          $match: {
            user: { $ne: new mongoose.Types.ObjectId(userId) },
            'orderItems.product': { $in: userProducts.map(p => new mongoose.Types.ObjectId(p)) }
          }
        },
        { $unwind: '$orderItems' },
        {
          $group: {
            _id: '$user',
            commonProducts: { 
              $sum: { 
                $cond: [
                  { $in: ['$orderItems.product', userProducts.map(p => new mongoose.Types.ObjectId(p))] },
                  1, 
                  0
                ]
              }
            },
            allProducts: { $addToSet: '$orderItems.product' }
          }
        },
        { $match: { commonProducts: { $gte: 1 } } },
        { $sort: { commonProducts: -1 } },
        { $limit: 50 }
      ]);

      // Get products bought by similar users but not by current user
      const recommendedProducts = {};
      
      for (const similar of similarUsers) {
        const newProducts = similar.allProducts.filter(
          p => !userProducts.includes(p.toString())
        );
        
        for (const product of newProducts) {
          const productId = product.toString();
          if (!recommendedProducts[productId]) {
            recommendedProducts[productId] = {
              product: productId,
              score: 0,
              source: 'collaborative'
            };
          }
          // Weight by similarity (number of common products)
          recommendedProducts[productId].score += similar.commonProducts;
        }
      }

      return Object.values(recommendedProducts)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error in collaborative filtering:', error);
      return [];
    }
  }

  /**
   * Content-Based Filtering
   * Recommends products similar to what user has interacted with
   */
  static async getContentBasedRecommendations(userId, limit = 10) {
    try {
      const behavior = await UserBehavior.findOne({ user: userId });
      if (!behavior) return [];

      // Get user's most interacted products
      const topViewed = behavior.productViews
        .sort((a, b) => (b.viewCount * 2 + b.totalTimeSpent / 60) - (a.viewCount * 2 + a.totalTimeSpent / 60))
        .slice(0, 10)
        .map(v => v.product);

      if (topViewed.length === 0) return [];

      // Get details of top viewed products
      const viewedProducts = await Product.find({ _id: { $in: topViewed } }).lean();

      // Extract features for similarity matching
      const categories = [...new Set(viewedProducts.map(p => p.category))];
      const brands = [...new Set(viewedProducts.filter(p => p.brand).map(p => p.brand))];
      const priceRange = {
        min: Math.min(...viewedProducts.map(p => p.price)) * 0.5,
        max: Math.max(...viewedProducts.map(p => p.price)) * 1.5
      };

      // Find similar products (broader search — don't require stock > 0)
      let similarProducts = await Product.find({
        _id: { $nin: topViewed },
        $or: [
          { category: { $in: categories } },
          { brand: { $in: brands } }
        ],
        price: { $gte: priceRange.min, $lte: priceRange.max }
      }).limit(limit * 3).lean();

      // If still too few, broaden to just category match without price constraint
      if (similarProducts.length < limit) {
        const existingIds = new Set(similarProducts.map(p => p._id.toString()));
        const broader = await Product.find({
          _id: { $nin: [...topViewed, ...similarProducts.map(p => p._id)] },
          category: { $in: categories }
        }).sort({ rating: -1 }).limit(limit).lean();
        similarProducts = [...similarProducts, ...broader.filter(p => !existingIds.has(p._id.toString()))];
      }

      // Calculate similarity scores
      const scoredProducts = similarProducts.map(product => {
        let score = 0;
        
        // Category match
        if (categories.includes(product.category)) {
          score += 30;
        }
        
        // Brand match
        if (brands.includes(product.brand)) {
          score += 25;
        }
        
        // Rating boost
        score += (product.rating || 0) * 5;
        
        // Price similarity
        const avgPrice = viewedProducts.reduce((sum, p) => sum + p.price, 0) / viewedProducts.length;
        const priceDiff = Math.abs(product.price - avgPrice) / avgPrice;
        score += Math.max(0, 20 - priceDiff * 20);
        
        return {
          product: product._id.toString(),
          score,
          source: 'content-based'
        };
      });

      return scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error in content-based filtering:', error);
      return [];
    }
  }

  /**
   * Category-Based Recommendations
   * Based on user's category preferences
   */
  static async getCategoryBasedRecommendations(userId, limit = 10) {
    try {
      const behavior = await UserBehavior.findOne({ user: userId });
      if (!behavior || behavior.categoryPreferences.length === 0) return [];

      const topCategories = behavior.getTopCategories(3);
      
      const products = await Product.aggregate([
        {
          $match: {
            category: { $in: topCategories }
          }
        },
        {
          $addFields: {
            categoryRank: {
              $indexOfArray: [topCategories, '$category']
            }
          }
        },
        { $sort: { categoryRank: 1, rating: -1, numReviews: -1 } },
        { $limit: limit * 2 }
      ]);

      return products.map((p, idx) => ({
        product: p._id.toString(),
        score: (limit * 2 - idx) + (p.rating || 0) * 10,
        source: 'category-based'
      })).slice(0, limit);

    } catch (error) {
      console.error('Error in category-based recommendations:', error);
      return [];
    }
  }

  /**
   * Similar to Recently Viewed
   * Find products similar to what user recently viewed
   */
  static async getSimilarToRecentlyViewed(userId, limit = 10) {
    try {
      const behavior = await UserBehavior.findOne({ user: userId });
      if (!behavior) return [];

      const recentlyViewed = behavior.getRecentlyViewed(5);
      if (recentlyViewed.length === 0) return [];

      const viewedProducts = await Product.find({ _id: { $in: recentlyViewed } }).lean();
      const categories = viewedProducts.map(p => p.category);

      const similarProducts = await Product.find({
        _id: { $nin: recentlyViewed },
        category: { $in: categories }
      })
      .sort({ rating: -1, numReviews: -1 })
      .limit(limit)
      .lean();

      return similarProducts.map((p, idx) => ({
        product: p._id.toString(),
        score: limit - idx + (p.rating || 0) * 5,
        source: 'recently-viewed-similar'
      }));

    } catch (error) {
      console.error('Error getting similar to recently viewed:', error);
      return [];
    }
  }

  /**
   * Get Similar Products for a specific product
   * Used on product detail pages
   */
  static async getSimilarProducts(productId, limit = 8) {
    try {
      const product = await Product.findById(productId).lean();
      if (!product) {
        // Fallback: return trending products if product not found
        return await this.getTrendingProducts(limit);
      }

      // Find similar products based on category, brand, and price range
      const priceRange = {
        min: product.price * 0.3,
        max: product.price * 3
      };

      let similarProducts = await Product.find({
        _id: { $ne: productId },
        $or: [
          { category: product.category },
          { brand: product.brand }
        ]
      })
      .sort({ rating: -1, numReviews: -1 })
      .limit(limit * 2)
      .lean();

      // If no similar products found, get any other products
      if (similarProducts.length === 0) {
        similarProducts = await Product.find({
          _id: { $ne: productId }
        })
        .sort({ rating: -1, numReviews: -1 })
        .limit(limit)
        .lean();
      }

      // Score and sort by similarity
      const scoredProducts = similarProducts.map(p => {
        let score = 0;
        
        if (p.category === product.category) score += 40;
        if (p.brand === product.brand) score += 30;
        
        const priceDiff = Math.abs(p.price - product.price) / product.price;
        score += Math.max(0, 20 - priceDiff * 20);
        
        score += (p.rating || 0) * 2;
        
        return { ...p, similarityScore: score };
      });

      return scoredProducts
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting similar products:', error);
      // Return trending as fallback
      try {
        return await this.getTrendingProducts(limit);
      } catch (e) {
        return [];
      }
    }
  }

  /**
   * "Frequently Bought Together"
   * Products often purchased in the same order
   */
  static async getFrequentlyBoughtTogether(productId, limit = 4) {
    try {
      const productObjectId = new mongoose.Types.ObjectId(productId);

      // Find orders containing this product
      const coProducts = await Order.aggregate([
        {
          $match: {
            'orderItems.product': productObjectId
          }
        },
        { $unwind: '$orderItems' },
        {
          $match: {
            'orderItems.product': { $ne: productObjectId }
          }
        },
        {
          $group: {
            _id: '$orderItems.product',
            frequency: { $sum: 1 }
          }
        },
        { $sort: { frequency: -1 } },
        { $limit: limit }
      ]);

      if (coProducts.length === 0) return [];

      const productIds = coProducts.map(p => p._id);
      const products = await Product.find({
        _id: { $in: productIds }
      }).lean();

      // Sort by frequency
      return products.sort((a, b) => {
        const freqA = coProducts.find(p => p._id.toString() === a._id.toString())?.frequency || 0;
        const freqB = coProducts.find(p => p._id.toString() === b._id.toString())?.frequency || 0;
        return freqB - freqA;
      });

    } catch (error) {
      console.error('Error getting frequently bought together:', error);
      return [];
    }
  }

  /**
   * Get Trending Products
   * Based on recent purchases and views
   */
  static async getTrendingProducts(limit = 12) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Get purchase counts from recent orders
      const purchaseTrends = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        { $unwind: '$orderItems' },
        {
          $group: {
            _id: '$orderItems.product',
            purchaseCount: { $sum: '$orderItems.qty' }
          }
        },
        { $sort: { purchaseCount: -1 } },
        { $limit: limit * 2 }
      ]);

      // Get view counts from user behavior
      const viewTrends = await UserBehavior.aggregate([
        { $unwind: '$productViews' },
        {
          $match: {
            'productViews.lastViewed': { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: '$productViews.product',
            viewCount: { $sum: '$productViews.viewCount' }
          }
        },
        { $sort: { viewCount: -1 } },
        { $limit: limit * 2 }
      ]);

      // Combine scores
      const trendScores = {};
      
      purchaseTrends.forEach(p => {
        trendScores[p._id.toString()] = {
          product: p._id,
          score: p.purchaseCount * 10
        };
      });

      viewTrends.forEach(v => {
        const id = v._id.toString();
        if (trendScores[id]) {
          trendScores[id].score += v.viewCount;
        } else {
          trendScores[id] = {
            product: v._id,
            score: v.viewCount
          };
        }
      });

      const topTrending = Object.values(trendScores)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      if (topTrending.length === 0) {
        // Fallback to highest rated products (including those with stock 0 or stock field issues)
        const products = await Product.find({})
          .sort({ rating: -1, numReviews: -1 })
          .limit(limit)
          .lean();
        return products;
      }

      const productIds = topTrending.map(t => t.product);
      let products = await Product.find({
        _id: { $in: productIds }
      }).lean();
      
      // If too few products found with IDs, augment with highest rated
      if (products.length < Math.ceil(limit / 2)) {
        const existingIds = new Set(products.map(p => p._id.toString()));
        const filler = await Product.find({
          _id: { $nin: [...existingIds].map(id => new mongoose.Types.ObjectId(id)) }
        })
          .sort({ rating: -1, numReviews: -1 })
          .limit(limit - products.length)
          .lean();
        products = [...products, ...filler];
      }
      
      return products.slice(0, limit);

    } catch (error) {
      console.error('Error getting trending products:', error);
      // Ultimate fallback - just return any products
      try {
        return await Product.find({})
          .sort({ rating: -1 })
          .limit(limit)
          .lean();
      } catch (e) {
        console.error('Fallback also failed:', e);
        return [];
      }
    }
  }

  /**
   * Get Recently Viewed Products for a user
   */
  static async getRecentlyViewed(userId, limit = 10) {
    try {
      const behavior = await UserBehavior.findOne({ user: userId })
        .populate({
          path: 'productViews.product'
        });

      if (!behavior) return [];

      return behavior.productViews
        .filter(v => v.product) // Filter out deleted products
        .sort((a, b) => b.lastViewed - a.lastViewed)
        .slice(0, limit)
        .map(v => v.product);

    } catch (error) {
      console.error('Error getting recently viewed:', error);
      return [];
    }
  }

  /**
   * Get "Customers Also Viewed" recommendations
   */
  static async getCustomersAlsoViewed(productId, limit = 6) {
    try {
      const productObjectId = new mongoose.Types.ObjectId(productId);

      // Find users who viewed this product and what else they viewed
      const alsoViewed = await UserBehavior.aggregate([
        {
          $match: {
            'productViews.product': productObjectId
          }
        },
        { $unwind: '$productViews' },
        {
          $match: {
            'productViews.product': { $ne: productObjectId }
          }
        },
        {
          $group: {
            _id: '$productViews.product',
            viewCount: { $sum: '$productViews.viewCount' }
          }
        },
        { $sort: { viewCount: -1 } },
        { $limit: limit }
      ]);

      if (alsoViewed.length === 0) return [];

      const productIds = alsoViewed.map(p => p._id);
      return await Product.find({
        _id: { $in: productIds }
      }).lean();

    } catch (error) {
      console.error('Error getting customers also viewed:', error);
      return [];
    }
  }

  /**
   * Merge recommendations from multiple sources with weighted scoring
   */
  static mergeRecommendations(sources) {
    const merged = {};

    for (const source of sources) {
      for (const item of source.items) {
        const id = item.product.toString();
        if (merged[id]) {
          merged[id].score += item.score * source.weight;
          merged[id].sources.push(item.source);
        } else {
          merged[id] = {
            product: id,
            score: item.score * source.weight,
            sources: [item.source]
          };
        }
      }
    }

    return Object.values(merged).sort((a, b) => b.score - a.score);
  }

  /**
   * Get products a user has already purchased
   */
  static async getUserPurchasedProducts(userId) {
    const orders = await Order.find({ user: userId }).select('orderItems.product');
    return orders.flatMap(o => o.orderItems.map(i => i.product.toString()));
  }

  /**
   * Update user behavior after a purchase
   */
  static async updatePurchaseBehavior(userId, orderItems) {
    try {
      const behavior = await UserBehavior.findOrCreate(userId);
      
      // Get product details for category preferences
      const productIds = orderItems.map(i => i.product);
      const products = await Product.find({ _id: { $in: productIds } }).lean();

      // Update category preferences
      for (const product of products) {
        if (product.category) {
          await behavior.updateCategoryPreference(product.category, 10);
        }
      }

      // Update purchase patterns
      const orderValue = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
      
      behavior.purchasePatterns.totalPurchases += 1;
      behavior.purchasePatterns.lastPurchase = new Date();
      
      // Update average order value
      const currentAvg = behavior.purchasePatterns.avgOrderValue || 0;
      const totalPurchases = behavior.purchasePatterns.totalPurchases;
      behavior.purchasePatterns.avgOrderValue = 
        (currentAvg * (totalPurchases - 1) + orderValue) / totalPurchases;

      // Update purchase frequency
      if (totalPurchases >= 10) {
        behavior.purchasePatterns.purchaseFrequency = 'very_frequent';
      } else if (totalPurchases >= 5) {
        behavior.purchasePatterns.purchaseFrequency = 'frequent';
      } else if (totalPurchases >= 2) {
        behavior.purchasePatterns.purchaseFrequency = 'occasional';
      }

      // Mark cart items as converted
      for (const item of orderItems) {
        const cartItem = behavior.cartHistory.find(
          c => c.product.toString() === item.product.toString() && !c.wasConverted
        );
        if (cartItem) {
          cartItem.wasConverted = true;
        }
      }

      await behavior.save();
    } catch (error) {
      console.error('Error updating purchase behavior:', error);
    }
  }

  /**
   * Get recommendations for anonymous/guest users
   * Based on session data or just trending products
   */
  static async getGuestRecommendations(sessionData = {}, limit = 12) {
    try {
      const { viewedProducts = [], categories = [] } = sessionData;

      if (viewedProducts.length > 0) {
        // Get similar products to what they've viewed
        const viewedProductsData = await Product.find({ 
          _id: { $in: viewedProducts } 
        }).lean();

        const viewedCategories = [...new Set(viewedProductsData.map(p => p.category))];
        
        const recommendations = await Product.find({
          _id: { $nin: viewedProducts },
          category: { $in: viewedCategories }
        })
        .sort({ rating: -1, numReviews: -1 })
        .limit(limit)
        .lean();

        if (recommendations.length >= limit / 2) {
          return recommendations;
        }
      }

      // Fallback to trending products
      return await this.getTrendingProducts(limit);
    } catch (error) {
      console.error('Error getting guest recommendations:', error);
      return await this.getTrendingProducts(limit);
    }
  }
}

module.exports = RecommendationService;

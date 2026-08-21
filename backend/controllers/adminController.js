

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/order');
const RentalBooking = require('../models/RentalBooking');
const UserBehavior = require('../models/UserBehavior');


const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    
    // Enrich users with order count
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ user: user._id });
        return {
          ...user.toObject(),
          orderCount,
          totalPurchases: orderCount,
        };
      })
    );
    
    res.json(enrichedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.isAdmin = req.body.isAdmin;
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const createProduct = async (req, res) => {
  try {
    console.log('Creating product with data:', JSON.stringify(req.body, null, 2));
    const product = new Product(req.body);
    console.log('Product instance before save:', JSON.stringify(product.toObject(), null, 2));
    const saved = await product.save();
    console.log('Product saved successfully:', saved._id);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: error.message, details: error.toString() });
  }
};


const updateProduct = async (req, res) => {
  try {
    console.log('Updating product with data:', JSON.stringify(req.body, null, 2));
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    Object.assign(product, req.body);
    console.log('Product instance before update save:', JSON.stringify(product.toObject(), null, 2));
    const updated = await product.save();
    console.log('Product updated successfully:', updated._id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: error.message, details: error.toString() });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getAdminStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();

    res.json({ totalProducts, totalUsers, totalOrders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Advanced Analytics Endpoints
const getSalesAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year
    
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 30); // Last 30 days
        break;
      case 'week':
        startDate.setDate(now.getDate() - 84); // Last 12 weeks
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 2); // Last 2 years
        break;
      case 'month':
      default:
        startDate.setMonth(now.getMonth() - 12); // Last 12 months
    }

    // Total Revenue
    const revenueData = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, isPaid: true } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          averageOrderValue: { $avg: '$totalPrice' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // Revenue Over Time
    let groupByFormat;
    switch (period) {
      case 'day':
        groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case 'week':
        groupByFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
        break;
      case 'year':
        groupByFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
        break;
      case 'month':
      default:
        groupByFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    }

    const revenueOverTime = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, isPaid: true } },
      {
        $group: {
          _id: groupByFormat,
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top Selling Products
    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, isPaid: true } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          totalQuantity: { $sum: '$orderItems.qty' },
          totalRevenue: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } },
          productName: { $first: '$orderItems.name' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    // Order Status Distribution
    const ordersByStatus = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            isPaid: '$isPaid',
            isDelivered: '$isDelivered'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Category Performance
    const categoryPerformance = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, isPaid: true } },
      { $unwind: '$orderItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $group: {
          _id: '$productDetails.category',
          totalRevenue: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } },
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: '$orderItems.qty' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({
      summary: revenueData[0] || { totalRevenue: 0, averageOrderValue: 0, totalOrders: 0 },
      revenueOverTime,
      topProducts,
      ordersByStatus,
      categoryPerformance,
      period
    });
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getRentalAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 84);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 2);
        break;
      case 'month':
      default:
        startDate.setMonth(now.getMonth() - 12);
    }

    // Total Rental Revenue
    const rentalRevenue = await RentalBooking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalCost' },
          averageBookingValue: { $avg: '$totalCost' },
          totalBookings: { $sum: 1 },
          averageDuration: { $avg: '$durationDays' }
        }
      }
    ]);

    // Rental Status Distribution
    const bookingsByStatus = await RentalBooking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalCost' }
        }
      }
    ]);

    // Popular Rental Items
    const popularRentals = await RentalBooking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$rentalItem',
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalCost' },
          averageDuration: { $avg: '$durationDays' }
        }
      },
      {
        $lookup: {
          from: 'rentalitems',
          localField: '_id',
          foreignField: '_id',
          as: 'itemDetails'
        }
      },
      { $unwind: { path: '$itemDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          itemName: { $ifNull: ['$itemDetails.name', 'Unknown Item'] },
          totalBookings: 1,
          totalRevenue: 1,
          averageDuration: 1
        }
      },
      { $sort: { totalBookings: -1 } },
      { $limit: 10 }
    ]);

    // Rental Revenue Over Time
    let groupByFormat;
    switch (period) {
      case 'day':
        groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case 'week':
        groupByFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
        break;
      case 'year':
        groupByFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
        break;
      case 'month':
      default:
        groupByFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    }

    const rentalRevenueOverTime = await RentalBooking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: groupByFormat,
          revenue: { $sum: '$totalCost' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      summary: rentalRevenue[0] || { totalRevenue: 0, averageBookingValue: 0, totalBookings: 0, averageDuration: 0 },
      bookingsByStatus,
      popularRentals,
      rentalRevenueOverTime,
      period
    });
  } catch (error) {
    console.error('Rental analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getCustomerBehaviorAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 84);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 2);
        break;
      case 'month':
      default:
        startDate.setMonth(now.getMonth() - 12);
    }

    // New vs Returning Customers
    const newVsReturning = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, isPaid: true } },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' }
        }
      },
      {
        $group: {
          _id: { $cond: [{ $eq: ['$orderCount', 1] }, 'new', 'returning'] },
          customers: { $sum: 1 },
          totalRevenue: { $sum: '$totalSpent' }
        }
      }
    ]);

    // Top Customers
    const topCustomers = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, isPaid: true, user: { $exists: true } } },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          name: '$userDetails.name',
          email: '$userDetails.email',
          totalOrders: 1,
          totalSpent: 1
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    // Most Searched Terms
    const topSearches = await UserBehavior.aggregate([
      { $unwind: '$searchHistory' },
      { $match: { 'searchHistory.timestamp': { $gte: startDate } } },
      {
        $group: {
          _id: { $toLower: '$searchHistory.query' },
          searchCount: { $sum: 1 },
          lastSearched: { $max: '$searchHistory.timestamp' }
        }
      },
      { $sort: { searchCount: -1 } },
      { $limit: 15 }
    ]);

    // Most Viewed Products
    const mostViewedProducts = await UserBehavior.aggregate([
      { $unwind: '$productViews' },
      { $match: { 'productViews.lastViewed': { $gte: startDate } } },
      {
        $group: {
          _id: '$productViews.product',
          totalViews: { $sum: '$productViews.viewCount' },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          totalViews: 1,
          uniqueViewers: { $size: '$uniqueUsers' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productName: { $ifNull: ['$productDetails.name', 'Unknown Product'] },
          totalViews: 1,
          uniqueViewers: 1
        }
      },
      { $sort: { totalViews: -1 } },
      { $limit: 10 }
    ]);

    // Category Preferences
    const categoryPreferences = await UserBehavior.aggregate([
      { $unwind: '$categoryPreferences' },
      {
        $group: {
          _id: '$categoryPreferences.category',
          avgInterestScore: { $avg: '$categoryPreferences.interestScore' },
          totalUsers: { $sum: 1 }
        }
      },
      { $sort: { avgInterestScore: -1 } },
      { $limit: 10 }
    ]);

    // Customer Engagement Over Time
    let groupByFormat;
    switch (period) {
      case 'day':
        groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case 'week':
        groupByFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
        break;
      case 'year':
        groupByFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
        break;
      case 'month':
      default:
        groupByFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    }

    const engagementOverTime = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: groupByFormat,
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      newVsReturning,
      topCustomers,
      topSearches,
      mostViewedProducts,
      categoryPreferences,
      engagementOverTime,
      period
    });
  } catch (error) {
    console.error('Customer behavior analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  updateUserRole,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminStats,
  getSalesAnalytics,
  getRentalAnalytics,
  getCustomerBehaviorAnalytics,
};

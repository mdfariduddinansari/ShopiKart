const mongoose = require('mongoose');
const Order = require('./models/order');
const RentalBooking = require('./models/RentalBooking');
const User = require('./models/User');
const Product = require('./models/Product');

mongoose.connect('mongodb://localhost:27017/shopikart', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkData() {
  try {
    const orderCount = await Order.countDocuments();
    const rentalCount = await RentalBooking.countDocuments();
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    
    console.log('\n========== DATABASE STATS ==========');
    console.log(`📦 Total Products: ${productCount}`);
    console.log(`👥 Total Users: ${userCount}`);
    console.log(`🛒 Total Orders: ${orderCount}`);
    console.log(`🏠 Total Rental Bookings: ${rentalCount}`);
    console.log('===================================\n');
    
    if (orderCount > 0) {
      const recentOrders = await Order.find().limit(3).sort({ createdAt: -1 });
      console.log('Recent Orders:');
      recentOrders.forEach((order, i) => {
        console.log(`  ${i + 1}. Order ${order._id} - ₹${order.totalPrice} - ${order.isPaid ? '✅ Paid' : '❌ Unpaid'}`);
      });
      console.log('');
    }
    
    if (rentalCount > 0) {
      const recentRentals = await RentalBooking.find().limit(3).sort({ createdAt: -1 });
      console.log('Recent Rentals:');
      recentRentals.forEach((rental, i) => {
        console.log(`  ${i + 1}. Booking ${rental._id} - ₹${rental.totalCost} - ${rental.status}`);
      });
      console.log('');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();

/**
 * Fix Delivered Orders - Sets deliveredAt for orders marked as delivered but missing the timestamp
 * This fixes legacy orders that were marked delivered before the return system was implemented
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/order');

async function fixDeliveredOrders() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find orders that are delivered but missing deliveredAt timestamp
    const ordersToFix = await Order.find({
      $or: [
        { isDelivered: true, deliveredAt: { $exists: false } },
        { isDelivered: true, deliveredAt: null },
        { status: 'delivered', isDelivered: false },
        { status: 'delivered', deliveredAt: null }
      ]
    });

    console.log(`📦 Found ${ordersToFix.length} orders that need fixing\n`);

    if (ordersToFix.length === 0) {
      console.log('✅ All orders are properly configured! No fixes needed.');
      await mongoose.connection.close();
      return;
    }

    let fixed = 0;
    for (const order of ordersToFix) {
      console.log(`Fixing Order: ${order._id}`);
      console.log(`  Current status: ${order.status}`);
      console.log(`  Current isDelivered: ${order.isDelivered}`);
      console.log(`  Current deliveredAt: ${order.deliveredAt || 'NOT SET'}`);

      // Set deliveredAt to updatedAt or createdAt as a reasonable estimate
      const estimatedDeliveryDate = order.updatedAt || order.createdAt;
      
      if (order.status === 'delivered') {
        order.isDelivered = true;
      }
      
      if (order.isDelivered && !order.deliveredAt) {
        order.deliveredAt = estimatedDeliveryDate;
      }

      await order.save();
      fixed++;

      console.log(`  ✅ Fixed! New deliveredAt: ${order.deliveredAt}`);
      console.log('');
    }

    console.log(`\n✅ Fixed ${fixed} orders successfully!`);
    console.log('\n📊 Summary:');
    console.log(`  - Total orders checked: ${ordersToFix.length}`);
    console.log(`  - Orders fixed: ${fixed}`);
    console.log('\n💡 Note: deliveredAt was set to updatedAt/createdAt as an estimate.');
    console.log('   For accurate return eligibility, you may want to adjust dates manually.\n');

    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the fix
fixDeliveredOrders();

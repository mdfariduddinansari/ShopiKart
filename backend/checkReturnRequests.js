/**
 * Diagnostic script to check return requests in database
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/order');
const User = require('./models/User');

async function checkReturnRequests() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find all orders with returnStatus not 'none'
    const returnOrders = await Order.find({ 
      returnStatus: { $ne: 'none' } 
    })
    .populate('user', 'name email')
    .sort({ returnRequestedAt: -1 });

    console.log(`📊 Found ${returnOrders.length} orders with return status\n`);
    console.log('═'.repeat(80));

    if (returnOrders.length === 0) {
      console.log('✅ No return requests found in database');
    } else {
      returnOrders.forEach((order, index) => {
        console.log(`\n${index + 1}. Order ID: ${order._id}`);
        console.log(`   Customer: ${order.user?.name || 'Unknown'} (${order.user?.email || 'N/A'})`);
        console.log(`   Return Status: ${order.returnStatus}`);
        console.log(`   Is Delivered: ${order.isDelivered}`);
        console.log(`   Delivered At: ${order.deliveredAt || '❌ NOT SET'}`);
        console.log(`   Return Requested At: ${order.returnRequestedAt || '❌ NOT SET'}`);
        console.log(`   Return Reason: ${order.returnReason ? order.returnReason.substring(0, 50) + '...' : '❌ NOT SET'}`);
        console.log(`   Order Total: ₹${order.totalPrice}`);
        console.log(`   Created At: ${order.createdAt}`);
        
        // Check if this is a valid return request
        const isValid = order.returnRequestedAt && order.returnReason && order.isDelivered;
        console.log(`   Valid Return: ${isValid ? '✅ YES' : '❌ NO - INVALID DATA'}`);
        
        if (!isValid) {
          console.log(`   ⚠️ ISSUE: This return request has incomplete data!`);
          if (!order.returnRequestedAt) console.log(`      - Missing returnRequestedAt`);
          if (!order.returnReason) console.log(`      - Missing returnReason`);
          if (!order.isDelivered) console.log(`      - Order not delivered`);
        }
        console.log('─'.repeat(80));
      });

      // Summary
      console.log('\n📈 SUMMARY');
      console.log('═'.repeat(80));
      const statusCount = {
        requested: returnOrders.filter(o => o.returnStatus === 'requested').length,
        approved: returnOrders.filter(o => o.returnStatus === 'approved').length,
        rejected: returnOrders.filter(o => o.returnStatus === 'rejected').length,
        completed: returnOrders.filter(o => o.returnStatus === 'completed').length,
      };
      
      console.log(`Requested: ${statusCount.requested}`);
      console.log(`Approved: ${statusCount.approved}`);
      console.log(`Rejected: ${statusCount.rejected}`);
      console.log(`Completed: ${statusCount.completed}`);
      
      const invalidReturns = returnOrders.filter(o => !o.returnRequestedAt || !o.returnReason);
      console.log(`\n⚠️ Invalid Returns (missing data): ${invalidReturns.length}`);
      
      if (invalidReturns.length > 0) {
        console.log('\n🔧 RECOMMENDATION:');
        console.log('Run the cleanup script to fix invalid return requests:');
        console.log('   node cleanupInvalidReturns.js');
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkReturnRequests();

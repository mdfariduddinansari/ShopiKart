/**
 * Cleanup script to reset invalid return requests
 * Run this to clean up orders that have returnStatus set but missing proper data
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/order');

async function cleanupInvalidReturns() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Searching for invalid return requests...\n');

    // Find orders with returnStatus but missing critical data
    const invalidReturns = await Order.find({
      returnStatus: { $ne: 'none' },
      $or: [
        { returnRequestedAt: { $exists: false } },
        { returnRequestedAt: null },
        { returnReason: { $exists: false } },
        { returnReason: null },
        { returnReason: '' }
      ]
    });

    console.log(`📊 Found ${invalidReturns.length} invalid return requests\n`);

    if (invalidReturns.length === 0) {
      console.log('✅ No invalid return requests found. Database is clean!');
    } else {
      console.log('⚠️ Invalid return requests found:');
      console.log('═'.repeat(80));

      for (const order of invalidReturns) {
        console.log(`\nOrder ID: ${order._id}`);
        console.log(`Current Status: ${order.returnStatus}`);
        console.log(`Missing: ${!order.returnRequestedAt ? 'returnRequestedAt ' : ''}${!order.returnReason ? 'returnReason' : ''}`);
      }

      console.log('\n' + '═'.repeat(80));
      console.log('\n⚠️ These orders will be reset to returnStatus: "none"');
      console.log('This will remove them from the return management page.\n');

      // In production, you'd want to prompt for confirmation
      // For now, we'll auto-proceed after showing the data
      
      console.log('🔧 Resetting invalid returns...\n');

      let resetCount = 0;
      for (const order of invalidReturns) {
        order.returnStatus = 'none';
        order.returnReason = null;
        order.returnRequestedAt = null;
        order.returnApprovedAt = null;
        order.returnRejectedAt = null;
        order.returnRejectionReason = null;
        order.returnCompletedAt = null;
        order.refundAmount = 0;
        order.refundProcessedAt = null;
        
        await order.save();
        resetCount++;
        console.log(`✅ Reset order ${order._id}`);
      }

      console.log('\n' + '═'.repeat(80));
      console.log(`\n✅ Successfully reset ${resetCount} invalid return requests`);
      console.log('These orders will no longer appear in the return management page.\n');
    }

    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupInvalidReturns();

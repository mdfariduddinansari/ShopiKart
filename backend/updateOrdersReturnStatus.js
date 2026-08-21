// Quick script to update all existing orders with default return fields
const mongoose = require('mongoose');
const Order = require('./models/order');
require('dotenv').config();

async function updateOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Update all orders that don't have returnStatus field
    const result = await Order.updateMany(
      { returnStatus: { $exists: false } },
      { 
        $set: { 
          returnStatus: 'none',
          returnReason: null,
          returnRequestedAt: null,
          returnApprovedAt: null,
          returnRejectedAt: null,
          returnRejectionReason: null,
          returnCompletedAt: null,
          refundAmount: null,
          refundProcessedAt: null
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} orders with default return status`);

    // Also set deliveredAt for orders that are delivered but don't have timestamp
    const deliveredOrders = await Order.updateMany(
      { 
        isDelivered: true,
        deliveredAt: { $exists: false }
      },
      { 
        $set: { 
          deliveredAt: new Date() // Use current date as fallback
        } 
      }
    );

    console.log(`✅ Updated ${deliveredOrders.modifiedCount} delivered orders with deliveredAt timestamp`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating orders:', error);
    process.exit(1);
  }
}

updateOrders();

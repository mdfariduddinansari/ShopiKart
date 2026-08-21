/**
 * Test script to verify return functionality
 * Run this to test the return system is working properly
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/order');

async function testReturnFunctionality() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find a sample delivered order
    const deliveredOrders = await Order.find({ 
      isDelivered: true,
      returnStatus: 'none'
    }).limit(5);

    console.log(`\n📦 Found ${deliveredOrders.length} delivered orders without returns\n`);

    if (deliveredOrders.length === 0) {
      console.log('⚠️ No delivered orders found to test. Creating a test order...');
      
      // You can create a test order here if needed
      console.log('\n💡 To test the return functionality:');
      console.log('1. Place an order through the frontend');
      console.log('2. Mark it as delivered in admin panel');
      console.log('3. Try requesting a return from the orders page');
    } else {
      for (const order of deliveredOrders) {
        console.log('─'.repeat(60));
        console.log(`Order ID: ${order._id}`);
        console.log(`Status: ${order.status}`);
        console.log(`Is Delivered: ${order.isDelivered}`);
        console.log(`Delivered At: ${order.deliveredAt ? order.deliveredAt.toISOString() : 'NOT SET ❌'}`);
        console.log(`Return Status: ${order.returnStatus}`);
        
        // Test return eligibility
        const isEligible = order.isReturnEligible();
        const daysRemaining = order.getDaysRemainingForReturn();
        
        console.log(`Return Eligible: ${isEligible ? '✅ YES' : '❌ NO'}`);
        console.log(`Days Remaining: ${daysRemaining}`);
        
        if (order.deliveredAt) {
          const daysSinceDelivery = Math.floor((new Date() - new Date(order.deliveredAt)) / (1000 * 60 * 60 * 24));
          console.log(`Days Since Delivery: ${daysSinceDelivery}`);
        }
        
        console.log('');
      }
    }

    console.log('\n✅ Return Functionality Check Complete!');
    console.log('\n📋 Key Points:');
    console.log('1. Orders must have isDelivered = true');
    console.log('2. Orders must have deliveredAt timestamp set');
    console.log('3. Returns are allowed within 7 days of delivery');
    console.log('4. returnStatus must be "none" to request a new return');

    await mongoose.connection.close();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the test
testReturnFunctionality();

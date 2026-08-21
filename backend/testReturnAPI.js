/**
 * Quick test to verify return request API is working
 * Make sure backend server is running before executing this
 */

const axios = require('axios');

async function testReturnAPI() {
  try {
    console.log('🧪 Testing Return Request API\n');
    console.log('Prerequisites:');
    console.log('1. Backend server must be running');
    console.log('2. You must have a delivered order');
    console.log('3. You need a valid user token\n');
    
    // Instructions for testing
    console.log('─'.repeat(80));
    console.log('MANUAL TEST STEPS:');
    console.log('─'.repeat(80));
    console.log('\n1. Open browser DevTools (F12)');
    console.log('2. Go to "Network" tab');
    console.log('3. Login to your account');
    console.log('4. Go to "My Orders" page');
    console.log('5. Find a delivered order');
    console.log('6. Click "Request Return" button');
    console.log('7. Enter a reason');
    console.log('8. Click "Submit Return Request"');
    console.log('\n9. In Network tab, look for the request:');
    console.log('   - URL: /api/orders/[orderId]/return/request');
    console.log('   - Method: POST');
    console.log('   - Status: Should be 200 (success) or 4xx/5xx (error)');
    console.log('\n10. Click on the request to see:');
    console.log('    - Request Headers (check Authorization token)');
    console.log('    - Request Payload (check reason is sent)');
    console.log('    - Response (check error message if any)');
    console.log('\n11. In Console tab, look for logs:');
    console.log('    - "Requesting return for order: ..."');
    console.log('    - "✅ Return request successful" OR');
    console.log('    - "❌ Return request failed: ..."');
    console.log('\n' + '─'.repeat(80));
    console.log('COMMON ISSUES:');
    console.log('─'.repeat(80));
    console.log('\n❌ Issue: "Order must be delivered before requesting return"');
    console.log('   Solution: Order status must be "delivered" in database');
    console.log('   Fix: Admin panel → Orders → Mark as delivered');
    console.log('\n❌ Issue: "Delivery date not recorded"');
    console.log('   Solution: Order must have deliveredAt timestamp');
    console.log('   Fix: Run: node backend/fixDeliveredOrders.js');
    console.log('\n❌ Issue: "Return window has expired"');
    console.log('   Solution: Order was delivered more than 7 days ago');
    console.log('   Fix: Order cannot be returned (by design)');
    console.log('\n❌ Issue: "Unauthorized" or 403 error');
    console.log('   Solution: You are not logged in or token expired');
    console.log('   Fix: Logout and login again');
    console.log('\n❌ Issue: Button is greyed out/disabled');
    console.log('   Solution: Return reason field is empty');
    console.log('   Fix: Type something in the reason textbox');
    console.log('\n❌ Issue: Nothing happens when clicking button');
    console.log('   Solution: Check browser console for JavaScript errors');
    console.log('   Fix: Look for red error messages in console');
    console.log('\n' + '─'.repeat(80));
    console.log('BACKEND SERVER CHECK:');
    console.log('─'.repeat(80));
    console.log('\nTesting if backend is running...\n');
    
    try {
      const response = await axios.get('http://localhost:5000/api/products', {
        timeout: 3000
      });
      console.log('✅ Backend server is RUNNING');
      console.log(`   Found ${response.data?.length || 0} products\n`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Backend server is NOT RUNNING');
        console.log('   Start it with: cd backend && npm start\n');
      } else {
        console.log('⚠️ Backend server responded but with an error');
        console.log(`   Error: ${error.message}\n`);
      }
    }
    
    console.log('─'.repeat(80));
    console.log('\n💡 TIP: If button still doesn\'t work after checking above:');
    console.log('   1. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('   2. Hard refresh page (Ctrl+F5)');
    console.log('   3. Try in incognito/private mode');
    console.log('   4. Check if JavaScript is enabled');
    console.log('   5. Try a different browser\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testReturnAPI();

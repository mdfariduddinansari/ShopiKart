const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/order');
const User = require('../models/User');

// Validate Razorpay keys
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('⚠️ Warning: Razorpay keys not found in environment variables');
  console.warn('Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file');
}

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ message: 'Order ID and amount are required' });
    }

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify amount matches
    if (Math.round(order.totalPrice) !== Math.round(amount)) {
      return res.status(400).json({ message: 'Amount mismatch' });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Amount in paise (smallest unit)
      currency: 'INR',
      receipt: `receipt_${orderId}`,
      notes: {
        orderId: orderId,
        userEmail: order.user ? order.user.email : order.guestEmail,
      },
    });

    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: orderId,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: error.message || 'Failed to create payment order' });
  }
};

// Verify payment and update order
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing payment verification data' 
      });
    }

    // Generate signature for verification
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    // Verify signature
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false,
        message: 'Payment verification failed' 
      });
    }

    // Update order as paid
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        isPaid: true,
        paidAt: new Date(),
        status: 'processing',
        paymentMethod: 'razorpay',
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // Clear user cart if authenticated
    if (order.user) {
      await User.findByIdAndUpdate(
        order.user,
        { cart: [] },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      orderId: order._id,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Payment verification failed' 
    });
  }
};

// Get payment status
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      orderId: order._id,
      isPaid: order.isPaid,
      paymentMethod: order.paymentMethod,
      totalPrice: order.totalPrice,
      status: order.status,
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({ message: error.message || 'Failed to get payment status' });
  }
};

// Refund payment
const refundPayment = async (req, res) => {
  try {
    const { orderId, paymentId, amount } = req.body;

    if (!paymentId || !amount) {
      return res.status(400).json({ message: 'Payment ID and amount are required' });
    }

    // Verify order exists and user is authorized
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user && order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to refund this order' });
    }

    // Create refund through Razorpay
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // Amount in paise
      notes: {
        orderId: orderId,
        refundReason: 'Cancellation/Return',
      },
    });

    // Update order status
    await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'cancelled',
        isPaid: false,
      }
    );

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refundId: refund.id,
    });
  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(500).json({ message: error.message || 'Refund failed' });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  getPaymentStatus,
  refundPayment,
};

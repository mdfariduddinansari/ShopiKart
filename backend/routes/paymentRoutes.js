const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  getPaymentStatus,
  refundPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Create Razorpay order
router.post('/create-order', protect, createRazorpayOrder);

// Verify payment
router.post('/verify', protect, verifyPayment);

// Get payment status
router.get('/status/:orderId', protect, getPaymentStatus);

// Refund payment
router.post('/refund', protect, refundPayment);

module.exports = router;

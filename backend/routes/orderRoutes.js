const express = require('express');
const router = express.Router();
const {
  createOrder,
  createGuestOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  processPayment,
  requestReturn,
  getAllReturnRequests,
  approveReturn,
  rejectReturn,
  completeReturn,
  cancelReturnRequest,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// Guest checkout (no authentication required)
router.post('/guest', createGuestOrder);

// User routes
router.post('/', protect, createOrder);
router.get('/:id', protect, getOrderById);
router.post('/:id/cancel', protect, cancelOrder);
router.post('/payment/process', protect, processPayment);

// Return routes (User)
router.post('/:orderId/return/request', protect, requestReturn);
router.post('/:orderId/return/cancel', protect, cancelReturnRequest);

// Admin routes
router.get('/', protect, admin, getAllOrders);
router.put('/:id', protect, admin, updateOrderStatus);

// Return routes (Admin)
router.get('/returns/all', protect, admin, getAllReturnRequests);
router.post('/:orderId/return/approve', protect, admin, approveReturn);
router.post('/:orderId/return/reject', protect, admin, rejectReturn);
router.post('/:orderId/return/complete', protect, admin, completeReturn);

module.exports = router;

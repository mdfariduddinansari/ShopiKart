const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  getUserCart,
  addToUserCart,
  updateUserCartItem,
  removeFromUserCart,
  clearUserCart,
  updateUserProfile,
  getUserOrders,
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  addAddress,
  updateAddress,
  deleteAddress,
  getUserAddresses,
  sendOtp,
  verifyOtp,
  requestPasswordReset,
  resetPassword,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/orders', protect, getUserOrders);

// Wishlist routes
router.get('/wishlist', protect, getUserWishlist);
router.post('/wishlist/add', protect, addToWishlist);
router.delete('/wishlist/remove', protect, removeFromWishlist);

// Address routes
router.get('/addresses', protect, getUserAddresses);
router.post('/addresses/add', protect, addAddress);
router.put('/addresses/:addressId', protect, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);

// Cart routes
router.get('/cart', protect, getUserCart);
router.post('/cart/add', protect, addToUserCart);
router.put('/cart/update', protect, updateUserCartItem);
router.delete('/cart/remove', protect, removeFromUserCart);
router.delete('/cart/clear', protect, clearUserCart);

module.exports = router;

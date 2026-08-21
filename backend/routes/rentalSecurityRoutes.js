const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const rentalSecurityController = require('../controllers/rentalSecurityController');

// ==================== USER ROUTES ====================

// Submit identity verification
router.post('/:bookingId/identity/submit', auth, rentalSecurityController.submitIdentityVerification);

// Verify phone number
router.post('/:bookingId/phone/verify', auth, rentalSecurityController.verifyPhoneNumber);

// Get verification status
router.get('/:bookingId/verification/status', auth, rentalSecurityController.getVerificationStatus);

// Auto-release deposit (for completed bookings with no damage)
router.post('/:bookingId/deposit/release', auth, rentalSecurityController.autoReleaseDeposit);

// ==================== ADMIN ROUTES ====================

// Verify identity (approve/reject)
router.post('/:bookingId/identity/verify', auth, rentalSecurityController.verifyIdentity);

// Process deposit refund
router.post('/:bookingId/deposit/refund', auth, rentalSecurityController.processDepositRefund);

// Get all pending identity verifications
router.get('/admin/pending-verifications', auth, rentalSecurityController.getPendingVerifications);

module.exports = router;

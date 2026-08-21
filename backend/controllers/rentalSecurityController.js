const RentalBooking = require('../models/RentalBooking');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/identity-documents/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for identity document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ID-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = function (req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, PNG) and PDF files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
}).fields([
  { name: 'documentImages', maxCount: 3 },
  { name: 'selfieImage', maxCount: 1 }
]);

// Wrapper to handle multer upload
const handleUpload = (req, res) => {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Submit identity verification
exports.submitIdentityVerification = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await RentalBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // Check if already verified
    if (booking.identityVerification.status === 'verified') {
      return res.status(400).json({ message: 'Identity already verified' });
    }

    // Handle file uploads
    try {
      await handleUpload(req, res);
    } catch (uploadErr) {
      return res.status(400).json({ message: uploadErr.message || 'File upload failed' });
    }

    const { documentType, documentNumber, alternateContact } = req.body;

    // Parse alternateContact if it's a string
    let parsedAlternateContact = alternateContact;
    if (typeof alternateContact === 'string') {
      try {
        parsedAlternateContact = JSON.parse(alternateContact);
      } catch (e) {
        parsedAlternateContact = null;
      }
    }

    const documentImages = req.files['documentImages']?.map(file => `/uploads/identity-documents/${file.filename}`) || [];
    const selfieImage = req.files['selfieImage']?.[0] ? `/uploads/identity-documents/${req.files['selfieImage'][0].filename}` : null;

    booking.identityVerification = {
      status: 'pending',
      documentType,
      documentNumber,
      documentImages,
      selfieImage,
      rejectionReason: null,
    };

    // Update alternate contact if provided
    if (parsedAlternateContact) {
      booking.contactVerification.alternateContact = parsedAlternateContact;
    }

    await booking.save();

    res.json({
      message: 'Identity verification documents submitted successfully. Admin will review within 24 hours.',
      booking
    });

  } catch (err) {
    console.error('Submit identity verification error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Admin: Verify identity
exports.verifyIdentity = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { approved, rejectionReason } = req.body;

    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const booking = await RentalBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.identityVerification.status === 'not_submitted') {
      return res.status(400).json({ message: 'No identity documents submitted' });
    }

    if (approved) {
      booking.identityVerification.status = 'verified';
      booking.identityVerification.verifiedAt = new Date();
      booking.identityVerification.verifiedBy = req.user.id;
      booking.identityVerification.rejectionReason = null;

      // Auto-confirm booking if all conditions met
      if (booking.canBeConfirmed()) {
        booking.status = 'confirmed';
        booking.depositStatus = 'held';
      }

      await booking.save();

      res.json({
        message: 'Identity verified successfully. Booking confirmed.',
        booking
      });
    } else {
      booking.identityVerification.status = 'rejected';
      booking.identityVerification.rejectionReason = rejectionReason || 'Document verification failed';

      await booking.save();

      res.json({
        message: 'Identity verification rejected',
        booking
      });
    }

  } catch (err) {
    console.error('Verify identity error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Verify phone number (OTP based)
exports.verifyPhoneNumber = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { otp } = req.body;

    const booking = await RentalBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // TODO: Implement OTP verification logic with SMS gateway
    // For now, mock verification
    const isValidOTP = otp === '123456'; // Mock OTP

    if (isValidOTP) {
      booking.contactVerification.phoneVerified = true;
      booking.contactVerification.phoneVerifiedAt = new Date();
      await booking.save();

      res.json({
        message: 'Phone number verified successfully',
        booking
      });
    } else {
      res.status(400).json({ message: 'Invalid OTP' });
    }

  } catch (err) {
    console.error('Verify phone error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Process deposit refund
exports.processDepositRefund = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { deductionAmount = 0, deductionReason } = req.body;

    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const booking = await RentalBooking.findById(bookingId)
      .populate('user', 'name email phone')
      .populate('rentalItem', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.depositStatus === 'refunded' || booking.depositStatus === 'forfeited') {
      return res.status(400).json({ message: 'Deposit already processed' });
    }

    const refundAmount = booking.calculateDepositRefund(deductionAmount);

    if (deductionAmount > 0 && !deductionReason) {
      return res.status(400).json({ message: 'Deduction reason required when deducting from deposit' });
    }

    booking.depositStatus = refundAmount > 0 ? 'refunded' : 'forfeited';
    booking.depositRefundAmount = refundAmount;
    booking.depositRefundedAt = new Date();
    booking.depositDeductionReason = deductionReason || null;

    // Update damage report if deduction made
    if (deductionAmount > 0) {
      booking.damageReport = {
        reported: true,
        description: deductionReason,
        estimatedCost: deductionAmount,
      };
    }

    await booking.save();

    res.json({
      message: `Deposit processed. ₹${refundAmount} refunded to customer.`,
      booking,
      refundDetails: {
        totalDeposit: booking.securityDeposit,
        deducted: deductionAmount,
        refunded: refundAmount,
        reason: deductionReason
      }
    });

  } catch (err) {
    console.error('Process deposit refund error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Auto-release deposit after successful return
exports.autoReleaseDeposit = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await RentalBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!booking.isDepositRefundEligible()) {
      return res.status(400).json({
        message: 'Deposit refund not eligible',
        reason: booking.status !== 'completed' ? 'Booking not completed' :
                booking.depositStatus !== 'held' ? 'Deposit not held' :
                'Damage reported - admin review required'
      });
    }

    // Auto-refund full deposit
    booking.depositStatus = 'refunded';
    booking.depositRefundAmount = booking.securityDeposit;
    booking.depositRefundedAt = new Date();

    await booking.save();

    res.json({
      message: `Security deposit of ₹${booking.securityDeposit} has been refunded`,
      booking
    });

  } catch (err) {
    console.error('Auto release deposit error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get identity verification status
exports.getVerificationStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await RentalBooking.findById(bookingId)
      .select('identityVerification contactVerification depositStatus securityDeposit depositRefundAmount status user');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    if (booking.user.toString() !== req.user.id) {
      const user = await User.findById(req.user.id);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    // Provide safe defaults for fields that might not exist
    const identityVerification = booking.identityVerification || {
      status: 'not_submitted',
      documentType: null,
      documentNumber: null,
      documentImages: [],
      verifiedAt: null,
      verifiedBy: null,
      rejectionReason: null,
      selfieImage: null,
    };

    const contactVerification = booking.contactVerification || {
      phoneVerified: false,
      phoneVerifiedAt: null,
      emailVerified: false,
      emailVerifiedAt: null,
      alternateContact: null,
    };

    res.json({
      identityVerification,
      contactVerification,
      depositInfo: {
        status: booking.depositStatus || 'pending',
        amount: booking.securityDeposit || 0,
        refunded: booking.depositRefundAmount || 0,
      },
      bookingStatus: booking.status,
      canConfirm: typeof booking.canBeConfirmed === 'function' ? booking.canBeConfirmed() : false,
      isIdentityVerified: typeof booking.isIdentityVerified === 'function' ? booking.isIdentityVerified() : false,
    });

  } catch (err) {
    console.error('Get verification status error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Admin: Get all pending identity verifications
exports.getPendingVerifications = async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const pendingBookings = await RentalBooking.find({
      'identityVerification.status': 'pending'
    })
      .populate('user', 'name email phone')
      .populate('rentalItem', 'name category pricePerDay')
      .sort({ createdAt: -1 });

    res.json({
      count: pendingBookings.length,
      bookings: pendingBookings
    });

  } catch (err) {
    console.error('Get pending verifications error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = exports;

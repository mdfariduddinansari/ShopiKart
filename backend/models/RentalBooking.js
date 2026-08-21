const mongoose = require('mongoose');

const RentalBookingSchema = new mongoose.Schema({
  rentalItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalItem',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  durationDays: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  totalCost: {
    type: Number,
    required: true,
  },
  pickupLocation: {
    address: String,
    city: String,
    state: String,
    zipcode: String,
    country: String,
  },
  returnLocation: {
    address: String,
    city: String,
    state: String,
    zipcode: String,
    country: String,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'pending',
  },
  bookingStatus: {
    type: String,
    enum: ['awaiting_payment', 'paid', 'pickup_scheduled', 'in_use', 'returned', 'cancelled'],
    default: 'awaiting_payment',
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'wallet', 'upi', 'bank_transfer', 'cash_on_delivery'],
    default: 'card',
  },
  deliveryAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User.addresses',
  },
  deliveryAddressData: {
    type: {
      recipientName: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      zipcode: String,
    },
    default: null,
  },
  insuranceSelected: {
    type: Boolean,
    default: false,
  },
  insuranceCost: {
    type: Number,
    default: 0,
  },
  securityDeposit: {
    type: Number,
    default: 0,
    description: 'Security deposit per item (refundable) × quantity'
  },
  depositStatus: {
    type: String,
    enum: ['pending', 'held', 'refunded', 'forfeited'],
    default: 'pending',
    description: 'Status of security deposit'
  },
  depositRefundedAt: {
    type: Date,
    default: null,
  },
  depositRefundAmount: {
    type: Number,
    default: 0,
  },
  depositDeductionReason: {
    type: String,
    default: null,
  },
  
  // Identity Verification
  identityVerification: {
    status: {
      type: String,
      enum: ['not_submitted', 'pending', 'verified', 'rejected'],
      default: 'not_submitted',
    },
    documentType: {
      type: String,
      enum: ['aadhar', 'pan', 'passport', 'driving_license', 'voter_id'],
      default: null,
    },
    documentNumber: {
      type: String,
      default: null,
    },
    documentImages: [{
      type: String, // URLs to uploaded document images
    }],
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    selfieImage: {
      type: String, // URL to selfie for face verification
      default: null,
    },
  },
  
  // Contact Verification
  contactVerification: {
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerifiedAt: {
      type: Date,
      default: null,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    alternateContact: {
      name: String,
      phone: String,
      relation: String,
    },
  },
  
  deliveryCharge: {
    type: Number,
    default: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  finalTotal: {
    type: Number,
    default: 0,
    description: 'Total invoice amount including all charges and taxes'
  },
  discount: {
    type: Number,
    default: 0,
  },
  specialRequests: String,
  pickupDate: Date,
  returnDate: Date,
  actualPickupDate: Date,
  actualReturnDate: Date,
  damageReport: {
    reported: Boolean,
    description: String,
    estimatedCost: Number,
  },
  notes: String,
  cancellationReason: String,
  refundAmount: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
RentalBookingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total with all charges
RentalBookingSchema.methods.calculateTotal = function () {
  return this.totalCost + this.insuranceCost + this.securityDeposit + this.deliveryCharge + this.taxAmount - this.discount;
};

// Check if booking can be modified
RentalBookingSchema.methods.canBeCancelled = function () {
  return ['pending', 'confirmed'].includes(this.status);
};

// Check if booking is active
RentalBookingSchema.methods.isActive = function () {
  return ['active', 'in_use'].includes(this.status);
};

// Check if identity verification is complete
RentalBookingSchema.methods.isIdentityVerified = function () {
  return this.identityVerification.status === 'verified';
};

// Check if booking can be confirmed (requires verification)
RentalBookingSchema.methods.canBeConfirmed = function () {
  return this.status === 'pending' && 
         this.identityVerification.status === 'verified' &&
         this.contactVerification.phoneVerified;
};

// Calculate deposit refund amount
RentalBookingSchema.methods.calculateDepositRefund = function (deductionAmount = 0) {
  const refundable = this.securityDeposit - deductionAmount;
  return Math.max(0, refundable);
};

// Check if deposit should be refunded
RentalBookingSchema.methods.isDepositRefundEligible = function () {
  return this.status === 'completed' && 
         this.depositStatus === 'held' &&
         !this.damageReport?.reported;
};

module.exports = mongoose.model('RentalBooking', RentalBookingSchema);
const mongoose = require('mongoose');

const rentalItemSchema = new mongoose.Schema({
  // Basic info
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Tools', 'Sports', 'Furniture', 'Vehicles', 'Cameras', 'Others']
  },
  brand: {
    type: String,
    default: ''
  },

  // Images
  images: [{
    type: String,
    required: true
  }],

  // Pricing - Daily rate and duration packages
  pricePerDay: {
    type: Number,
    required: true,
    default: 0
  },
  securityDeposit: {
    type: Number,
    required: true,
    default: 0,
    description: 'Security deposit per item (refundable)'
  },
  durationPackages: [{
    duration: { type: Number, required: true }, // in days
    price: { type: Number, required: true } // total price for this duration
  }],

  // Stock/Availability
  availableStock: {
    type: Number,
    required: true,
    default: 1
  },
  bookedDates: [{
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentalBooking'
    }
  }],

  // Seller/Owner info
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Specifications (flexible)
  specifications: [{
    key: String,
    value: String
  }],

  // Reviews
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    rating: Number,
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  rating: {
    type: Number,
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  },

  // Comments/Discussion
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Metadata
  featured: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RentalItem', rentalItemSchema);

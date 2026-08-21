const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    guestEmail: {
      type: String,
      required: false,
    },
    isGuestOrder: {
      type: Boolean,
      default: false,
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
      },
    ],
    shippingAddress: {
      name: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
    },
    subtotal: {
      type: Number,
      default: 0.0,
    },
    tax: {
      type: Number,
      default: 0.0,
    },
    shippingCharge: {
      type: Number,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: Date,
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: Date,
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    couponCode: {
      type: String,
      default: null,
    },
    couponDiscount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'upi', 'card', 'netbanking', 'wallet', 'online'],
      default: 'cod',
    },
    // Return fields
    returnStatus: {
      type: String,
      enum: ['none', 'requested', 'approved', 'rejected', 'completed'],
      default: 'none'
    },
    returnReason: {
      type: String,
      default: null
    },
    returnRequestedAt: {
      type: Date,
      default: null
    },
    returnApprovedAt: {
      type: Date,
      default: null
    },
    returnRejectedAt: {
      type: Date,
      default: null
    },
    returnRejectionReason: {
      type: String,
      default: null
    },
    returnCompletedAt: {
      type: Date,
      default: null
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    refundProcessedAt: {
      type: Date,
      default: null
    },
  },
  { timestamps: true }
);

// Method to check if order is eligible for return (within 7 days of delivery)
orderSchema.methods.isReturnEligible = function() {
  if (!this.isDelivered || !this.deliveredAt) {
    return false;
  }
  
  // Check if return already requested/completed
  if (this.returnStatus !== 'none') {
    return false;
  }
  
  // Check if within 7 days of delivery
  const now = new Date();
  const deliveryDate = new Date(this.deliveredAt);
  const daysSinceDelivery = Math.floor((now - deliveryDate) / (1000 * 60 * 60 * 24));
  
  return daysSinceDelivery <= 7;
};

// Method to get return deadline
orderSchema.methods.getReturnDeadline = function() {
  if (!this.deliveredAt) {
    return null;
  }
  
  const deliveryDate = new Date(this.deliveredAt);
  const deadline = new Date(deliveryDate);
  deadline.setDate(deadline.getDate() + 7);
  
  return deadline;
};

// Method to calculate days remaining for return
orderSchema.methods.getDaysRemainingForReturn = function() {
  if (!this.deliveredAt) {
    return 0;
  }
  
  const now = new Date();
  const deadline = this.getReturnDeadline();
  const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, daysRemaining);
};

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;

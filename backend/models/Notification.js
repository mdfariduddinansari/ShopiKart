const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'booking_confirmed',
      'booking_cancelled',
      'payment_received',
      'rental_started',
      'rental_reminder',
      'rental_completed',
      'return_pending',
      'damage_reported',
      'refund_processed',
      'booking_updated',
      'purchase_completed',
      'rental_item_added_to_cart',
        'product_added_to_cart',
        'product_removed_from_cart',
      'product_wishlisted',
    ],
    required: true,
  },
  title: String,
  message: String,
  data: {
    bookingId: String,
    rentalItemId: String,
    bookingStatus: String,
    amount: Number,
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    expire: 2592000, // Auto-delete after 30 days
  },
});

// Mark as read
NotificationSchema.methods.markAsRead = function () {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification
NotificationSchema.statics.createNotification = async function (userId, type, title, message, data = {}) {
  try {
    const notification = new this({
      user: userId,
      type,
      title,
      message,
      data,
    });
    return await notification.save();
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
};

// Get unread count
NotificationSchema.statics.getUnreadCount = async function (userId) {
  return await this.countDocuments({ user: userId, read: false });
};

module.exports = mongoose.model('Notification', NotificationSchema);

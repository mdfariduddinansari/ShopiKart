const Notification = require('../models/Notification');

const notificationMessages = {
  booking_confirmed: {
    title: "Booking Confirmed",
    getMessage: (itemName, dates) =>
      `Your rental for ${itemName} from ${dates.start} to ${dates.end} is confirmed!`,
  },
  booking_cancelled: {
    title: "Booking Cancelled",
    getMessage: (itemName) => `Your rental for ${itemName} has been cancelled.`,
  },
  payment_received: {
    title: "Payment Received",
    getMessage: (itemName, dates, amount, returnDate, cost, change, formattedAmount) => 
      `Payment of ${formattedAmount || '₹' + amount} has been received successfully.`,
  },
  rental_started: {
    title: "Rental Started",
    getMessage: (itemName) => `Your ${itemName} rental has started. Enjoy your rental!`,
  },
  rental_reminder: {
    title: "Rental Reminder",
    getMessage: (itemName, dates, amount, returnDate) =>
      `Reminder: Please return ${itemName} by ${returnDate}.`,
  },
  rental_completed: {
    title: "Rental Completed",
    getMessage: (itemName) => `Thank you for renting ${itemName}!`,
  },
  return_pending: {
    title: "Return Pending",
    getMessage: (itemName, dates, amount, returnDate) =>
      `Return of ${itemName} is pending. Please return by ${returnDate}.`,
  },
  damage_reported: {
    title: "Damage Reported",
    getMessage: (itemName, dates, amount, returnDate, cost) =>
      `Damage reported for ${itemName}. Estimated cost: ${cost}.`,
  },
  refund_processed: {
    title: "Refund Processed",
    getMessage: (itemName, dates, amount, returnDate, cost, change, formattedAmount) => 
      `Refund of ${formattedAmount || '₹' + amount} has been processed to your account.`,
  },
  booking_updated: {
    title: "Booking Updated",
    getMessage: (itemName, dates, amount, returnDate, cost, change) => `Your booking has been updated: ${change}.`,
  },
  purchase_completed: {
    title: "Purchase Confirmed",
    getMessage: (itemName, dates, amount, returnDate, cost, change, formattedAmount) =>
      `Your purchase of ${itemName} for ${formattedAmount || '₹' + amount} has been confirmed!`,
  },
  rental_item_added_to_cart: {
    title: "Rental Added to Cart",
    getMessage: (itemName) =>
      `${itemName} has been added to your rental cart!`,
  },
  product_added_to_cart: {
    title: "Added to Cart",
    getMessage: (itemName) => `${itemName} has been added to your cart!`,
  },
  product_removed_from_cart: {
    title: "Removed from Cart",
    getMessage: (itemName) => `${itemName} has been removed from your cart.`,
  },
  product_wishlisted: {
    title: "Added to Wishlist",
    getMessage: (itemName) =>
      `${itemName} has been added to your wishlist!`,
  },
};

/**
 * Create a notification for user
 * @param {String} userId - User ID
 * @param {String} type - Notification type
 * @param {Object} data - Additional data
 */
async function sendNotification(userId, type, data = {}) {
  try {
    const template = notificationMessages[type];
    if (!template) {
      console.warn(`Unknown notification type: ${type}`);
      return null;
    }

    const message = template.getMessage(
      data.itemName, 
      data.dates, 
      data.amount, 
      data.returnDate, 
      data.cost, 
      data.change,
      data.formattedAmount
    );

    const notification = await Notification.createNotification(
      userId,
      type,
      template.title,
      message,
      {
        bookingId: data.bookingId,
        rentalItemId: data.rentalItemId,
        bookingStatus: data.bookingStatus,
        amount: data.amount,
      }
    );

    return notification;
  } catch (err) {
    console.error("Error sending notification:", err);
    return null;
  }
}

/**
 * Send booking confirmation notification
 */
async function sendBookingConfirmation(userId, booking) {
  const startDate = new Date(booking.startDate).toLocaleDateString();
  const endDate = new Date(booking.endDate).toLocaleDateString();

  return sendNotification(userId, "booking_confirmed", {
    bookingId: booking._id,
    rentalItemId: booking.rentalItem?._id,
    itemName: booking.rentalItem?.name || "Item",
    dates: { start: startDate, end: endDate },
  });
}

/**
 * Send payment received notification
 */
async function sendPaymentReceived(userId, booking) {
  const rawAmount = Number(booking.totalCost) || 0;
  return sendNotification(userId, "payment_received", {
    bookingId: booking._id,
    rentalItemId: booking.rentalItem?._id,
    amount: rawAmount,
    formattedAmount: `₹${rawAmount.toFixed(0)}`,
  });
}

/**
 * Send rental started notification
 */
async function sendRentalStarted(userId, booking) {
  return sendNotification(userId, "rental_started", {
    bookingId: booking._id,
    rentalItemId: booking.rentalItem?._id,
    itemName: booking.rentalItem?.name || "Item",
  });
}

/**
 * Send return reminder notification
 */
async function sendReturnReminder(userId, booking) {
  const returnDate = new Date(booking.endDate).toLocaleDateString();

  return sendNotification(userId, "rental_reminder", {
    bookingId: booking._id,
    rentalItemId: booking.rentalItem?._id,
    itemName: booking.rentalItem?.name || "Item",
    returnDate,
  });
}

/**
 * Send booking cancelled notification
 */
async function sendBookingCancelled(userId, booking) {
  return sendNotification(userId, "booking_cancelled", {
    bookingId: booking._id,
    rentalItemId: booking.rentalItem?._id,
    itemName: booking.rentalItem?.name || "Item",
  });
}

/**
 * Send rental completed notification
 */
async function sendRentalCompleted(userId, booking) {
  return sendNotification(userId, "rental_completed", {
    bookingId: booking._id,
    rentalItemId: booking.rentalItem?._id,
    itemName: booking.rentalItem?.name || "Item",
  });
}

/**
 * Send refund processed notification
 */
async function sendRefundProcessed(userId, refundAmount) {
  const rawAmount = Number(refundAmount) || 0;
  return sendNotification(userId, "refund_processed", {
    amount: rawAmount,
    formattedAmount: `₹${rawAmount.toFixed(0)}`,
  });
}

/**
 * Send purchase completed notification
 */
async function sendPurchaseCompleted(userId, productName, amount) {
  const rawAmount = Number(amount) || 0;
  return sendNotification(userId, "purchase_completed", {
    itemName: productName,
    amount: rawAmount,
    formattedAmount: `₹${rawAmount.toFixed(0)}`,
  });
}

/**
 * Send rental item added to cart notification
 */
async function sendRentalAddedToCart(userId, rentalItemName) {
  return sendNotification(userId, "rental_item_added_to_cart", {
    itemName: rentalItemName,
  });
}

/**
 * Send product added to cart notification
 */
async function sendProductAddedToCart(userId, productName) {
  return sendNotification(userId, "product_added_to_cart", {
    itemName: productName,
  });
}

/**
 * Send product removed from cart notification
 */
async function sendProductRemovedFromCart(userId, productName) {
  return sendNotification(userId, "product_removed_from_cart", {
    itemName: productName,
  });
}

/**
 * Send product wishlisted notification
 */
async function sendProductWishlisted(userId, productName) {
  return sendNotification(userId, "product_wishlisted", {
    itemName: productName,
  });
}

module.exports = {
  sendNotification,
  sendBookingConfirmation,
  sendPaymentReceived,
  sendRentalStarted,
  sendReturnReminder,
  sendBookingCancelled,
  sendRentalCompleted,
  sendRefundProcessed,
  sendPurchaseCompleted,
  sendRentalAddedToCart,
  sendProductWishlisted,
  sendProductAddedToCart,
  sendProductRemovedFromCart,
};

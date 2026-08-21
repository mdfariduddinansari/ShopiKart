const express = require('express');
const router = express.Router();
const RentalBooking = require('../models/RentalBooking');
const RentalItem = require('../models/RentalItem');
const { auth } = require('../middleware/authMiddleware');
const notificationHelper = require('../utils/notificationHelper');

// ==================== ADMIN ROUTES (must come first) ====================

// Get all rental bookings (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized. Admin access required.' });
    }

    const bookings = await RentalBooking.find()
      .populate('rentalItem', 'name description category images pricePerDay')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Update booking status (admin only)
router.put('/admin/:id/status', auth, async (req, res) => {
  try {
    // Check if user is admin
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized. Admin access required.' });
    }

    const booking = await RentalBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    console.log(`Admin updating booking ${req.params.id} status to ${status}`);

    booking.bookingStatus = status;
    const updatedBooking = await booking.save();
    const populatedBooking = await updatedBooking
      .populate('rentalItem', 'name description')
      .populate('user', 'name email');

    res.json(populatedBooking);
  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ message: err.message });
  }
});

// Admin: Cancel rental booking (admin can cancel any booking)
router.post('/admin/:id/cancel', auth, async (req, res) => {
  try {
    // Check if user is admin
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized. Admin access required.' });
    }

    const booking = await RentalBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const { reason } = req.body;

    console.log(`Admin cancelling booking ${req.params.id}`);

    booking.status = 'cancelled';
    booking.bookingStatus = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by admin';

    // Calculate refund (full if not picked up, partial after pickup)
    const totalAmount = booking.calculateTotal?.() || booking.totalCost;
    booking.refundAmount = booking.isPaid ? totalAmount : 0;

    // Remove from rental item's booked dates and restore inventory
    const rentalItem = await RentalItem.findById(booking.rentalItem);
    if (rentalItem) {
      // Remove from booked dates
      rentalItem.bookedDates = rentalItem.bookedDates.filter(
        (b) => b.booking?.toString() !== booking._id.toString()
      );

      // Restore inventory if booking was paid
      if (booking.isPaid) {
        const quantityToRestore = booking.quantity || 1;
        const newStock = rentalItem.availableStock + quantityToRestore;
        
        console.log(`Admin restoring inventory for cancelled booking ${booking._id}:`, {
          previousStock: rentalItem.availableStock,
          quantityRestored: quantityToRestore,
          newStock: newStock,
          itemName: rentalItem.name
        });

        rentalItem.availableStock = newStock;
      }

      await rentalItem.save();
    }

    const updatedBooking = await booking.save();
    const populatedBooking = await updatedBooking
      .populate('rentalItem', 'name description')
      .populate('user', 'name email');

    // Send booking cancelled notification
    try {
      await notificationHelper.sendBookingCancelled(populatedBooking.user._id, populatedBooking);
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    // Send refund notification if applicable
    if (booking.refundAmount > 0) {
      try {
        await notificationHelper.sendRefundProcessed(populatedBooking.user._id, booking.refundAmount);
      } catch (notifErr) {
        console.error('Notification error:', notifErr);
      }
    }

    res.json(populatedBooking);
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==================== USER ROUTES ====================

// Create a new rental booking
router.post('/', auth, async (req, res) => {
  try {
    const {
      rentalItem,
      rentalItemId,
      startDate,
      endDate,
      quantity,
      pickupLocation,
      returnLocation,
      insuranceSelected,
      insuranceCost,
      deliveryCharge,
      specialRequests,
      totalCost,
    } = req.body;

    // Support both rentalItem and rentalItemId parameter names
    const itemId = rentalItem || rentalItemId;

    console.log('Booking creation request:', { itemId, startDate, endDate, totalCost, userId: req.user?.id });

    if (!itemId || !startDate || !endDate || !totalCost) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['rentalItem or rentalItemId', 'startDate', 'endDate', 'totalCost'],
        received: { itemId, startDate, endDate, totalCost }
      });
    }

    // Verify rental item exists
    const rentalItemDoc = await RentalItem.findById(itemId);
    if (!rentalItemDoc) {
      return res.status(404).json({ message: `Rental item not found with ID: ${itemId}` });
    }

    // Parse dates properly
    let start, end;
    try {
      start = new Date(startDate);
      end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format');
      }
    } catch (dateErr) {
      return res.status(400).json({ 
        message: 'Invalid date format. Use ISO format (YYYY-MM-DD)',
        received: { startDate, endDate }
      });
    }

    // Check if start date is before end date
    if (start >= end) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    // Define quantity early (needed for availability check)
    const quantityNum = quantity || 1;

    // Check availability using the same logic as check-availability endpoint
    const normalizeDate = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const normalizedStart = normalizeDate(start);
    const normalizedEnd = normalizeDate(end);

    console.log(`Booking check: Looking for conflicts between ${normalizedStart} and ${normalizedEnd}`);

    // Get ALL non-cancelled bookings for this item
    const allBookings = await RentalBooking.find({
      rentalItem: itemId,
      bookingStatus: { 
        $ne: 'cancelled'  // All non-cancelled bookings block availability
      }
    }).select('quantity startDate endDate bookingStatus _id');

    // Filter for overlapping dates in application code (more reliable)
    const conflictingBookings = allBookings.filter(booking => {
      const bookingStart = normalizeDate(booking.startDate);
      const bookingEnd = normalizeDate(booking.endDate);
      
      // Two ranges overlap if: start1 < end2 AND end1 > start2
      const overlaps = normalizedStart < bookingEnd && normalizedEnd > bookingStart;
      
      if (overlaps) {
        console.log(`  Conflict found: Booking ${booking._id} (${bookingStart} to ${bookingEnd}) overlaps with ${normalizedStart} to ${normalizedEnd}`);
      }
      
      return overlaps;
    });

    // Calculate booked quantity
    const bookedQuantity = conflictingBookings.reduce((sum, booking) => {
      return sum + (booking.quantity || 1);
    }, 0);

    const availableQuantity = rentalItemDoc.availableStock - bookedQuantity;

    console.log('Availability check for booking creation:', {
      itemId,
      itemName: rentalItemDoc.name,
      requestDates: { start: normalizedStart, end: normalizedEnd },
      totalStock: rentalItemDoc.availableStock,
      bookedQuantity,
      availableQuantity,
      requestedQuantity: quantityNum,
      conflictingBookingsCount: conflictingBookings.length,
      conflictingBookings: conflictingBookings.map(b => ({
        id: b._id,
        qty: b.quantity,
        status: b.bookingStatus,
        dates: { start: normalizeDate(b.startDate), end: normalizeDate(b.endDate) }
      }))
    });

    if (quantityNum > availableQuantity) {
      return res.status(400).json({ 
        message: availableQuantity > 0 
          ? `Only ${availableQuantity} item(s) available for these dates (${bookedQuantity} already booked)`
          : 'Item is fully booked for the selected dates',
        availableQuantity,
        bookedQuantity,
        requestedQuantity: quantityNum
      });
    }

    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Calculate total cost based on price per day × duration
    const pricePerDay = rentalItemDoc.pricePerDay || 0;
    const calculatedTotalCost = pricePerDay * durationDays * quantityNum;

    if (isNaN(calculatedTotalCost) || calculatedTotalCost <= 0) {
      return res.status(400).json({ 
        message: 'Invalid total cost calculation',
        details: { pricePerDay, durationDays, quantity: quantityNum, calculatedTotalCost }
      });
    }

    // Calculate security deposit (per item × quantity)
    const securityDeposit = (rentalItemDoc.securityDeposit || 0) * quantityNum;

    // Insurance cost if selected (5% of rental cost)
    const calculatedInsuranceCost = insuranceSelected ? parseFloat((calculatedTotalCost * 0.05).toFixed(2)) : 0;

    // Calculate subtotal for tax (rental + security deposit + insurance)
    const subtotalForTax = calculatedTotalCost + securityDeposit + calculatedInsuranceCost;
    
    // Calculate tax (10% of subtotal)
    const taxAmount = parseFloat((subtotalForTax * 0.1).toFixed(2));

    // Final total
    const finalTotal = calculatedTotalCost + securityDeposit + calculatedInsuranceCost + (deliveryCharge || 0) + taxAmount;

    console.log('Booking calculation:', {
      pricePerDay,
      durationDays,
      quantity: quantityNum,
      rentalCost: calculatedTotalCost,
      securityDeposit,
      insurance: calculatedInsuranceCost,
      delivery: deliveryCharge || 0,
      tax: taxAmount,
      finalTotal
    });

    const booking = new RentalBooking({
      rentalItem: itemId,
      user: req.user.id,
      startDate: start,
      endDate: end,
      durationDays,
      quantity: quantityNum,
      totalCost: parseFloat(calculatedTotalCost.toFixed(2)),
      pickupLocation,
      returnLocation,
      insuranceSelected: insuranceSelected || false,
      insuranceCost: calculatedInsuranceCost,
      securityDeposit: parseFloat(securityDeposit.toFixed(2)),
      deliveryCharge: deliveryCharge || 0,
      taxAmount,
      finalTotal: parseFloat(finalTotal.toFixed(2)),
      specialRequests,
      status: 'pending',
      bookingStatus: 'awaiting_payment',
      isPaid: false,
    });

    const savedBooking = await booking.save();
    console.log('Booking saved:', savedBooking._id);

    const populatedBooking = await RentalBooking.findById(savedBooking._id)
      .populate('rentalItem', 'name description category pricePerDay images')
      .populate('user', 'name email');

    // Send notification for booking created
    try {
      await notificationHelper.sendRentalAddedToCart(req.user.id, populatedBooking.rentalItem?.name || 'Item');
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
      // Don't fail the booking creation if notification fails
    }

    console.log('Sending populated booking:', populatedBooking);
    res.status(201).json(populatedBooking);
  } catch (err) {
    console.error('Booking creation error:', err);
    res.status(500).json({ 
      message: 'Error creating booking: ' + err.message, 
      error: err.toString(),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get user's rental bookings
router.get('/user/bookings', auth, async (req, res) => {
  try {
    const bookings = await RentalBooking.find({ user: req.user.id })
      .populate('rentalItem', 'name description category images')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single rental booking
router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching booking with ID:', req.params.id);
    const booking = await RentalBooking.findById(req.params.id)
      .populate('rentalItem', 'name description category pricePerDay images')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    console.log('Booking found:', booking._id);
    res.json(booking);
  } catch (err) {
    console.error('Error fetching booking:', err);
    res.status(500).json({ message: err.message, error: err.toString() });
  }
});

// Update rental booking (mainly for status updates)
router.put('/:id', auth, async (req, res) => {
  try {
    const booking = await RentalBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check ownership
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    const { status, bookingStatus, actualPickupDate, actualReturnDate, damageReport, notes } = req.body;

    if (status) booking.status = status;
    if (bookingStatus) booking.bookingStatus = bookingStatus;
    if (actualPickupDate) booking.actualPickupDate = actualPickupDate;
    if (actualReturnDate) booking.actualReturnDate = actualReturnDate;
    if (damageReport) booking.damageReport = damageReport;
    if (notes) booking.notes = notes;

    const updatedBooking = await booking.save();
    const populatedBooking = await updatedBooking
      .populate('rentalItem', 'name description')
      .populate('user', 'name email');

    res.json(populatedBooking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Process rental booking payment
router.post('/:id/pay', auth, async (req, res) => {
  try {
    const booking = await RentalBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check ownership
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.isPaid) {
      return res.status(400).json({ message: 'Booking already paid' });
    }

    // TODO: Integrate with payment gateway here
    // For now, simulate payment
    booking.isPaid = true;
    booking.bookingStatus = 'paid';
    booking.status = 'confirmed';

    // Update rental item's booked dates and deduct inventory
    const rentalItem = await RentalItem.findById(booking.rentalItem);
    if (rentalItem) {
      // Add to booked dates
      rentalItem.bookedDates.push({
        startDate: booking.startDate,
        endDate: booking.endDate,
        booking: booking._id,
      });

      // Deduct inventory based on quantity and duration
      const quantityToDeduct = booking.quantity || 1;
      const newStock = rentalItem.availableStock - quantityToDeduct;
      
      console.log(`Deducting inventory for booking ${booking._id}:`, {
        previousStock: rentalItem.availableStock,
        quantity: quantityToDeduct,
        newStock: newStock,
        itemName: rentalItem.name
      });

      // Ensure stock doesn't go negative
      rentalItem.availableStock = Math.max(0, newStock);
      
      await rentalItem.save();
    }

    const updatedBooking = await booking.save();

    // Populate booking data
    let populatedBooking = await RentalBooking.findById(updatedBooking._id)
      .populate('rentalItem')
      .populate('user', 'name email');

    // Send payment received notification
    try {
      await notificationHelper.sendPaymentReceived(req.user.id, updatedBooking);
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
      // Don't fail the payment if notification fails
    }

    // Send booking confirmation notification
    try {
      await notificationHelper.sendBookingConfirmation(req.user.id, populatedBooking);
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
      // Don't fail the payment if notification fails
    }

    res.json(populatedBooking);
  } catch (err) {
    console.error('Payment processing error:', err);
    res.status(500).json({ message: err.message, error: err.toString() });
  }
});

// Confirm rental booking with Cash on Delivery
router.post('/:id/confirm-cod', auth, async (req, res) => {
  try {
    const booking = await RentalBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check ownership
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.isPaid) {
      return res.status(400).json({ message: 'Booking already confirmed' });
    }

    const { addressId, deliveryAddressData, insuranceSelected, insuranceCost, securityDeposit, deliveryCharge, taxAmount } = req.body;

    if (!addressId && !deliveryAddressData) {
      return res.status(400).json({ message: 'Delivery address is required' });
    }

    // Update booking with COD payment method and status
    booking.isPaid = false; // Not yet paid (payment on delivery)
    booking.bookingStatus = 'paid'; // Changed from 'confirmed' to 'paid' (correct enum value)
    booking.paymentMethod = 'cash_on_delivery';
    
    // Store insurance information
    if (insuranceSelected !== undefined) {
      booking.insuranceSelected = insuranceSelected;
    }
    if (insuranceCost !== undefined) {
      booking.insuranceCost = insuranceCost;
    }
    
    // Store other charges
    if (securityDeposit !== undefined) {
      booking.securityDeposit = securityDeposit;
    }
    if (deliveryCharge !== undefined) {
      booking.deliveryCharge = deliveryCharge;
    }
    if (taxAmount !== undefined) {
      booking.taxAmount = taxAmount;
    }
    
    // Store address data - either as reference ID or as inline data
    if (addressId) {
      booking.deliveryAddress = addressId;
    }
    // If deliveryAddressData is provided, store it in a custom field (since deliveryAddress must be ObjectId)
    if (deliveryAddressData) {
      booking.deliveryAddressData = deliveryAddressData;
    }
    
    booking.status = 'confirmed';

    // Calculate final total (rental cost + all charges and taxes)
    const calculatedFinalTotal = booking.totalCost + (booking.insuranceCost || 0) + (booking.securityDeposit || 0) + (booking.deliveryCharge || 0) + (booking.taxAmount || 0);
    booking.finalTotal = calculatedFinalTotal;

    console.log('Cost breakdown:', {
      rentalCost: booking.totalCost,
      insurance: booking.insuranceCost,
      deposit: booking.securityDeposit,
      delivery: booking.deliveryCharge,
      tax: booking.taxAmount,
      finalTotal: booking.finalTotal
    });

    // Update rental item's booked dates and deduct inventory
    const rentalItem = await RentalItem.findById(booking.rentalItem);
    if (rentalItem) {
      // Add to booked dates
      rentalItem.bookedDates.push({
        startDate: booking.startDate,
        endDate: booking.endDate,
        booking: booking._id,
      });

      // Deduct inventory based on quantity
      const quantityToDeduct = booking.quantity || 1;
      const newStock = rentalItem.availableStock - quantityToDeduct;
      
      console.log(`Confirming COD booking ${booking._id}:`, {
        previousStock: rentalItem.availableStock,
        quantity: quantityToDeduct,
        newStock: newStock,
        itemName: rentalItem.name,
        paymentMethod: 'cash_on_delivery',
        finalTotal: booking.finalTotal
      });

      // Ensure stock doesn't go negative
      rentalItem.availableStock = Math.max(0, newStock);
      
      await rentalItem.save();
    }

    await booking.save();

    // Populate booking data
    let populatedBooking = await RentalBooking.findById(booking._id)
      .populate('rentalItem')
      .populate('user', 'name email');

    // Send booking confirmation notification
    try {
      await notificationHelper.sendBookingConfirmation(req.user.id, populatedBooking);
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
      // Don't fail if notification fails
    }

    res.json(populatedBooking);
  } catch (err) {
    console.error('COD confirmation error:', err);
    res.status(500).json({ message: err.message, error: err.toString() });
  }
});

// Cancel rental booking
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    console.log('=== CANCEL BOOKING REQUEST ===');
    console.log('Booking ID:', req.params.id);
    console.log('User ID:', req.user.id);
    
    const booking = await RentalBooking.findById(req.params.id);
    console.log('Booking found:', booking ? booking._id : 'NOT FOUND');

    if (!booking) {
      console.log('ERROR: Booking not found');
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check ownership
    console.log('Booking user:', booking.user.toString());
    console.log('Request user:', req.user.id);
    console.log('Match:', booking.user.toString() === req.user.id);
    
    if (booking.user.toString() !== req.user.id) {
      console.log('ERROR: Not authorized - user mismatch');
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Check if already cancelled
    if (booking.bookingStatus === 'cancelled') {
      console.log('ERROR: Booking already cancelled');
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Allow cancellation for awaiting_payment, paid, and other non-completed statuses
    const cancelNotAllowedStatuses = ['completed', 'in_use', 'returned'];
    if (cancelNotAllowedStatuses.includes(booking.bookingStatus)) {
      console.log('ERROR: Cannot cancel booking with status:', booking.bookingStatus);
      return res.status(400).json({ message: `Cannot cancel booking that is ${booking.bookingStatus}` });
    }

    // Store the old status before changing it
    const oldStatus = booking.bookingStatus;
    const { reason } = req.body || {};

    console.log('Cancelling booking - old status:', oldStatus);
    
    booking.status = 'cancelled';
    booking.bookingStatus = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by user';

    // Calculate refund (full if not picked up, partial after pickup)
    let totalAmount = booking.totalCost || 0;
    if (booking.calculateTotal && typeof booking.calculateTotal === 'function') {
      totalAmount = booking.calculateTotal();
    }
    booking.refundAmount = booking.isPaid ? totalAmount : 0;

    // Remove from rental item's booked dates and restore inventory if booking was confirmed/paid
    // Check BEFORE status change using oldStatus
    if (oldStatus !== 'awaiting_payment') {
      console.log('Restoring inventory - old status was:', oldStatus);
      const rentalItem = await RentalItem.findById(booking.rentalItem);
      if (rentalItem) {
        // Remove from booked dates
        rentalItem.bookedDates = rentalItem.bookedDates.filter(
          (b) => b.booking?.toString() !== booking._id.toString()
        );

        // Restore inventory
        const quantityToRestore = booking.quantity || 1;
        const newStock = rentalItem.availableStock + quantityToRestore;
        
        console.log(`Restoring inventory for cancelled booking ${booking._id}:`, {
          previousStock: rentalItem.availableStock,
          quantityRestored: quantityToRestore,
          newStock: newStock,
          itemName: rentalItem.name
        });

        rentalItem.availableStock = newStock;
        await rentalItem.save();
        console.log('Inventory restored successfully');
      }
    }

    await booking.save();
    console.log('Booking saved successfully:', booking._id);
    
    const populatedBooking = await RentalBooking.findById(booking._id)
      .populate('rentalItem', 'name description')
      .populate('user', 'name email');
    
    console.log('Booking populated successfully');

    // Send booking cancelled notification
    try {
      console.log('Sending cancellation notification...');
      await notificationHelper.sendBookingCancelled(req.user.id, populatedBooking);
      console.log('Notification sent successfully');
    } catch (notifErr) {
      console.error('Notification error (non-blocking):', notifErr.message);
      // Don't fail the request if notification fails
    }

    // Send refund notification if applicable
    if (booking.refundAmount > 0) {
      try {
        console.log('Sending refund notification...');
        await notificationHelper.sendRefundProcessed(req.user.id, booking.refundAmount);
        console.log('Refund notification sent successfully');
      } catch (notifErr) {
        console.error('Refund notification error (non-blocking):', notifErr.message);
        // Don't fail the request if notification fails
      }
    }

    console.log(`✅ Booking ${booking._id} successfully cancelled by user ${req.user.id}`);
    res.json(populatedBooking);
  } catch (err) {
    console.error('❌ ERROR cancelling booking:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ message: err.message || 'Failed to cancel booking' });
  }
});

// Complete rental (return booking)
router.post('/:id/complete', async (req, res) => {
  try {
    const booking = await RentalBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!booking.isActive()) {
      return res.status(400).json({ message: 'Booking is not currently active' });
    }

    const { actualReturnDate, damageReport } = req.body;

    booking.actualReturnDate = actualReturnDate || new Date();
    if (damageReport) booking.damageReport = damageReport;
    booking.status = 'completed';
    booking.bookingStatus = 'returned';

    const updatedBooking = await booking.save();
    const populatedBooking = await updatedBooking
      .populate('rentalItem', 'name description')
      .populate('user', 'name email');

    // Send rental completed notification
    await notificationHelper.sendRentalCompleted(booking.user, populatedBooking);

    res.json(populatedBooking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add review/rating to rental item
router.post('/:id/review', auth, async (req, res) => {
  try {
    const booking = await RentalBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check ownership
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { rating, review } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Add review to rental item
    const rentalItem = await RentalItem.findById(booking.rentalItem);
    if (rentalItem) {
      rentalItem.reviews.push({
        user: req.user.id,
        rating,
        review,
        createdAt: new Date(),
      });

      // Update average rating
      const totalRating = rentalItem.reviews.reduce((sum, r) => sum + r.rating, 0);
      rentalItem.rating = (totalRating / rentalItem.reviews.length).toFixed(1);

      await rentalItem.save();
    }

    res.json({ message: 'Review added successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

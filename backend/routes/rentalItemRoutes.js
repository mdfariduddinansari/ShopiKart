const express = require('express');
const router = express.Router();
const RentalItem = require('../models/RentalItem');
const { auth, seller } = require('../middleware/authMiddleware');

// Get all rental items (public - anyone can browse)
router.get('/', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let query = { active: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    let rentalItems = RentalItem.find(query).populate('seller', 'name email');

    if (sort === 'price-asc') {
      rentalItems = rentalItems.sort({ pricePerDay: 1 });
    } else if (sort === 'price-desc') {
      rentalItems = rentalItems.sort({ pricePerDay: -1 });
    } else if (sort === 'featured') {
      rentalItems = rentalItems.sort({ featured: -1, createdAt: -1 });
    } else {
      rentalItems = rentalItems.sort({ createdAt: -1 });
    }

    const items = await rentalItems.exec();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single rental item with availability
router.get('/:id', async (req, res) => {
  try {
    const rentalItem = await RentalItem.findById(req.params.id).populate('seller', 'name email');

    if (!rentalItem) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    res.json(rentalItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check availability for date range (public - for booking flow)
router.post('/:id/check-availability', async (req, res) => {
  try {
    const { startDate, endDate, quantity } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const rentalItem = await RentalItem.findById(req.params.id);

    if (!rentalItem) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    const RentalBooking = require('../models/RentalBooking');
    const requestedQuantity = quantity || 1;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalize dates to compare only the date part (not time)
    const normalizeDate = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const normalizedStart = normalizeDate(start);
    const normalizedEnd = normalizeDate(end);

    // Validate date range
    if (normalizedStart > normalizedEnd) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    if (normalizedStart <= new Date()) {
      return res.status(400).json({ message: 'Start date must be in the future' });
    }

    // Query for overlapping bookings (all statuses except cancelled)
    const allBookings = await RentalBooking.find({
      rentalItem: req.params.id,
      bookingStatus: { 
        $ne: 'cancelled'
      }
    }).select('quantity startDate endDate bookingStatus _id');

    // Filter for overlapping dates using application logic (more reliable)
    const conflictingBookings = allBookings.filter(booking => {
      const bookingStart = normalizeDate(booking.startDate);
      const bookingEnd = normalizeDate(booking.endDate);
      
      // Two ranges overlap if: start1 < end2 AND end1 > start2
      const overlaps = normalizedStart < bookingEnd && normalizedEnd > bookingStart;
      
      return overlaps;
    });

    console.log(`Checking availability for item ${req.params.id}:`, {
      requestedDates: { start: normalizedStart, end: normalizedEnd },
      requestedQuantity,
      totalAvailableStock: rentalItem.availableStock,
      allNonCancelledBookings: allBookings.length,
      conflictingBookings: conflictingBookings.map(b => ({
        quantity: b.quantity,
        status: b.bookingStatus,
        dates: { start: normalizeDate(b.startDate), end: normalizeDate(b.endDate) }
      }))
    });

    // Calculate total quantity booked during this period
    const bookedQuantity = conflictingBookings.reduce((sum, booking) => {
      return sum + (booking.quantity || 1);
    }, 0);

    // Available quantity = total stock - currently booked
    const availableQuantity = rentalItem.availableStock - bookedQuantity;

    console.log(`Availability calculation:`, {
      totalStock: rentalItem.availableStock,
      bookedQuantity,
      availableQuantity,
      requested: requestedQuantity
    });

    // Check if enough quantity is available
    if (requestedQuantity > availableQuantity) {
      // Find earliest available date by checking all bookings
      let earliestAvailableDate = null;
      
      if (bookedQuantity >= rentalItem.availableStock) {
        // Fully booked - find earliest end date
        const endDates = conflictingBookings
          .map(b => new Date(b.endDate))
          .sort((a, b) => a - b);
        
        if (endDates.length > 0) {
          earliestAvailableDate = endDates[0];
        }
      }

      const message = availableQuantity > 0 
        ? `Only ${availableQuantity} item(s) available for these dates (${bookedQuantity} already booked)`
        : 'Item is fully booked for the selected dates.';
      
      return res.json({ 
        available: false, 
        message,
        availableQuantity,
        bookedQuantity,
        requestedQuantity,
        earliestAvailableDate: earliestAvailableDate ? earliestAvailableDate.toISOString().split('T')[0] : null
      });
    }

    // Calculate duration
    const durationDays = Math.ceil((normalizedEnd - normalizedStart) / (1000 * 60 * 60 * 24));

    if (durationDays <= 0) {
      return res.status(400).json({ message: 'Rental duration must be at least 1 day' });
    }

    // Calculate cost
    let baseCost = rentalItem.pricePerDay * durationDays;

    // Check for duration packages
    if (rentalItem.durationPackages && rentalItem.durationPackages.length > 0) {
      for (const pkg of rentalItem.durationPackages) {
        // Support both old and new package structure
        const minDays = pkg.minDays || pkg.duration;
        const maxDays = pkg.maxDays || pkg.duration;
        const price = pkg.totalPrice || pkg.price;
        
        if (durationDays >= minDays && durationDays <= maxDays) {
          baseCost = price;
          break;
        }
      }
    }

    // Multiply by quantity
    const totalCost = baseCost * requestedQuantity;

    return res.json({
      available: true,
      durationDays,
      cost: totalCost,
      baseCost,
      availableStock: rentalItem.availableStock,
      availableQuantity,
      bookedQuantity,
      message: `Perfect! ${requestedQuantity} item(s) available for ${durationDays} days`
    });

  } catch (err) {
    console.error('Availability check error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create rental item (seller only)
router.post('/', seller, async (req, res) => {
  try {
    const { name, description, category, pricePerDay, securityDeposit, durationPackages, availableStock, specifications, images } = req.body;

    if (!name || !description || !category || !pricePerDay || availableStock === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const rentalItem = new RentalItem({
      name,
      description,
      category,
      pricePerDay,
      securityDeposit: securityDeposit || 0,
      durationPackages: durationPackages || [],
      availableStock,
      seller: req.user.id,
      specifications: specifications || {},
      images: images || [],
      active: true,
    });

    const savedItem = await rentalItem.save();
    const populatedItem = await savedItem.populate('seller', 'name email');

    res.status(201).json(populatedItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update rental item (seller only - must be owner)
router.put('/:id', seller, async (req, res) => {
  try {
    const rentalItem = await RentalItem.findById(req.params.id);

    if (!rentalItem) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    // Check ownership
    if (rentalItem.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    const { name, description, category, pricePerDay, securityDeposit, durationPackages, availableStock, specifications, images, active, featured } = req.body;

    if (name) rentalItem.name = name;
    if (description) rentalItem.description = description;
    if (category) rentalItem.category = category;
    if (pricePerDay) rentalItem.pricePerDay = pricePerDay;
    if (securityDeposit !== undefined) rentalItem.securityDeposit = securityDeposit;
    if (durationPackages) rentalItem.durationPackages = durationPackages;
    if (availableStock !== undefined) rentalItem.availableStock = availableStock;
    if (specifications) rentalItem.specifications = specifications;
    if (images) rentalItem.images = images;
    if (active !== undefined) rentalItem.active = active;
    if (featured !== undefined) rentalItem.featured = featured;

    const updatedItem = await rentalItem.save();
    const populatedItem = await updatedItem.populate('seller', 'name email');

    res.json(populatedItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete rental item (seller only - must be owner)
router.delete('/:id', seller, async (req, res) => {
  try {
    const rentalItem = await RentalItem.findById(req.params.id);

    if (!rentalItem) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    // Check ownership
    if (rentalItem.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this item' });
    }

    await RentalItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rental item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get seller's rental items
router.get('/seller/items', seller, async (req, res) => {
  try {
    const items = await RentalItem.find({ seller: req.user.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update availability after booking (called by booking controller)
router.post('/:id/book', async (req, res) => {
  try {
    const { startDate, endDate, bookingId } = req.body;

    if (!startDate || !endDate || !bookingId) {
      return res.status(400).json({ message: 'Missing required booking information' });
    }

    const rentalItem = await RentalItem.findById(req.params.id);

    if (!rentalItem) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    // Add booking to bookedDates
    rentalItem.bookedDates.push({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      bookingRef: bookingId,
    });

    // Update rating if provided in request
    if (req.body.newRating) {
      rentalItem.rating = req.body.newRating;
    }

    const updatedItem = await rentalItem.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove booking from availability (when booking is cancelled)
router.post('/:id/cancel-booking', async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const rentalItem = await RentalItem.findById(req.params.id);

    if (!rentalItem) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    // Remove booking from bookedDates
    rentalItem.bookedDates = rentalItem.bookedDates.filter(
      (booking) => booking.bookingRef.toString() !== bookingId
    );

    const updatedItem = await rentalItem.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all comments for a rental item
router.get('/:id/comments', async (req, res) => {
  try {
    const rentalItem = await RentalItem.findById(req.params.id).populate('comments.user', 'name email');

    if (!rentalItem) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    res.json(rentalItem.comments || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a comment to a rental item
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const rentalItem = await RentalItem.findById(req.params.id);

    if (!rentalItem) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    const newComment = {
      user: req.user.id,
      text: text.trim(),
      createdAt: new Date()
    };

    rentalItem.comments.push(newComment);
    const updatedItem = await rentalItem.save();

    // Populate user info for response
    await updatedItem.populate('comments.user', 'name email');

    // Return just the new comment with user info
    const addedComment = {
      ...newComment,
      _id: updatedItem.comments[updatedItem.comments.length - 1]._id,
      user: {
        name: req.user.name,
        email: req.user.email
      }
    };

    res.status(201).json(addedComment);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

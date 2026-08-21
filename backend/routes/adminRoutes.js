const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getAllUsers,
  deleteUser,
  updateUserRole,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminStats,
  getSalesAnalytics,
  getRentalAnalytics,
  getCustomerBehaviorAnalytics,
} = require('../controllers/adminController');
const RentalItem = require('../models/RentalItem');
const RentalBooking = require('../models/RentalBooking');


router.use(protect, admin);

router.route('/users')
  .get(getAllUsers);

router.route('/users/:id')
  .delete(deleteUser)
  .put(updateUserRole);

router.route('/products')
  .get(getAllProducts) 
  .post(createProduct);  

router.route('/products/:id')
  .put(updateProduct)    
  .delete(deleteProduct);   

// ==== RENTAL ITEMS MANAGEMENT ====
// Get all rental items (admin view - all items including inactive)
router.get('/rental-items', async (req, res) => {
  try {
    const rentalItems = await RentalItem.find()
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json(rentalItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create rental item (admin can create)
router.post('/rental-items', async (req, res) => {
  try {
    const { name, description, category, pricePerDay, securityDeposit, durationPackages, availableStock, specifications, images, active, featured } = req.body;

    if (!name || !description || !category || pricePerDay === undefined || availableStock === undefined) {
      return res.status(400).json({ message: 'Missing required fields: name, description, category, pricePerDay, availableStock' });
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
      specifications: specifications || [],
      images: images || [],
      active: active !== undefined ? active : true,
      featured: featured !== undefined ? featured : false,
    });

    const savedItem = await rentalItem.save();
    const populatedItem = await savedItem.populate('seller', 'name email');

    res.status(201).json(populatedItem);
  } catch (err) {
    console.error('Error creating rental item:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get single rental item
router.get('/rental-items/:id', async (req, res) => {
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

// Update rental item (admin can update any item)
router.put('/rental-items/:id', async (req, res) => {
  try {
    const rentalItem = await RentalItem.findById(req.params.id);

    if (!rentalItem) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    const { name, description, category, pricePerDay, securityDeposit, durationPackages, availableStock, specifications, images, active, featured } = req.body;

    if (name) rentalItem.name = name;
    if (description) rentalItem.description = description;
    if (category) rentalItem.category = category;
    if (pricePerDay !== undefined) rentalItem.pricePerDay = pricePerDay;
    if (securityDeposit !== undefined) rentalItem.securityDeposit = securityDeposit;
    if (durationPackages) rentalItem.durationPackages = durationPackages;
    if (availableStock !== undefined) rentalItem.availableStock = availableStock;
    if (specifications) rentalItem.specifications = specifications;
    if (images) rentalItem.images = images;
    if (active !== undefined) rentalItem.active = active;
    if (featured !== undefined) rentalItem.featured = featured;

    console.log(`Admin updating rental item ${req.params.id}:`, {
      name, pricePerDay, availableStock, active
    });

    const updatedItem = await rentalItem.save();
    const populatedItem = await updatedItem.populate('seller', 'name email');

    res.json(populatedItem);
  } catch (err) {
    console.error('Error updating rental item:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete rental item (admin can delete any item)
router.delete('/rental-items/:id', async (req, res) => {
  try {
    const rentalItem = await RentalItem.findByIdAndDelete(req.params.id);

    if (!rentalItem) {
      return res.status(404).json({ message: 'Rental item not found' });
    }

    res.json({ message: 'Rental item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==== STATS & ANALYTICS ====
router.get('/stats', getAdminStats);
router.get('/analytics/sales', getSalesAnalytics);
router.get('/analytics/rentals', getRentalAnalytics);
router.get('/analytics/customer-behavior', getCustomerBehaviorAnalytics);

module.exports = router;

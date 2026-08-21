// Get user wishlist
const getUserWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    if (user) {
      res.json(user.wishlist || []);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add item to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get product details for notification
    const Product = require('../models/Product');
    const product = await Product.findById(productId);
    const productName = product?.name || 'Product';
    
    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
      
      // Send wishlist notification
      const { sendProductWishlisted } = require('../utils/notificationHelper');
      await sendProductWishlisted(req.user._id, productName);
    }
    res.json(user.wishlist);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Remove item from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
    await user.save();
    res.json(user.wishlist);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
const User = require('../models/User');
const Order = require('../models/order');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};


const registerUser = async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      // Handle referral code if provided
      if (referralCode) {
        console.log(`[Referral] User ${user.email} attempting signup with code: ${referralCode}`);
        try {
          const Referral = require('../models/Referral');
          
          // Find the referral by code
          const referral = await Referral.findOne({ 
            referralCode: referralCode.toUpperCase(),
            isActive: true
          });
          
          console.log(`[Referral] Found referral with code ${referralCode}: ${referral ? 'Yes' : 'No'}`);
          
          if (referral) {
            // Check if user already exists in referrals
            const existingRef = referral.referredUsers.find(r => r.email === user.email);
            
            if (!existingRef) {
              // Get referrer info for the coupon description
              const referrerUser = await User.findById(referral.referrer);
              const referrerName = referrerUser?.name?.split(' ')[0] || 'a friend';
              
              // Add the new user to the referral's list
              referral.referredUsers.push({
                user: user._id,
                email: user.email,
                status: 'signed_up',
                signedUpAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
              });
              
              referral.totalReferrals += 1;
              referral.pendingReferrals += 1;
              
              await referral.save();
              console.log(`[Referral] ✓ User ${user.email} added to referrals (Total: ${referral.totalReferrals}, Pending: ${referral.pendingReferrals})`);
              
              // Create welcome discount coupon for the new user (User B)
              const Coupon = require('../models/Coupon');
              const discountType = referral.refereeReward.type === 'percentage' ? 'percentage' : 'fixed';
              const discountValue = referral.refereeReward.value;
              
              const welcomeCoupon = await Coupon.create({
                code: `WELCOME${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                name: '🎁 Referral Welcome Discount',
                description: `Special ${discountValue}${discountType === 'percentage' ? '%' : '₹'} discount from ${referrerName}!`,
                discountType: discountType,
                discountValue: discountValue,
                maxDiscountAmount: referral.refereeReward.maxReward || 200,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                usageLimitPerUser: 1,
                usageLimit: 1,
                firstPurchaseOnly: true,
                isReferralCoupon: true,
                referralId: referral._id,
                applicableUsers: [user._id],
                minimumOrderAmount: 199,
              });
              console.log(`[Referral] ✓ Welcome coupon created for ${user.email}: ${welcomeCoupon.code} (${discountValue}${discountType === 'percentage' ? '%' : '₹'} off)`);
            } else {
              console.log(`[Referral] User ${user.email} already referred`);
            }
          } else {
            console.log(`Invalid or inactive referral code: ${referralCode}`);
          }
        } catch (refError) {
          console.error('Error processing referral code:', refError);
          // Don't fail registration if referral processing fails
        }
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipcode: user.zipcode || '',
        country: user.country || '',
        addresses: user.addresses || [],
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get user cart
const getUserCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Return cart with properly formatted data including variant info and discount fields
      const formattedCart = (user.cart || []).map(item => ({
        _id: item._id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        discountPrice: item.discountPrice,
        discount: item.discount,
        images: item.images,
        quantity: item.quantity,
        variant: item.variant || null,
      }));
      res.json(formattedCart);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add item to user cart
const addToUserCart = async (req, res) => {
  try {
    const { productId, name, price, images, variant, discountPrice, discount } = req.body;
    console.log('=== ADD TO CART REQUEST ===');
    console.log('Body:', req.body);
    console.log('Variant received:', variant);
    
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Normalize productId to string for comparison
    const normalizedProductId = String(productId);
    
    // Create a function to check if two items are the same (same product AND same variant)
    const isSameItem = (item) => {
      const isSameProduct = item.productId.toString() === normalizedProductId;
      
      // If no variant, just check product ID
      if (!variant) {
        return isSameProduct && !item.variant?.variantId;
      }
      
      // If variant, check both product AND variant
      return isSameProduct && 
             item.variant?.variantId?.toString() === String(variant.variantId);
    };
    
    // Check if same item (product + variant combination) already exists
    const existingItem = user.cart.find(isSameItem);

    if (existingItem) {
      // If same item exists, just increase quantity
      existingItem.quantity += 1;
    } else {
      // Add new item with variant info if provided
      const cartItem = {
        productId, // Let Mongoose handle the conversion to ObjectId
        name,
        price: Number(price) || 0,
        discountPrice: discountPrice !== undefined ? Number(discountPrice) : undefined,
        discount: discount !== undefined ? Number(discount) : undefined,
        images: Array.isArray(images) ? images : [],
        quantity: 1,
      };

      // Add variant information if variant is selected
      if (variant) {
        console.log('Adding variant to cart item:', variant);
        cartItem.variant = {
          variantId: variant.variantId || null,
          type: variant.type || null,
          value: variant.value || null,
          price: Number(variant.price) || null,
          image: variant.image || null
        };
      } else {
        // If no variant, explicitly set variant to null
        cartItem.variant = null;
      }

      console.log('Cart item to add:', cartItem);
      user.cart.push(cartItem);
    }

    await user.save();
    console.log('User cart after save:', user.cart);
    // Return the cart with populated/formatted data (including variant info and discount fields)
    const updatedCart = user.cart.map(item => ({
      _id: item._id,
      productId: item.productId,
      name: item.name,
      price: item.price,
      discountPrice: item.discountPrice,
      discount: item.discount,
      images: item.images,
      quantity: item.quantity,
      variant: item.variant || null,
    }));
    console.log('Returning cart:', updatedCart);
    // Send notification: if product is rental, use rental template, else product added to cart
    try {
      const Product = require('../models/Product');
      const prod = await Product.findById(productId);
      const prodName = prod?.name || 'Product';
      const { sendRentalAddedToCart, sendProductAddedToCart } = require('../utils/notificationHelper');
      if (prod && prod.canBeRented) {
        await sendRentalAddedToCart(req.user._id, prodName);
      } else {
        await sendProductAddedToCart(req.user._id, prodName);
      }
    } catch (err) {
      console.error('Failed to send cart notification:', err);
    }

    return res.json(updatedCart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update cart item quantity
const updateUserCartItem = async (req, res) => {
  try {
    const { productId, quantity, variantId, price, discountPrice, discount } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Normalize productId for comparison
    const normalizedProductId = String(productId);
    
    // Find item matching both productId AND variantId (if variant is provided)
    const cartItem = user.cart.find((item) => {
      const isSameProduct = item.productId.toString() === normalizedProductId;
      
      // If no variant ID, match items without variants
      if (!variantId) {
        return isSameProduct && !item.variant?.variantId;
      }
      
      // If variant ID, match items with the same variant
      return isSameProduct && item.variant?.variantId?.toString() === String(variantId);
    });

    if (cartItem) {
      cartItem.quantity = Math.max(1, Number(quantity) || 1);
      // Update price fields if provided
      if (price !== undefined) cartItem.price = price;
      if (discountPrice !== undefined) cartItem.discountPrice = discountPrice;
      if (discount !== undefined) cartItem.discount = discount;
      await user.save();
      // Return formatted cart with variant info
      const formattedCart = user.cart.map(item => ({
        _id: item._id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        discountPrice: item.discountPrice,
        discount: item.discount,
        images: item.images,
        quantity: item.quantity,
        variant: item.variant || null,
      }));
      res.json(formattedCart);
    } else {
      res.status(404).json({ message: 'Item not found in cart' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Remove item from user cart
const removeFromUserCart = async (req, res) => {
  try {
    const { productId, variantId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Normalize productId for comparison
    const normalizedProductId = String(productId);
    
    // Filter out matching item (based on productId AND variantId)
    user.cart = user.cart.filter((item) => {
      const isSameProduct = item.productId.toString() === normalizedProductId;
      
      // If no variant ID, remove items without variants only
      if (!variantId) {
        return !(isSameProduct && !item.variant?.variantId);
      }
      
      // If variant ID, remove items with matching variant only
      return !(isSameProduct && item.variant?.variantId?.toString() === String(variantId));
    });
    
    await user.save();
    // Return formatted cart with variant info
    const formattedCart = user.cart.map(item => ({
      _id: item._id,
      productId: item.productId,
      name: item.name,
      price: item.price,
      images: item.images,
      quantity: item.quantity,
      variant: item.variant || null,
    }));
    res.json(formattedCart);
    // Send removed from cart notification (best-effort)
    try {
      const Product = require('../models/Product');
      const prod = await Product.findById(productId);
      const prodName = prod?.name || 'Product';
      const { sendProductRemovedFromCart } = require('../utils/notificationHelper');
      await sendProductRemovedFromCart(req.user._id, prodName);
    } catch (err) {
      console.error('Failed to send remove-from-cart notification:', err);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Clear user cart
const clearUserCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.cart = [];
    await user.save();
    res.json([]); // Return empty array
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle password change if provided
    if (req.body.oldPassword && req.body.newPassword) {
      // Verify old password
      const isPasswordCorrect = await user.matchPassword(req.body.oldPassword);
      if (!isPasswordCorrect) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Check if new password is same as old password
      if (req.body.oldPassword === req.body.newPassword) {
        return res.status(400).json({ message: 'New password must be different from current password' });
      }

      // Set new password
      user.password = req.body.newPassword;
    }

    // Update profile fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    user.city = req.body.city || user.city;
    user.state = req.body.state || user.state;
    user.zipcode = req.body.zipcode || user.zipcode;
    user.country = req.body.country || user.country;

    await user.save();
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      zipcode: user.zipcode,
      country: user.country,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get user orders
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('orderItems.product');
    res.json(orders);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add new address
const addAddress = async (req, res) => {
  try {
    const { recipientName, phone, address, city, state, zipcode, type, isDefault } = req.body;
    
    // Validate phone number
    if (phone) {
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10 || !/^[6-9]\d{9}$/.test(phoneDigits)) {
        return res.status(400).json({ 
          message: 'Please provide a valid 10-digit Indian mobile number starting with 6-9' 
        });
      }
    }
    
    // Validate pincode
    if (zipcode) {
      const pincodeDigits = zipcode.replace(/\D/g, '');
      if (pincodeDigits.length !== 6 || !/^\d{6}$/.test(pincodeDigits)) {
        return res.status(400).json({ 
          message: 'Please provide a valid 6-digit Indian pincode' 
        });
      }
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newAddress = {
      recipientName,
      phone,
      address,
      city,
      state,
      zipcode,
      type: type || 'home',
      isDefault: isDefault || false
    };

    // If this is the first address or marked as default, set it as default
    if (user.addresses.length === 0 || isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
      newAddress.isDefault = true;
    }

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      message: 'Address added successfully',
      address: user.addresses[user.addresses.length - 1]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update address
const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { recipientName, phone, address, city, state, zipcode, type, isDefault } = req.body;

    // Validate phone number if provided
    if (phone) {
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10 || !/^[6-9]\d{9}$/.test(phoneDigits)) {
        return res.status(400).json({ 
          message: 'Please provide a valid 10-digit Indian mobile number starting with 6-9' 
        });
      }
    }

    // Validate pincode if provided
    if (zipcode) {
      const pincodeDigits = zipcode.replace(/\D/g, '');
      if (pincodeDigits.length !== 6 || !/^\d{6}$/.test(pincodeDigits)) {
        return res.status(400).json({ 
          message: 'Please provide a valid 6-digit Indian pincode' 
        });
      }
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const addressToUpdate = user.addresses.find(addr => addr._id.toString() === addressId);
    if (!addressToUpdate) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Update address fields
    addressToUpdate.recipientName = recipientName || addressToUpdate.recipientName;
    addressToUpdate.phone = phone || addressToUpdate.phone;
    addressToUpdate.address = address || addressToUpdate.address;
    addressToUpdate.city = city || addressToUpdate.city;
    addressToUpdate.state = state || addressToUpdate.state;
    addressToUpdate.zipcode = zipcode || addressToUpdate.zipcode;
    addressToUpdate.type = type || addressToUpdate.type;

    // Handle default address
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
      addressToUpdate.isDefault = true;
    } else if (isDefault === false) {
      addressToUpdate.isDefault = false;
    }

    await user.save();
    res.json({
      message: 'Address updated successfully',
      address: addressToUpdate
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
    await user.save();

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all addresses for user
const getUserAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.addresses || []);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Send OTP to email for guest checkout verification
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Redis or database (expires in 5 minutes)
    // For now, we'll use a simple in-memory store (in production, use Redis)
    const otpStore = require('../utils/otpStore'); // We'll create this utility
    otpStore.set(email, otp, 5 * 60 * 1000); // 5 minutes expiry

    // Send OTP via email (you can use nodemailer)
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: process.env.MAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Email Verification - ShopiKart',
      html: `
        <h2>Email Verification</h2>
        <p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'OTP sent to your email' });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP for guest checkout
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    // Get OTP from store
    const otpStore = require('../utils/otpStore');
    const storedOtp = otpStore.get(email);

    if (!storedOtp) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new OTP.' });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // OTP is valid, remove it from store
    otpStore.delete(email);

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Request password reset - send OTP to email
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP
    const otpStore = require('../utils/otpStore');
    otpStore.set(`reset_${email}`, otp, 10 * 60 * 1000); // 10 minutes expiry

    // Send OTP via email
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: process.env.MAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Password Reset Request - ShopiKart',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #34a085;">Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your password. Use the OTP below to reset your password:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #34a085; margin: 0; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email from ShopiKart. Please do not reply.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'Password reset OTP sent to your email' });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP and reset password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    // Verify OTP
    const otpStore = require('../utils/otpStore');
    const storedOtp = otpStore.get(`reset_${email}`);

    if (!storedOtp) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update password (will be hashed by pre-save hook in User model)
    user.password = newPassword;
    await user.save();

    // Delete OTP after successful reset
    otpStore.delete(`reset_${email}`);

    res.json({ success: true, message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getUserCart,
  addToUserCart,
  updateUserCartItem,
  removeFromUserCart,
  clearUserCart,
  updateUserProfile,
  getUserOrders,
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  addAddress,
  updateAddress,
  deleteAddress,
  getUserAddresses,
  sendOtp,
  verifyOtp,
  requestPasswordReset,
  resetPassword,
};

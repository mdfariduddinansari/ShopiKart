const Order = require('../models/order');
const User = require('../models/User');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { sendPurchaseCompleted } = require('../utils/notificationHelper');
const RecommendationService = require('../services/recommendationService');

// Create order from cart (for authenticated users)
const createOrder = async (req, res) => {
  try {
    const { shippingAddress, items, couponCode, couponDiscount, subtotal, tax, shipping, paymentMethod } = req.body;
    
    console.log('=== CREATE ORDER ===');
    console.log('Received couponCode:', couponCode);
    console.log('Received couponDiscount:', couponDiscount);
    console.log('Full request body keys:', Object.keys(req.body));
    
    // Validate phone number in shipping address
    if (shippingAddress && shippingAddress.phone) {
      const phoneDigits = shippingAddress.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10 || !/^[6-9]\d{9}$/.test(phoneDigits)) {
        return res.status(400).json({ 
          message: 'Please provide a valid 10-digit Indian mobile number starting with 6-9' 
        });
      }
    }
    
    // Validate pincode in shipping address
    if (shippingAddress && shippingAddress.zipcode) {
      const pincodeDigits = shippingAddress.zipcode.replace(/\D/g, '');
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

    // Use items from request payload if provided, otherwise use user's cart
    let cartItems = items && items.length > 0 ? items : user.cart;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Check and deduct stock for all items
    for (const cartItem of cartItems) {
      const productId = cartItem.productId || cartItem.product;
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${cartItem.name} not found` });
      }
      const quantity = cartItem.quantity || cartItem.qty || 1;
      if (product.stock < quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      // Deduct stock
      product.stock -= quantity;
      await product.save();
    }

    // Calculate items subtotal
    const itemsSubtotal = cartItems.reduce((acc, item) => acc + item.price * (item.quantity || item.qty || 1), 0);

    // Use provided values or calculate defaults
    const orderSubtotal = subtotal || itemsSubtotal;
    const orderTax = tax || 0;
    const orderShipping = shipping || 0;
    const orderCouponDiscount = couponDiscount || 0;

    // Calculate final total price: subtotal + tax + shipping - discount
    const totalPrice = orderSubtotal + orderTax + orderShipping - orderCouponDiscount;

    // Create order items
    const orderItems = cartItems.map((item) => ({
      name: item.name,
      qty: item.quantity || item.qty || 1,
      price: item.price,
      product: item.productId || item.product,
    }));

    // Create order
    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      subtotal: orderSubtotal,
      tax: orderTax,
      shippingCharge: orderShipping,
      totalPrice,
      status: 'pending',
      isGuestOrder: false,
      couponCode: couponCode || null,
      couponDiscount: orderCouponDiscount,
      paymentMethod: paymentMethod || 'cod',
    });

    // Mark coupon as used after successful order creation
    if (couponCode) {
      try {
        console.log(`[Coupon] Processing coupon: ${couponCode}`);
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
        console.log(`[Coupon] Found coupon: ${coupon ? coupon.code : 'NOT FOUND'}`);
        
        if (coupon) {
          console.log(`[Coupon] Current usageCount: ${coupon.usageCount}, usageLimit: ${coupon.usageLimit}, isReferralCoupon: ${coupon.isReferralCoupon}`);
          
          // Track usage
          coupon.usedBy.push({
            userId: req.user._id,
            orderId: order._id,
            discountApplied: couponDiscount || 0,
            usedAt: new Date(),
          });
          coupon.usageCount = (coupon.usageCount || 0) + 1;
          
          console.log(`[Coupon] New usageCount: ${coupon.usageCount}`);
          
          // Only delete REFERRAL coupons after use
          if (coupon.isReferralCoupon) {
            await Coupon.deleteOne({ _id: coupon._id });
            console.log(`[Coupon] ✓ Referral coupon ${couponCode} has been DELETED`);
          } else if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            // If usage limit reached, deactivate the coupon (but don't delete)
            coupon.isActive = false;
            await coupon.save();
            console.log(`[Coupon] ✓ Coupon ${couponCode} deactivated (limit ${coupon.usageLimit} reached)`);
          } else {
            // Just save the updated usage count
            await coupon.save();
            console.log(`[Coupon] ✓ Coupon ${couponCode} usage tracked. Count: ${coupon.usageCount}`);
          }
        } else {
          console.log(`[Coupon] Coupon ${couponCode} not found in database`);
        }
      } catch (couponError) {
        console.error('[Coupon] Error processing coupon:', couponError);
        // Don't fail order if coupon processing fails
      }
    }

    // Clear user cart after successful order creation
    user.cart = [];
    await user.save();

    // Send purchase notifications for each item
    for (const item of orderItems) {
      await sendPurchaseCompleted(req.user._id, item.name, item.price * item.qty);
    }

    // Update user behavior for recommendations
    await RecommendationService.updatePurchaseBehavior(req.user._id, orderItems);

    // Check if this is user's first order and complete referral if applicable
    try {
      const userOrders = await Order.find({ user: req.user._id });
      console.log(`[Referral] User ${user.email} has ${userOrders.length} total orders`);
      
      if (userOrders.length === 1) { // This is the first order
        const Referral = require('../models/Referral');
        const referral = await Referral.findOne({
          'referredUsers.user': req.user._id,
          'referredUsers.status': 'signed_up'
        });

        console.log(`[Referral] Found referral for user: ${referral ? 'Yes' : 'No'}`);

        if (referral) {
          console.log(`[Referral] Processing first purchase for user ${user.email}, amount: ₹${totalPrice}`);
          // Mark first purchase and reward referrer (pass user ID not email)
          const result = await referral.markFirstPurchase(req.user._id, totalPrice);
          if (result.success) {
            console.log(`[Referral] ✓ Referral completed! Referrer earned ₹${result.referrerReward}`);
          } else {
            console.log(`[Referral] ✗ Failed to complete referral: ${result.message}`);
          }
        } else {
          console.log(`[Referral] No active referral found for user ${user.email}`);
        }
      }
    } catch (refError) {
      console.error('[Referral] Error processing referral completion:', refError);
      // Don't fail order if referral processing fails
    }

    // Send order confirmation email
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: process.env.MAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });

      const itemsHtml = orderItems.map(item => 
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.qty}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price.toFixed(2)}</td>
        </tr>`
      ).join('');

      const mailOptions = {
        from: process.env.MAIL_USER,
        to: user.email,
        subject: 'Order Confirmation - ShopiKart',
        html: `
          <h2>Order Confirmation</h2>
          <p>Hi ${user.name},</p>
          <p>Your order has been placed successfully!</p>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
          <h3>Items Ordered:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px; text-align: center;">Quantity</th>
                <th style="padding: 10px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <h3 style="text-align: right; margin-top: 20px;">Total: ₹${totalPrice.toFixed(2)}</h3>
          <p style="margin-top: 20px;">Shipping Address:</p>
          <p>${shippingAddress.name}<br>${shippingAddress.address}<br>${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipcode}</p>
          <p>Thank you for your purchase!</p>
        `,
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Order confirmation email error:', emailError);
      // Don't fail the order if email sending fails
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all orders (admin)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('orderItems.product', 'name price images');
    res.json(orders);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get single order
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('orderItems.product');

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update order status (admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status, isPaid, isDelivered } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (status) {
      order.status = status;
      // Auto-set isDelivered and deliveredAt when status is 'delivered'
      if (status === 'delivered' && !order.isDelivered) {
        order.isDelivered = true;
        order.deliveredAt = new Date();
      }
    }
    if (isPaid !== undefined) {
      order.isPaid = isPaid;
      if (isPaid) order.paidAt = new Date();
    }
    if (isDelivered !== undefined) {
      order.isDelivered = isDelivered;
      if (isDelivered && !order.deliveredAt) {
        order.deliveredAt = new Date();
      }
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cancel order (restore inventory)
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be cancelled (not already delivered or cancelled)
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ message: `Cannot cancel a ${order.status} order` });
    }

    // Restore stock for all items
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.qty;
        await product.save();
      }
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Process fake payment
const processPayment = async (req, res) => {
  try {
    const { orderId, cardNumber, amount } = req.body;

    // Validate card (fake validation)
    if (!cardNumber || cardNumber.length !== 16 || isNaN(cardNumber)) {
      return res.status(400).json({ message: 'Invalid card number' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.totalPrice !== amount) {
      return res.status(400).json({ message: 'Amount mismatch' });
    }

    // Simulate successful payment (90% success rate)
    const isSuccessful = Math.random() < 0.9;

    if (!isSuccessful) {
      return res.status(400).json({ message: 'Payment declined. Please try again.' });
    }

    // Mark order as paid
    order.isPaid = true;
    order.paidAt = new Date();
    order.status = 'processing';
    await order.save();

    res.json({ 
      message: 'Payment successful', 
      order,
      transactionId: `TXN_${Date.now()}`
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Create guest order (no authentication required)
const createGuestOrder = async (req, res) => {
  try {
    const { shippingAddress, items, guestEmail, couponCode, couponDiscount, subtotal, tax, shipping } = req.body;

    // Validate guest email
    if (!guestEmail || !guestEmail.includes('@')) {
      return res.status(400).json({ message: 'Valid email is required for guest checkout' });
    }

    // Validate phone number in shipping address
    if (shippingAddress && shippingAddress.phone) {
      const phoneDigits = shippingAddress.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10 || !/^[6-9]\d{9}$/.test(phoneDigits)) {
        return res.status(400).json({ 
          message: 'Please provide a valid 10-digit Indian mobile number starting with 6-9' 
        });
      }
    }

    // Validate pincode in shipping address
    if (shippingAddress && shippingAddress.zipcode) {
      const pincodeDigits = shippingAddress.zipcode.replace(/\D/g, '');
      if (pincodeDigits.length !== 6 || !/^\d{6}$/.test(pincodeDigits)) {
        return res.status(400).json({ 
          message: 'Please provide a valid 6-digit Indian pincode' 
        });
      }
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Check and deduct stock for all items
    for (const cartItem of items) {
      const productId = cartItem.productId || cartItem.product;
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${cartItem.name} not found` });
      }
      const quantity = cartItem.quantity || cartItem.qty || 1;
      if (product.stock < quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      // Deduct stock
      product.stock -= quantity;
      await product.save();
    }

    // Calculate items subtotal
    const itemsSubtotal = items.reduce((acc, item) => acc + item.price * (item.quantity || item.qty || 1), 0);

    // Use provided values or calculate defaults
    const orderSubtotal = subtotal || itemsSubtotal;
    const orderTax = tax || 0;
    const orderShipping = shipping || 0;
    const orderCouponDiscount = couponDiscount || 0;

    // Calculate final total price: subtotal + tax + shipping - discount
    const totalPrice = orderSubtotal + orderTax + orderShipping - orderCouponDiscount;

    // Create order items
    const orderItems = items.map((item) => ({
      name: item.name,
      qty: item.quantity || item.qty || 1,
      price: item.price,
      product: item.productId || item.product,
    }));

    // Create guest order
    const order = await Order.create({
      guestEmail,
      orderItems,
      shippingAddress,
      subtotal: orderSubtotal,
      tax: orderTax,
      shippingCharge: orderShipping,
      totalPrice,
      status: 'pending',
      isGuestOrder: true,
      couponCode: couponCode || null,
      couponDiscount: orderCouponDiscount,
    });

    // Track coupon usage after guest order
    if (couponCode) {
      try {
        console.log(`[Coupon] Guest order - Processing coupon: ${couponCode}`);
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
        
        if (coupon) {
          // Track usage
          coupon.usedBy.push({
            oderId: order._id,
            discountApplied: couponDiscount || 0,
            usedAt: new Date(),
          });
          coupon.usageCount = (coupon.usageCount || 0) + 1;
          
          // Only delete REFERRAL coupons
          if (coupon.isReferralCoupon) {
            await Coupon.deleteOne({ _id: coupon._id });
            console.log(`[Coupon] ✓ Referral coupon ${couponCode} has been DELETED (guest order)`);
          } else if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            coupon.isActive = false;
            await coupon.save();
            console.log(`[Coupon] ✓ Coupon ${couponCode} deactivated (guest order, limit reached)`);
          } else {
            await coupon.save();
            console.log(`[Coupon] ✓ Coupon ${couponCode} usage tracked (guest order). Count: ${coupon.usageCount}`);
          }
        }
      } catch (couponError) {
        console.error('[Coupon] Error processing coupon (guest):', couponError);
      }
    }

    // Send order confirmation email to guest
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: process.env.MAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });

      const itemsHtml = orderItems.map(item => 
        `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.qty}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price.toFixed(2)}</td>
        </tr>`
      ).join('');

      const mailOptions = {
        from: process.env.MAIL_USER,
        to: guestEmail,
        subject: 'Order Confirmation - ShopiKart',
        html: `
          <h2>Order Confirmation</h2>
          <p>Hello,</p>
          <p>Your order has been placed successfully!</p>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
          <h3>Items Ordered:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px; text-align: center;">Quantity</th>
                <th style="padding: 10px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <h3 style="text-align: right; margin-top: 20px;">Total: ₹${totalPrice.toFixed(2)}</h3>
          <p style="margin-top: 20px;">Shipping Address:</p>
          <p>${shippingAddress.name}<br>${shippingAddress.address}<br>${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipcode}</p>
          <p>Thank you for your purchase!</p>
        `,
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Guest order confirmation email error:', emailError);
      // Don't fail the order if email sending fails
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Request return for delivered order (within 7 days)
 */
const requestReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    console.log('🔄 Return request received:', { orderId, userId: req.user._id, reason: reason?.substring(0, 50) });

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Return reason is required' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      console.error('❌ Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      console.error('❌ Unauthorized return attempt:', { orderId, userId: req.user._id, orderUserId: order.user });
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if order is delivered
    if (!order.isDelivered) {
      console.error('❌ Order not delivered yet:', { orderId, isDelivered: order.isDelivered });
      return res.status(400).json({ message: 'Order must be delivered before requesting return' });
    }

    // Check if deliveredAt is set
    if (!order.deliveredAt) {
      console.error('⚠️ deliveredAt not set for delivered order:', orderId);
      return res.status(400).json({ message: 'Delivery date not recorded. Please contact support.' });
    }

    // Check if return is eligible (within 7 days)
    const isEligible = order.isReturnEligible();
    if (!isEligible) {
      const daysRemaining = order.getDaysRemainingForReturn();
      console.error('❌ Return not eligible:', { orderId, daysRemaining, deliveredAt: order.deliveredAt });
      if (daysRemaining === 0) {
        return res.status(400).json({ 
          message: 'Return window has expired. Returns are only allowed within 7 days of delivery.' 
        });
      }
    }

    // Check if return already requested
    if (order.returnStatus !== 'none') {
      console.error('❌ Return already exists:', { orderId, returnStatus: order.returnStatus });
      return res.status(400).json({ 
        message: `Return already ${order.returnStatus}` 
      });
    }

    // Update order with return request
    order.returnStatus = 'requested';
    order.returnReason = reason.trim();
    order.returnRequestedAt = new Date();

    await order.save();

    console.log('✅ Return request successful:', { orderId, returnStatus: order.returnStatus });

    res.json({
      message: 'Return request submitted successfully',
      order
    });
  } catch (error) {
    console.error('❌ Return request error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all return requests (Admin only)
 */
const getAllReturnRequests = async (req, res) => {
  try {
    const { status } = req.query;

    let query = {
      // Only return orders with valid return data
      returnStatus: { $ne: 'none' },
      returnRequestedAt: { $exists: true, $ne: null },
      returnReason: { $exists: true, $ne: null, $ne: '' }
    };
    
    if (status && status !== 'all') {
      query.returnStatus = status;
    }

    const returns = await Order.find(query)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name images')
      .sort({ returnRequestedAt: -1 });

    console.log(`📊 Admin fetching returns: Found ${returns.length} valid return requests`);

    res.json(returns);
  } catch (error) {
    console.error('❌ Get return requests error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Approve return request (Admin only)
 */
const approveReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { refundAmount } = req.body;

    console.log('✅ Approving return:', { orderId, refundAmount });

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.returnStatus !== 'requested') {
      return res.status(400).json({ message: 'Return request not found or already processed' });
    }

    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({ message: 'Valid refund amount is required' });
    }

    // Update order status
    order.returnStatus = 'approved';
    order.returnApprovedAt = new Date();
    order.refundAmount = refundAmount;

    // Restore product stock
    let stockRestored = 0;
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.qty;
        await product.save();
        stockRestored++;
        console.log(`📦 Stock restored for ${product.name}: +${item.qty} (new stock: ${product.stock})`);
      }
    }

    await order.save();

    console.log(`✅ Return approved. Stock restored for ${stockRestored} products`);

    res.json({
      message: 'Return approved successfully',
      order
    });
  } catch (error) {
    console.error('❌ Approve return error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Reject return request (Admin only)
 */
const rejectReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.returnStatus !== 'requested') {
      return res.status(400).json({ message: 'Return request not found or already processed' });
    }

    // Update order status
    order.returnStatus = 'rejected';
    order.returnRejectedAt = new Date();
    order.returnRejectionReason = rejectionReason.trim();

    await order.save();

    res.json({
      message: 'Return rejected successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Complete return and process refund (Admin only)
 */
const completeReturn = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.returnStatus !== 'approved') {
      return res.status(400).json({ message: 'Return must be approved before completion' });
    }

    // Update order status
    order.returnStatus = 'completed';
    order.returnCompletedAt = new Date();
    order.refundProcessedAt = new Date();

    await order.save();

    res.json({
      message: 'Return completed and refund processed successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Cancel return request (User can cancel before approval)
 */
const cancelReturnRequest = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (order.returnStatus !== 'requested') {
      return res.status(400).json({ message: 'Can only cancel pending return requests' });
    }

    // Reset return fields
    order.returnStatus = 'none';
    order.returnReason = null;
    order.returnRequestedAt = null;

    await order.save();

    res.json({
      message: 'Return request cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  createGuestOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  processPayment,
  requestReturn,
  getAllReturnRequests,
  approveReturn,
  rejectReturn,
  completeReturn,
  cancelReturnRequest,
};

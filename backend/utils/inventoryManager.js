const Product = require('../models/Product');

/**
 * Update product stock with automatic tracking
 */
async function updateProductStock(productId, quantity, type = 'adjustment', options = {}) {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  product.updateStock(quantity, type, options);
  await product.save();
  
  return product;
}

/**
 * Deduct stock for order (sale)
 */
async function deductStock(productId, quantity, orderId = null) {
  return updateProductStock(productId, -quantity, 'sale', { 
    orderId,
    note: `Stock deducted for order ${orderId}` 
  });
}

/**
 * Add stock (restock)
 */
async function addStock(productId, quantity, userId = null, reason = 'Regular restock') {
  return updateProductStock(productId, quantity, 'restock', { 
    userId,
    reason,
    note: `Restocked ${quantity} units` 
  });
}

/**
 * Return stock (customer return)
 */
async function returnStock(productId, quantity, orderId = null) {
  return updateProductStock(productId, quantity, 'return', { 
    orderId,
    note: `Stock returned from order ${orderId}` 
  });
}

/**
 * Adjust stock (manual correction)
 */
async function adjustStock(productId, quantity, note = '') {
  return updateProductStock(productId, quantity, 'adjustment', { note });
}

/**
 * Mark stock as damaged
 */
async function markDamaged(productId, quantity, note = '') {
  return updateProductStock(productId, -quantity, 'damaged', { 
    note: note || `Marked ${quantity} units as damaged` 
  });
}

/**
 * Mark stock as expired
 */
async function markExpired(productId, quantity, note = '') {
  return updateProductStock(productId, -quantity, 'expired', { 
    note: note || `Marked ${quantity} units as expired` 
  });
}

/**
 * Get inventory status for a product
 */
async function getInventoryStatus(productId) {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  return {
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    currentStock: product.stock,
    stockStatus: product.stockStatus,
    lowStockThreshold: product.lowStockThreshold,
    reorderPoint: product.reorderPoint,
    needsReorder: product.needsReorder(),
    isLowStock: product.isLowStock(),
    trackingEnabled: product.inventoryTracking.enabled,
    lastRestocked: product.inventoryTracking.lastRestocked,
    recentMovements: product.inventoryTracking.stockMovements.slice(-10).reverse(),
    variants: product.variants || []
  };
}

/**
 * Get all products needing reorder
 */
async function getReorderList() {
  const products = await Product.getReorderNeeded();
  
  return products.map(p => ({
    id: p._id,
    sku: p.sku,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    currentStock: p.stock,
    reorderPoint: p.reorderPoint,
    lowStockThreshold: p.lowStockThreshold,
    suggestedOrderQuantity: Math.max(p.lowStockThreshold - p.stock, 10),
    lastRestocked: p.inventoryTracking.lastRestocked,
    variants: p.variants || []
  }));
}

/**
 * Get low stock alert list
 */
async function getLowStockAlerts() {
  const products = await Product.getLowStock();
  
  return products.map(p => ({
    id: p._id,
    sku: p.sku,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    currentStock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    reorderPoint: p.reorderPoint,
    alertLevel: 'warning',
    variants: p.variants || []
  }));
}

/**
 * Get inventory dashboard statistics
 */
async function getInventoryStats() {
  const allProducts = await Product.find({ 'inventoryTracking.enabled': true });
  
  const totalProducts = allProducts.length;
  const totalStock = allProducts.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = allProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
  
  const inStock = allProducts.filter(p => p.stockStatus === 'in_stock').length;
  const lowStock = allProducts.filter(p => p.stockStatus === 'low_stock').length;
  const outOfStock = allProducts.filter(p => p.stockStatus === 'out_of_stock').length;
  const reorderNeeded = allProducts.filter(p => p.stockStatus === 'reorder_needed').length;
  
  // Recent stock movements (last 24 hours)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let recentMovements = 0;
  allProducts.forEach(p => {
    const recent = p.inventoryTracking.stockMovements.filter(
      m => new Date(m.date) > yesterday
    );
    recentMovements += recent.length;
  });
  
  // Safe percentage calculation (avoid NaN when totalProducts is 0)
  const calculatePercentage = (value) => {
    return totalProducts > 0 ? Math.round((value / totalProducts) * 100) : 0;
  };
  
  return {
    totalProducts,
    totalStock,
    totalValue: Math.round(totalValue * 100) / 100,
    stockStatus: {
      inStock,
      lowStock,
      outOfStock,
      reorderNeeded
    },
    recentMovements,
    percentages: {
      inStock: calculatePercentage(inStock),
      lowStock: calculatePercentage(lowStock),
      outOfStock: calculatePercentage(outOfStock),
      reorderNeeded: calculatePercentage(reorderNeeded)
    }
  };
}

/**
 * Get stock movement history for a product
 */
async function getStockHistory(productId, limit = 50) {
  const product = await Product.findById(productId).populate('inventoryTracking.stockMovements.orderId', 'orderNumber');
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  return product.inventoryTracking.stockMovements
    .slice(-limit)
    .reverse()
    .map(m => ({
      type: m.type,
      quantity: m.quantity,
      previousStock: m.previousStock,
      newStock: m.newStock,
      date: m.date,
      note: m.note,
      orderId: m.orderId
    }));
}

/**
 * Bulk update stock for multiple products
 */
async function bulkUpdateStock(updates) {
  const results = [];
  
  for (const update of updates) {
    try {
      const product = await updateProductStock(
        update.productId,
        update.quantity,
        update.type || 'adjustment',
        update.options || {}
      );
      results.push({ success: true, productId: update.productId, sku: product.sku });
    } catch (error) {
      results.push({ success: false, productId: update.productId, error: error.message });
    }
  }
  
  return results;
}

module.exports = {
  updateProductStock,
  deductStock,
  addStock,
  returnStock,
  adjustStock,
  markDamaged,
  markExpired,
  getInventoryStatus,
  getReorderList,
  getLowStockAlerts,
  getInventoryStats,
  getStockHistory,
  bulkUpdateStock
};

const Product = require('../models/Product');

/**
 * Generate unique SKU for products
 * Format: [CATEGORY-PREFIX]-[BRAND-CODE]-[TIMESTAMP]-[RANDOM]
 * Example: ELE-SAM-482956-342
 */
async function generateSKU(category, brand, customPrefix = null) {
  const prefix = customPrefix || category.substring(0, 3).toUpperCase();
  const brandCode = brand.substring(0, 3).toUpperCase().replace(/\s/g, '');
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  const sku = `${prefix}-${brandCode}-${timestamp}-${random}`;
  
  // Check for duplicates (rare but possible)
  const existing = await Product.findOne({ sku });
  if (existing) {
    // Recursively try again if duplicate found
    return generateSKU(category, brand, customPrefix);
  }
  
  return sku;
}

/**
 * Generate SKU for product variant
 * Format: [PARENT-SKU]-[VARIANT-TYPE]-[VARIANT-VALUE]
 * Example: ELE-SAM-482956-342-COLOR-RED
 */
function generateVariantSKU(parentSKU, variantType, variantValue) {
  const typeCode = variantType.substring(0, 5).toUpperCase();
  const valueCode = variantValue.substring(0, 5).toUpperCase().replace(/\s/g, '');
  return `${parentSKU}-${typeCode}-${valueCode}`;
}

/**
 * Validate SKU format
 */
function isValidSKU(sku) {
  // Basic format validation: XXX-XXX-XXXXXX-XXX
  const skuPattern = /^[A-Z]{2,4}-[A-Z0-9]{2,4}-\d{6}-\d{3}$/;
  return skuPattern.test(sku);
}

/**
 * Parse SKU to extract components
 */
function parseSKU(sku) {
  if (!isValidSKU(sku)) {
    return null;
  }
  
  const parts = sku.split('-');
  return {
    categoryPrefix: parts[0],
    brandCode: parts[1],
    timestamp: parts[2],
    random: parts[3],
    fullSKU: sku
  };
}

module.exports = {
  generateSKU,
  generateVariantSKU,
  isValidSKU,
  parseSKU
};

const db = require('./db_client');

/**
 * Computes customer profiles by combining core customer attributes
 * with order statistics (total spend, order count, categories, last order date).
 */
function getCustomerProfiles() {
  const customers = db.find('customers');
  const orders = db.find('orders');

  // Map orders by customerId for faster lookups
  const ordersByCustomer = {};
  orders.forEach(order => {
    if (!ordersByCustomer[order.customerId]) {
      ordersByCustomer[order.customerId] = [];
    }
    ordersByCustomer[order.customerId].push(order);
  });

  const now = new Date();

  return customers.map(customer => {
    const customerOrders = ordersByCustomer[customer.id] || [];
    
    // Sort orders by date descending
    const sortedOrders = [...customerOrders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    
    // Calculate aggregates
    const totalSpend = customerOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
    const orderCount = customerOrders.length;
    
    // Find last order details
    const lastOrderDateStr = sortedOrders[0] ? sortedOrders[0].orderDate : null;
    let lastOrderDays = null;
    if (lastOrderDateStr) {
      const lastOrderDate = new Date(lastOrderDateStr);
      const diffTime = Math.abs(now - lastOrderDate);
      lastOrderDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else {
      // If no orders, let's treat lastOrderDays as a large number or null
      lastOrderDays = 9999; 
    }

    // Collect all unique categories
    const categoriesSet = new Set();
    customerOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.category) categoriesSet.add(item.category.toLowerCase());
        });
      }
    });
    const purchasedCategories = Array.from(categoriesSet);

    return {
      ...customer,
      totalSpend,
      orderCount,
      lastOrderDays,
      purchasedCategories,
      lastOrderDate: lastOrderDateStr
    };
  });
}

/**
 * Evaluates a single rule condition against a customer profile.
 */
function evaluateRule(profile, rule) {
  const { field, operator, value } = rule;
  let fieldValue = profile[field];

  // If comparing categories or lists
  if (field === 'purchasedCategories') {
    if (!Array.isArray(fieldValue)) return false;
    const targetValue = String(value).toLowerCase();
    
    if (operator === 'contains') {
      return fieldValue.includes(targetValue);
    }
    if (operator === 'not_contains') {
      return !fieldValue.includes(targetValue);
    }
    return false;
  }

  // Handle numbers
  if (typeof fieldValue === 'number' || !isNaN(fieldValue)) {
    const numFieldVal = Number(fieldValue);
    const numTargetVal = Number(value);

    switch (operator) {
      case 'eq': return numFieldVal === numTargetVal;
      case 'gt': return numFieldVal > numTargetVal;
      case 'gte': return numFieldVal >= numTargetVal;
      case 'lt': return numFieldVal < numTargetVal;
      case 'lte': return numFieldVal <= numTargetVal;
      default: return false;
    }
  }

  // Handle strings (gender, city, email, etc.)
  const strFieldVal = String(fieldValue || '').toLowerCase();
  const strTargetVal = String(value || '').toLowerCase();

  switch (operator) {
    case 'eq': return strFieldVal === strTargetVal;
    case 'contains': return strFieldVal.includes(strTargetVal);
    case 'not_contains': return !strFieldVal.includes(strTargetVal);
    default: return false;
  }
}

/**
 * Filters customer profiles based on a segment structure.
 * Segment structure:
 * {
 *   condition: 'AND' | 'OR',
 *   rules: [ { field, operator, value }, ... ]
 * }
 */
function segmentShoppers(segment) {
  const profiles = getCustomerProfiles();
  if (!segment || !segment.rules || segment.rules.length === 0) {
    return profiles;
  }

  const { condition = 'AND', rules } = segment;

  return profiles.filter(profile => {
    if (condition === 'OR') {
      return rules.some(rule => evaluateRule(profile, rule));
    } else { // default to 'AND'
      return rules.every(rule => evaluateRule(profile, rule));
    }
  });
}

module.exports = {
  getCustomerProfiles,
  segmentShoppers,
  evaluateRule
};

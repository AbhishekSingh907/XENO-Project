const Customer = require('../models/Customer');

/**
 * Builds a Mongoose-compatible query object from visual segment rules
 */
function buildMongoQuery(segment) {
  if (!segment || !segment.rules || segment.rules.length === 0) {
    return {};
  }

  const { condition = 'AND', rules } = segment;
  const ruleQueries = [];

  for (const rule of rules) {
    const { field, operator, value } = rule;
    const ruleQuery = {};

    // 1. Purchased Categories (array check)
    if (field === 'purchasedCategories') {
      const valLower = String(value).toLowerCase();
      if (operator === 'contains') {
        ruleQuery[field] = { $in: [valLower] };
      } else if (operator === 'not_contains') {
        ruleQuery[field] = { $nin: [valLower] };
      }
      ruleQueries.push(ruleQuery);
      continue;
    }

    // 2. Last Order Days (date math)
    if (field === 'lastOrderDays') {
      const days = Number(value);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      if (operator === 'gt') {
        // More than X days ago means lastOrderDate is BEFORE the cutoff date (or null)
        ruleQueries.push({
          $or: [
            { lastOrderDate: { $lt: cutoffDate } },
            { lastOrderDate: null }
          ]
        });
      } else if (operator === 'lt') {
        // Less than X days ago means lastOrderDate is AFTER the cutoff date
        ruleQuery.lastOrderDate = { $gt: cutoffDate };
        ruleQueries.push(ruleQuery);
      }
      continue;
    }

    // 3. Numbers (Spend, orderCount, avgOrderValue)
    if (['totalSpend', 'orderCount', 'avgOrderValue'].includes(field)) {
      const numVal = Number(value);
      const mongoOp = operator === 'gt' ? '$gt' : operator === 'lt' ? '$lt' : '$eq';
      ruleQuery[field] = { [mongoOp]: numVal };
      ruleQueries.push(ruleQuery);
      continue;
    }

    // 4. Text values (Gender, City)
    if (field === 'gender') {
      ruleQuery[field] = String(value).toLowerCase();
      ruleQueries.push(ruleQuery);
      continue;
    }

    if (field === 'city') {
      if (operator === 'contains') {
        ruleQuery[field] = { $regex: new RegExp(value, 'i') };
      } else {
        ruleQuery[field] = String(value);
      }
      ruleQueries.push(ruleQuery);
      continue;
    }
  }

  if (ruleQueries.length === 0) return {};
  
  if (condition === 'OR') {
    return { $or: ruleQueries };
  } else {
    return { $and: ruleQueries };
  }
}

/**
 * Executes a segmentation query and returns the matching customers
 */
async function executeSegmentation(segment) {
  const query = buildMongoQuery(segment);
  return Customer.find(query);
}

module.exports = {
  buildMongoQuery,
  executeSegmentation
};

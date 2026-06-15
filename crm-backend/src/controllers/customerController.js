const Customer = require('../models/Customer');
const Order = require('../models/Order');

exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({});
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({});
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.ingestData = async (req, res) => {
  const { customers, orders } = req.body;
  if (!customers || !orders) {
    return res.status(400).json({ error: 'customers and orders are required' });
  }

  try {
    // Basic bulk insert
    if (customers.length > 0) {
      await Customer.insertMany(customers);
    }
    if (orders.length > 0) {
      await Order.insertMany(orders);
    }
    
    // Recalculate customer metrics (LTV, categories, AOV)
    for (const cust of customers) {
      const custOrders = await Order.find({ customerId: cust._id || cust.id });
      if (custOrders.length > 0) {
        const totalSpend = custOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const orderCount = custOrders.length;
        const avgOrderValue = totalSpend / orderCount;
        
        // Categories
        const catSet = new Set();
        custOrders.forEach(o => {
          o.items.forEach(i => catSet.add(i.category.toLowerCase()));
        });
        const categories = Array.from(catSet);
        
        // Find last order date
        const sorted = [...custOrders].sort((a,b) => new Date(b.orderDate) - new Date(a.orderDate));
        const lastOrderDate = sorted[0].orderDate;

        await Customer.findByIdAndUpdate(cust._id || cust.id, {
          totalSpend,
          orderCount,
          avgOrderValue,
          lastOrderDate,
          purchasedCategories: categories
        });
      }
    }

    res.json({ message: "Data ingested and shopper metrics recalculated." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

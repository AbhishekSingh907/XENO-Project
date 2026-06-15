const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Order = require('./models/Order');
const Campaign = require('./models/Campaign');
const Communication = require('./models/Communication');

const MOCK_CUSTOMERS = [
  { _id: new mongoose.Types.ObjectId('66b600000000000000000001'), name: 'Arjun Mehta', email: 'arjun@gmail.com', gender: 'male', city: 'Mumbai', engagementScore: 92, riskScore: 5, preferredChannel: 'WhatsApp' },
  { _id: new mongoose.Types.ObjectId('66b600000000000000000002'), name: 'Priya Sharma', email: 'priya@yahoo.com', gender: 'female', city: 'Delhi', engagementScore: 35, riskScore: 78, preferredChannel: 'Email' },
  { _id: new mongoose.Types.ObjectId('66b600000000000000000003'), name: 'Rahul Nair', email: 'rahul.nair@outlook.com', gender: 'male', city: 'Bangalore', engagementScore: 84, riskScore: 12, preferredChannel: 'WhatsApp' },
  { _id: new mongoose.Types.ObjectId('66b600000000000000000004'), name: 'Ananya Goel', email: 'ananya@gmail.com', gender: 'female', city: 'Delhi', engagementScore: 95, riskScore: 8, preferredChannel: 'RCS' },
  { _id: new mongoose.Types.ObjectId('66b600000000000000000005'), name: 'Vikram Singh', email: 'vikram.s@gmail.com', gender: 'male', city: 'Mumbai', engagementScore: 28, riskScore: 88, preferredChannel: 'SMS' },
  { _id: new mongoose.Types.ObjectId('66b600000000000000000006'), name: 'Neha Gupta', email: 'neha@rediffmail.com', gender: 'female', city: 'Pune', engagementScore: 68, riskScore: 24, preferredChannel: 'Email' },
  { _id: new mongoose.Types.ObjectId('66b600000000000000000007'), name: 'Rohan Deshmukh', email: 'rohan.d@gmail.com', gender: 'male', city: 'Pune', engagementScore: 78, riskScore: 15, preferredChannel: 'WhatsApp' },
  { _id: new mongoose.Types.ObjectId('66b600000000000000000008'), name: 'Shreya Iyer', email: 'shreya.iyer@gmail.com', gender: 'female', city: 'Chennai', engagementScore: 40, riskScore: 65, preferredChannel: 'Email' },
  { _id: new mongoose.Types.ObjectId('66b600000000000000000009'), name: 'Kabir Kapoor', email: 'kabir.k@gmail.com', gender: 'male', city: 'Mumbai', engagementScore: 88, riskScore: 10, preferredChannel: 'WhatsApp' },
  { _id: new mongoose.Types.ObjectId('66b600000000000000000010'), name: 'Diya Sen', email: 'diya.sen@gmail.com', gender: 'female', city: 'Kolkata', engagementScore: 72, riskScore: 30, preferredChannel: 'RCS' },
  { _id: new mongoose.Types.ObjectId('66b600000000000000000011'), name: 'Amit Patel', email: 'amit@patel.org', gender: 'male', city: 'Ahmedabad', engagementScore: 50, riskScore: 55, preferredChannel: 'SMS' },
  { _id: new mongoose.Types.ObjectId('66b600000000000000000012'), name: 'Sneha Reddy', email: 'sneha.r@gmail.com', gender: 'female', city: 'Hyderabad', engagementScore: 86, riskScore: 14, preferredChannel: 'Email' },
  { _id: new mongoose.Types.ObjectId('66b600000000000000000013'), name: 'Karan Malhotra', email: 'karan@malhotra.net', gender: 'male', city: 'Delhi', engagementScore: 48, riskScore: 60, preferredChannel: 'Email' },
  { _id: new mongoose.Types.ObjectId('66b600000000000000000014'), name: 'Meera Krishnan', email: 'meera.k@gmail.com', gender: 'female', city: 'Chennai', engagementScore: 60, riskScore: 42, preferredChannel: 'WhatsApp' },
  { _id: new mongoose.Types.ObjectId('66b600000000000000000015'), name: 'Aditya Verma', email: 'aditya.v@outlook.com', gender: 'male', city: 'Bangalore', engagementScore: 74, riskScore: 18, preferredChannel: 'RCS' }
];

function getDateDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

const MOCK_ORDERS = [
  // Arjun: High spender, active
  { customerId: '66b600000000000000000001', totalAmount: 125.00, orderDate: getDateDaysAgo(2), items: [{ productName: 'Espresso Roast Beans', price: 30.00, category: 'coffee' }, { productName: 'Linen Shirt', price: 95.00, category: 'fashion' }] },
  { customerId: '66b600000000000000000001', totalAmount: 45.00, orderDate: getDateDaysAgo(12), items: [{ productName: 'Cold Brew Blend', price: 45.00, category: 'coffee' }] },
  
  // Priya: Churn risk, beauty
  { customerId: '66b600000000000000000002', totalAmount: 85.00, orderDate: getDateDaysAgo(50), items: [{ productName: 'Premium Matte Lipstick', price: 50.00, category: 'beauty' }, { productName: 'Hydrating Cleanser', price: 35.00, category: 'beauty' }] },
  
  // Rahul: Coffee lover, active
  { customerId: '66b600000000000000000003', totalAmount: 35.00, orderDate: getDateDaysAgo(4), items: [{ productName: 'French Press Grind Bag', price: 35.00, category: 'coffee' }] },
  { customerId: '66b600000000000000000003', totalAmount: 32.00, orderDate: getDateDaysAgo(22), items: [{ productName: 'Dark Roast Blend', price: 32.00, category: 'coffee' }] },
  { customerId: '66b600000000000000000003', totalAmount: 28.00, orderDate: getDateDaysAgo(60), items: [{ productName: 'Replenishing Brew Filter', price: 28.00, category: 'coffee' }] },

  // Ananya: Fashion VIP
  { customerId: '66b600000000000000000004', totalAmount: 240.00, orderDate: getDateDaysAgo(6), items: [{ productName: 'Silk Wrap Dress', price: 160.00, category: 'fashion' }, { productName: 'Modern Cat-Eye Sunnies', price: 80.00, category: 'fashion' }] },
  { customerId: '66b600000000000000000004', totalAmount: 90.00, orderDate: getDateDaysAgo(42), items: [{ productName: 'Leather Chelsea Boots', price: 90.00, category: 'fashion' }] },

  // Vikram: Low spend, churn risk
  { customerId: '66b600000000000000000005', totalAmount: 20.00, orderDate: getDateDaysAgo(70), items: [{ productName: 'Fictional Novel', price: 20.00, category: 'books' }] },

  // Neha: Medium spender, beauty & fashion
  { customerId: '66b600000000000000000006', totalAmount: 75.00, orderDate: getDateDaysAgo(15), items: [{ productName: 'Summer Straw Hat', price: 25.00, category: 'fashion' }, { productName: 'Daily Defense SPF 50', price: 50.00, category: 'beauty' }] },

  // Rohan: High value tech
  { customerId: '66b600000000000000000007', totalAmount: 350.00, orderDate: getDateDaysAgo(10), items: [{ productName: 'Wireless Active Headset', price: 350.00, category: 'electronics' }] },

  // Shreya: Inactive, beauty
  { customerId: '66b600000000000000000008', totalAmount: 65.00, orderDate: getDateDaysAgo(72), items: [{ productName: 'Advanced Night Serum', price: 65.00, category: 'beauty' }] },

  // Kabir: High spend, coffee & books
  { customerId: '66b600000000000000000009', totalAmount: 18.00, orderDate: getDateDaysAgo(8), items: [{ productName: 'Sci-Fi Classic Novel', price: 18.00, category: 'books' }] },
  { customerId: '66b600000000000000000009', totalAmount: 65.00, orderDate: getDateDaysAgo(32), items: [{ productName: 'Gooseneck Coffee Kettle', price: 65.00, category: 'coffee' }] },

  // Diya: Fashion
  { customerId: '66b600000000000000000010', totalAmount: 190.00, orderDate: getDateDaysAgo(14), items: [{ productName: 'Vintage Denim Jacket', price: 90.00, category: 'fashion' }, { productName: 'Chunky Platform Heels', price: 100.00, category: 'fashion' }] },

  // Sneha Reddy: Active, beauty & books
  { customerId: '66b600000000000000000012', totalAmount: 120.00, orderDate: getDateDaysAgo(5), items: [{ productName: 'Gloss Hair oil', price: 70.00, category: 'beauty' }, { productName: 'Hardcover Design Book', price: 50.00, category: 'books' }] },
  { customerId: '66b600000000000000000012', totalAmount: 40.00, orderDate: getDateDaysAgo(40), items: [{ productName: 'Glycolic Face Toner', price: 40.00, category: 'beauty' }] },

  // Karan: Inactive, electronics
  { customerId: '66b600000000000000000013', totalAmount: 250.00, orderDate: getDateDaysAgo(85), items: [{ productName: 'Mechanical Keyboard Blue Switch', price: 150.00, category: 'electronics' }, { productName: 'RGB Optical Mouse', price: 100.00, category: 'electronics' }] }
];

async function seed() {
  console.log("Mongoose Database Seeding starting...");
  
  try {
    await Customer.deleteMany({});
    await Order.deleteMany({});
    await Campaign.deleteMany({});
    await Communication.deleteMany({});

    // Seed Customers
    const createdCustomers = await Customer.insertMany(MOCK_CUSTOMERS);
    console.log(`Seeded ${createdCustomers.length} Customer documents.`);

    // Seed Orders
    const createdOrders = await Order.insertMany(MOCK_ORDERS);
    console.log(`Seeded ${createdOrders.length} Order documents.`);

    // Recompute metrics for all customers
    for (const cust of createdCustomers) {
      const custOrders = await Order.find({ customerId: cust._id });
      if (custOrders.length > 0) {
        const totalSpend = custOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const orderCount = custOrders.length;
        const avgOrderValue = totalSpend / orderCount;

        const catSet = new Set();
        custOrders.forEach(o => {
          o.items.forEach(i => catSet.add(i.category.toLowerCase()));
        });
        const categories = Array.from(catSet);

        const sorted = [...custOrders].sort((a,b) => new Date(b.orderDate) - new Date(a.orderDate));
        const lastOrderDate = sorted[0].orderDate;

        await Customer.findByIdAndUpdate(cust._id, {
          totalSpend,
          orderCount,
          avgOrderValue,
          lastOrderDate,
          purchasedCategories: categories
        });
      }
    }

    console.log("Database Seed completed successfully.");
  } catch (err) {
    console.error("Database seed error:", err.message);
  }
}

module.exports = seed;

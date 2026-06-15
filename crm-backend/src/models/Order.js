const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true }
});

const OrderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  totalAmount: { type: Number, required: true },
  orderDate: { type: Date, default: Date.now },
  attributedCampaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
  items: [OrderItemSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);

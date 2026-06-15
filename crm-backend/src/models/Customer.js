const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  city: { type: String, required: true },
  totalSpend: { type: Number, default: 0 },
  orderCount: { type: Number, default: 0 },
  avgOrderValue: { type: Number, default: 0 },
  lastOrderDate: { type: Date, default: null },
  purchasedCategories: [{ type: String }],
  engagementScore: { type: Number, min: 0, max: 100, default: 50 },
  riskScore: { type: Number, min: 0, max: 100, default: 10 },
  preferredChannel: { type: String, enum: ['WhatsApp', 'SMS', 'Email', 'RCS'], default: 'Email' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for days since last order
CustomerSchema.virtual('lastOrderDays').get(function() {
  if (!this.lastOrderDate) return 9999;
  const now = new Date();
  const diffTime = Math.abs(now - this.lastOrderDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Customer', CustomerSchema);

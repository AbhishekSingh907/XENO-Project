const mongoose = require('mongoose');

const CommunicationSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  channel: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'SENT', 'DELIVERED', 'OPENED', 'READ', 'CLICKED', 'CONVERTED', 'FAILED'], 
    default: 'PENDING' 
  },
  message: { type: String, required: true },
  couponCode: { type: String },
  conversionValue: { type: Number, default: 0 },
  error: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Communication', CommunicationSchema);

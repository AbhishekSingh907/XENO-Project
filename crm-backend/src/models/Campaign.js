const mongoose = require('mongoose');

const CampaignRuleSchema = new mongoose.Schema({
  field: { type: String, required: true },
  operator: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
});

const CampaignSegmentSchema = new mongoose.Schema({
  condition: { type: String, enum: ['AND', 'OR'], default: 'AND' },
  rules: [CampaignRuleSchema]
});

const CampaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  channel: { type: String, enum: ['WhatsApp', 'SMS', 'Email', 'RCS'], required: true },
  segment: { type: CampaignSegmentSchema, required: true },
  messageTemplate: { type: String, required: true },
  status: { type: String, enum: ['SCHEDULED', 'SENDING', 'COMPLETED', 'FAILED'], default: 'SENDING' },
  scheduledAt: { type: Date, default: null },
  audienceSize: { type: Number, default: 0 },
  sentCount: { type: Number, default: 0 },
  stats: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Campaign', CampaignSchema);

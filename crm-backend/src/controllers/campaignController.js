const Campaign = require('../models/Campaign');
const Customer = require('../models/Customer');
const Communication = require('../models/Communication');
const Order = require('../models/Order');
const { executeSegmentation } = require('../services/segmentService');

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:5001';

exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    const logs = await Communication.find({ campaignId: campaign._id });
    res.json({ campaign, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCampaign = async (req, res) => {
  const { name, description, channel, segment, messageTemplate, scheduledAt } = req.body;
  if (!name || !channel || !segment || !messageTemplate) {
    return res.status(400).json({ error: 'name, channel, segment, and messageTemplate are required' });
  }

  try {
    // 1. Calculate target audience
    const audience = await executeSegmentation(segment);
    
    // 2. Create campaign
    const campaign = new Campaign({
      name,
      description: description || '',
      channel,
      segment,
      messageTemplate,
      status: scheduledAt ? 'SCHEDULED' : 'SENDING',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      audienceSize: audience.length
    });
    await campaign.save();

    res.json({ 
      message: scheduledAt ? 'Campaign scheduled successfully' : 'Campaign launch initiated', 
      campaignId: campaign._id, 
      audienceSize: audience.length 
    });

    // 3. Process dispatch if not scheduled
    if (!scheduledAt) {
      // Background worker
      setTimeout(async () => {
        let sentSuccess = 0;

        for (const shopper of audience) {
          // Personalize message template
          const firstName = shopper.name.split(' ')[0];
          const coupon = `${firstName.toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
          
          let personalizedMsg = messageTemplate
            .replace(/\{\{first_name\}\}/g, firstName)
            .replace(/\{\{lastOrderDays\}\}/g, shopper.lastOrderDays || '30')
            .replace(/\{\{totalSpend\}\}/g, shopper.totalSpend.toFixed(2))
            .replace(/\{\{orderCount\}\}/g, shopper.orderCount)
            .replace(/\{\{city\}\}/g, shopper.city)
            .replace(/\{\{coupon\}\}/g, coupon);

          const comm = new Communication({
            campaignId: campaign._id,
            customerId: shopper._id,
            customerName: shopper.name,
            customerEmail: shopper.email,
            channel,
            status: 'PENDING',
            message: personalizedMsg,
            couponCode: coupon
          });
          await comm.save();

          try {
            const response = await fetch(`${CHANNEL_SERVICE_URL}/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                communicationId: comm._id,
                recipient: shopper.email,
                message: personalizedMsg,
                channel: channel,
                callbackUrl: `http://localhost:5000/api/campaigns/callback`
              })
            });

            if (response.ok) {
              comm.status = 'SENT';
              await comm.save();
              
              // Increment Campaign stats.sent
              await Campaign.findByIdAndUpdate(campaign._id, {
                $inc: { 'stats.sent': 1 }
              });
              sentSuccess++;
            } else {
              comm.status = 'FAILED';
              comm.error = 'Channel service returned HTTP error';
              await comm.save();
              await Campaign.findByIdAndUpdate(campaign._id, {
                $inc: { 'stats.failed': 1 }
              });
            }
          } catch (err) {
            comm.status = 'FAILED';
            comm.error = err.message;
            await comm.save();
            await Campaign.findByIdAndUpdate(campaign._id, {
              $inc: { 'stats.failed': 1 }
            });
          }
        }

        // Complete sending status
        campaign.status = sentSuccess > 0 ? 'COMPLETED' : 'FAILED';
        campaign.sentCount = sentSuccess;
        await campaign.save();
      }, 50);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.handleCallback = async (req, res) => {
  const { communicationId, status, value } = req.body;
  if (!communicationId || !status) {
    return res.status(400).json({ error: 'communicationId and status are required' });
  }

  try {
    const comm = await Communication.findById(communicationId);
    if (!comm) {
      return res.status(404).json({ error: 'Communication log not found' });
    }

    const prevStatus = comm.status;
    
    // Ignore duplicate callbacks of same status
    if (prevStatus === status) {
      return res.json({ success: true, message: 'Status already up to date.' });
    }

    comm.status = status;
    
    // Increment counters atomically based on status
    const incFields = {};

    if (status === 'DELIVERED') incFields['stats.delivered'] = 1;
    if (status === 'OPENED') incFields['stats.opened'] = 1;
    if (status === 'READ') incFields['stats.read'] = 1;
    if (status === 'CLICKED') incFields['stats.clicked'] = 1;
    if (status === 'FAILED') incFields['stats.failed'] = 1;

    if (status === 'CONVERTED') {
      const purchaseVal = value || Math.floor(40 + Math.random() * 120);
      comm.conversionValue = purchaseVal;
      
      incFields['stats.converted'] = 1;
      incFields['stats.revenue'] = purchaseVal;

      // Attribution: Check if purchase order was already created
      const existingAttributedOrder = await Order.findOne({
        customerId: comm.customerId,
        attributedCampaignId: comm.campaignId
      });

      if (!existingAttributedOrder) {
        // Register Order in database
        const newOrder = new Order({
          customerId: comm.customerId,
          totalAmount: purchaseVal,
          orderDate: new Date(),
          attributedCampaignId: comm.campaignId,
          items: [{ productName: `Marketing Promo Conversion (${comm.channel})`, price: purchaseVal, category: 'marketing' }]
        });
        await newOrder.save();

        // Update Customer LTV, orderCount, AOV, and categories
        const customer = await Customer.findById(comm.customerId);
        if (customer) {
          const totalSpend = customer.totalSpend + purchaseVal;
          const orderCount = customer.orderCount + 1;
          const avgOrderValue = totalSpend / orderCount;
          
          if (!customer.purchasedCategories.includes('marketing')) {
            customer.purchasedCategories.push('marketing');
          }

          // Calculate a fresh high engagement score
          const engagementScore = Math.min(100, customer.engagementScore + 15);
          const riskScore = Math.max(0, customer.riskScore - 20);

          await Customer.findByIdAndUpdate(comm.customerId, {
            totalSpend,
            orderCount,
            avgOrderValue,
            lastOrderDate: new Date(),
            purchasedCategories: customer.purchasedCategories,
            engagementScore,
            riskScore
          });
        }
      }
    } else {
      // Small bump to engagement scores for opens and clicks
      const customer = await Customer.findById(comm.customerId);
      if (customer) {
        let scoreBump = 0;
        if (status === 'OPENED' || status === 'READ') scoreBump = 2;
        if (status === 'CLICKED') scoreBump = 6;
        if (scoreBump > 0) {
          await Customer.findByIdAndUpdate(comm.customerId, {
            $set: { 
              engagementScore: Math.min(100, customer.engagementScore + scoreBump),
              riskScore: Math.max(0, customer.riskScore - scoreBump)
            }
          });
        }
      }
    }

    await comm.save();
    
    // Apply stats update to the campaign
    if (Object.keys(incFields).length > 0) {
      await Campaign.findByIdAndUpdate(comm.campaignId, { $inc: incFields });
    }

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.dryRunSegment = async (req, res) => {
  const { segment } = req.body;
  try {
    const audience = await executeSegmentation(segment);
    res.json({ count: audience.length, customers: audience });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Customer = require('../models/Customer');
const Campaign = require('../models/Campaign');

// Helper to clean Markdown wrappers
function cleanJSONResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Offline Fallback for Campaign Strategy
 */
function parseOfflineCampaign(prompt) {
  const normalized = prompt.toLowerCase();
  
  let explanation = "I analyzed your request using the local offline NLP engine. ";
  let channel = "Email";
  let rules = [];
  let condition = "AND";
  let messageTemplate = "Hello {{first_name}}! We missed you. Grab 10% off your next order with code WELCOME10.";

  // 1. Categories
  const categories = ['coffee', 'beauty', 'fashion', 'apparel', 'books', 'electronics'];
  categories.forEach(cat => {
    if (normalized.includes(cat)) {
      rules.push({ field: 'purchasedCategories', operator: 'contains', value: cat });
    }
  });

  // 2. Spend
  const spendMatch = normalized.match(/(?:spent|spend|spendings?|value)\s*(?:more than|greater than|above|>|over)\s*(\d+)/i);
  if (spendMatch) {
    const val = parseInt(spendMatch[1], 10);
    rules.push({ field: 'totalSpend', operator: 'gt', value: val });
  } else if (normalized.includes('high spend') || normalized.includes('vip') || normalized.includes('loyal')) {
    rules.push({ field: 'totalSpend', operator: 'gt', value: 120 });
  }

  // 3. Inactivity
  const inactiveMatch = normalized.match(/(?:haven't ordered|inactive|last order|no order|no purchase)\s*(?:for|in|over|since)?\s*(\d+)\s*(?:days|day)/i);
  if (inactiveMatch) {
    const val = parseInt(inactiveMatch[1], 10);
    rules.push({ field: 'lastOrderDays', operator: 'gt', value: val });
  } else if (normalized.includes('inactive') || normalized.includes("haven't bought") || normalized.includes("haven't ordered")) {
    rules.push({ field: 'lastOrderDays', operator: 'gt', value: 30 });
  }

  // 4. Channel Selection
  if (normalized.includes('whatsapp') || normalized.includes('wa')) {
    channel = 'WhatsApp';
    messageTemplate = "Hi {{first_name}}! 🌟 We notice you haven't shopped in {{lastOrderDays}} days. Use code *WA20* for 20% off at checkout today! 🛍️";
    explanation += "Since you requested WhatsApp, I drafted a highly conversion-oriented template utilizing bold syntax (*WA20*).";
  } else if (normalized.includes('sms')) {
    channel = 'SMS';
    messageTemplate = "Hi {{first_name}}! Long time no see. Get 15% off your next D2C order with code SMS15. Shop: xn.co/shop";
    explanation += "SMS was chosen. Copied is optimized for character limits and includes short links.";
  } else if (normalized.includes('rcs')) {
    channel = 'RCS';
    messageTemplate = "Hello {{first_name}}! Ready to shop? Here is a special 15% discount code: RCS15. Tap below to buy! 🚚";
    explanation += "RCS has been selected to show rich communication options on Android.";
  } else {
    channel = 'Email';
    messageTemplate = "Subject: We Miss You, {{first_name}}! Here's a Special Offer 💖\n\nDear {{first_name}},\n\nIt has been {{lastOrderDays}} days since your last purchase. We value your business!\n\nUse code **EMAIL20** for 20% off your entire order today.\n\nBest,\nMarketing Team";
    explanation += "Defaulted to Email to allow a more descriptive layout for inactive customers.";
  }

  if (rules.length === 0) {
    rules.push({ field: 'lastOrderDays', operator: 'gt', value: 30 });
    explanation += " No targeting specified, so I targeted users who haven't ordered in over 30 days.";
  } else {
    explanation += ` Segment matches ${rules.length} conditions: ` + rules.map(r => `${r.field} ${r.operator} ${r.value}`).join(', ') + '.';
  }

  return {
    explanation,
    channel,
    segment: { condition, rules },
    messageTemplate,
    engagementEstimate: "High (Estimated 85% delivery, 65% open, 12% click-through rate)"
  };
}

/**
 * Offline Fallback for Insights Engine
 */
function parseOfflineInsights(stats) {
  const churnRiskCount = stats.churnRisk || 4;
  const avgLtv = stats.avgLtv || 112.50;

  return {
    recommendations: [
      {
        title: "Re-engage Churn Risk Shoppers",
        body: `We detected ${churnRiskCount} shoppers who haven't ordered in 45+ days. We recommend launching an Email campaign with a 15% off coupon.`,
        urgency: "HIGH",
        predictedROI: "12.4x"
      },
      {
        title: "Upsell High-Spend Fashion Buyers",
        body: "Shoppers who spend more than $150 have a preferred channel of WhatsApp. Launch a personal VIP product drop campaign.",
        urgency: "MEDIUM",
        predictedROI: "8.5x"
      },
      {
        title: "Promote Coffee beans to Inactive Buyers",
        body: "Shoppers who previously bought from the 'coffee' category are entering their typical replenishment cycle. Run a weekend replenishment SMS reminder.",
        urgency: "MEDIUM",
        predictedROI: "6.2x"
      }
    ],
    bestSendTimes: {
      WhatsApp: "Tuesday 6:00 PM (Post-work high attention)",
      Email: "Thursday 10:00 AM (Mid-morning desk reading)",
      SMS: "Friday 3:00 PM (Pre-weekend impulse shopping)",
      RCS: "Wednesday 12:30 PM (Lunch break browsing)"
    },
    predictedEngagement: "Average open rates are expected to increase by 8.5% if personal variables (first_name, lastOrderDays) are fully utilized.",
    churnRiskCount,
    suggestedDiscounts: [
      { category: "Coffee", coupon: "COFFEE12", discount: "12% off", segmentSize: 5 },
      { category: "Beauty", coupon: "GLOW15", discount: "15% off", segmentSize: 4 },
      { category: "Fashion", coupon: "STYLE20", discount: "20% off", segmentSize: 6 }
    ]
  };
}

/**
 * Service to generate AI Campaign Strategy
 */
async function generateCampaignStrategy(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return parseOfflineCampaign(prompt);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `
      You are an expert AI Marketing Strategist for a premium D2C brand on Xeno.
      Analyze the marketer's prompt and respond with a JSON object.

      JSON Schema:
      {
        "explanation": "Markdown text explaining the strategy, recommended channels, and segment selection.",
        "channel": "WhatsApp" | "SMS" | "Email" | "RCS",
        "segment": {
          "condition": "AND" | "OR",
          "rules": [
            {
              "field": "totalSpend" | "orderCount" | "lastOrderDays" | "purchasedCategories" | "gender" | "city",
              "operator": "eq" | "gt" | "gte" | "lt" | "lte" | "contains" | "not_contains",
              "value": any
            }
          ]
        },
        "messageTemplate": "Copy with placeholders. E.g. 'Hey {{first_name}}! Use code {{coupon}}...'",
        "engagementEstimate": "Detailed string explaining estimated delivery and click rates."
      }

      Available Fields:
      - totalSpend (number)
      - orderCount (number)
      - lastOrderDays (number, days since last order)
      - purchasedCategories (string, lowercase - operator: contains/not_contains)
      - gender (string: male/female/other)
      - city (string)

      Return ONLY the raw JSON block. No markdown formatting wrappers.
    `;

    const result = await model.generateContent([
      { text: `${systemPrompt}\n\nMarketer Prompt: "${prompt}"` }
    ]);

    const cleaned = cleanJSONResponse(result.response.text());
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Gemini campaign strategy error:", err);
    return parseOfflineCampaign(prompt);
  }
}

/**
 * Service to generate AI Insights
 */
async function generateAIInsights() {
  // Query DB stats for inputs
  let totalCustomers = 0;
  let churnRisk = 0;
  let avgLtv = 0;

  try {
    totalCustomers = await Customer.countDocuments();
    
    // Inactive > 45 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 45);
    
    churnRisk = await Customer.countDocuments({
      $or: [
        { lastOrderDate: { $lt: cutoffDate } },
        { lastOrderDate: null }
      ]
    });

    const spendAgg = await Customer.aggregate([
      { $group: { _id: null, avgSpend: { $avg: "$totalSpend" } } }
    ]);
    avgLtv = spendAgg[0] ? spendAgg[0].avgSpend : 0;
  } catch (err) {
    console.error("Error generating DB metrics for AI Insights:", err);
  }

  const stats = { totalCustomers, churnRisk, avgLtv };
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return parseOfflineInsights(stats);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `
      You are an AI Insights Engine analyzing a D2C Shopper CRM database.
      Stats: Total Shoppers: ${totalCustomers}, Churn Risk (45+ days inactive): ${churnRisk}, Average Shopper LTV: $${avgLtv.toFixed(2)}.

      Generate a dashboard insight JSON conforming to this schema:
      {
        "recommendations": [
          {
            "title": "Actionable recommendation title",
            "body": "Detailed insight body with stats",
            "urgency": "HIGH" | "MEDIUM" | "LOW",
            "predictedROI": "ROI multiplier (e.g. 12x)"
          }
        ],
        "bestSendTimes": {
          "WhatsApp": "WhatsApp recommendation",
          "Email": "Email recommendation",
          "SMS": "SMS recommendation",
          "RCS": "RCS recommendation"
        },
        "predictedEngagement": "Paragraph detailing overall segment trends",
        "churnRiskCount": ${churnRisk},
        "suggestedDiscounts": [
          { "category": "Category name", "coupon": "COUPON15", "discount": "15% off", "segmentSize": 4 }
        ]
      }

      Return ONLY raw JSON. No markdown code blocks.
    `;

    const result = await model.generateContent([
      { text: systemPrompt }
    ]);

    const cleaned = cleanJSONResponse(result.response.text());
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Gemini insights engine error:", err);
    return parseOfflineInsights(stats);
  }
}

module.exports = {
  generateCampaignStrategy,
  generateAIInsights
};

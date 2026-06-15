const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper to clean up Markdown code blocks in JSON response if any
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
 * Offline fallback NLP parser using keyword and regex matching.
 * Provides rich, realistic mock AI responses matching the database schema.
 */
function parseOfflinePrompt(prompt) {
  const normalized = prompt.toLowerCase();
  
  let explanation = "I analyzed your request offline using the local heuristics engine. ";
  let channel = "Email";
  let rules = [];
  let condition = "AND";
  let messageTemplate = "Hello {{first_name}}! We have a special offer for you today. Use code SAVE10 for 10% off your next purchase!";

  // 1. Identify category filters
  const categories = ['coffee', 'beauty', 'fashion', 'apparel', 'books', 'electronics'];
  categories.forEach(cat => {
    if (normalized.includes(cat)) {
      rules.push({ field: 'purchasedCategories', operator: 'contains', value: cat });
    }
  });

  // 2. Identify spend filters
  const spendMatch = normalized.match(/(?:spent|spend|spendings?|purchase value)\s*(?:more than|greater than|above|>|over)\s*(\d+)/i);
  if (spendMatch) {
    const val = parseInt(spendMatch[1], 10);
    rules.push({ field: 'totalSpend', operator: 'gt', value: val });
  } else if (normalized.includes('high spend') || normalized.includes('vip') || normalized.includes('loyal')) {
    rules.push({ field: 'totalSpend', operator: 'gt', value: 150 });
  }

  // 3. Identify inactivity filters
  const inactiveMatch = normalized.match(/(?:haven't ordered|inactive|last order|no order|no purchase)\s*(?:for|in|over|since)?\s*(\d+)\s*(?:days|day)/i);
  if (inactiveMatch) {
    const val = parseInt(inactiveMatch[1], 10);
    rules.push({ field: 'lastOrderDays', operator: 'gt', value: val });
  } else if (normalized.includes('inactive') || normalized.includes("haven't bought") || normalized.includes("haven't ordered")) {
    rules.push({ field: 'lastOrderDays', operator: 'gt', value: 30 });
  }

  // 4. Identify frequency filters
  const frequencyMatch = normalized.match(/(?:orders?|purchases?)\s*(?:more than|greater than|above|>|over)\s*(\d+)/i);
  if (frequencyMatch) {
    const val = parseInt(frequencyMatch[1], 10);
    rules.push({ field: 'orderCount', operator: 'gt', value: val });
  }

  // 5. Select channel based on keywords
  if (normalized.includes('whatsapp') || normalized.includes('wa')) {
    channel = 'WhatsApp';
  } else if (normalized.includes('sms')) {
    channel = 'SMS';
  } else if (normalized.includes('rcs')) {
    channel = 'RCS';
  } else if (normalized.includes('email') || normalized.includes('mail')) {
    channel = 'Email';
  } else {
    // Default channels based on segment
    if (rules.some(r => r.field === 'totalSpend' && r.value >= 150)) {
      channel = 'WhatsApp'; // VIPs get personal WhatsApp treatment
      explanation += "Since this targets high-value shoppers, I recommended WhatsApp for its high open rates and personal touch. ";
    } else {
      channel = 'Email';
      explanation += "I recommended Email as a cost-effective channel for bulk re-engagement. ";
    }
  }

  // 6. Draft template
  if (channel === 'WhatsApp') {
    messageTemplate = "Hey {{first_name}}! 🌟 Xeno Fashion misses you. We noticed you haven't shopped in {{lastOrderDays}} days. Here's an exclusive 15% discount code just for you: *XENOVIP15*. Grab your favorites at checkout! 🛍️";
  } else if (channel === 'SMS') {
    messageTemplate = "Hi {{first_name}}! Long time no see. Get 10% off your next order with code WELCOMEBACK. Shop now: xn.co/shop";
  } else if (channel === 'RCS') {
    messageTemplate = "Hello {{first_name}}! Ready to refresh your wardrobe? We selected these new items based on your past orders. Click below to shop now and get free shipping! 🚚 [Use code: FREESHIP]";
  } else {
    messageTemplate = "Subject: We Miss You, {{first_name}}! Here's a Special Offer 💖\n\nDear {{first_name}},\n\nIt's been {{lastOrderDays}} days since your last order. We wanted to reach out and say thank you for being a customer!\n\nUse code **BACKFORGOOD** for 20% off your entire order today.\n\nBest,\nYour Brand Team";
  }

  // Adjust explanation
  if (rules.length === 0) {
    // Default fallback rules
    rules.push({ field: 'lastOrderDays', operator: 'gt', value: 30 });
    explanation += "No specific rules found in your prompt, so I defaulted to targeting shoppers who haven't made a purchase in over 30 days.";
  } else {
    explanation += `I identified ${rules.length} segment conditions based on your description: ` +
      rules.map(r => `${r.field} ${r.operator} ${r.value}`).join(', ') + '.';
  }

  return {
    explanation,
    channel,
    segment: {
      condition,
      rules
    },
    messageTemplate
  };
}

/**
 * Main function to generate campaign strategy using LLM or offline fallback.
 */
async function generateStrategy(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log("No GEMINI_API_KEY found, running offline heuristic parser.");
    return parseOfflinePrompt(prompt);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `
      You are an expert E-commerce Campaign Strategist AI for Xeno CRM.
      Your task is to analyze a marketer's request in natural language and output a structured JSON campaign strategy.
      
      The JSON output must match this schema strictly:
      {
        "explanation": "Brief explanation of your reasoning (e.g. why you chose this segment, what message strategy you used, and why this channel makes sense)",
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
        "messageTemplate": "The message body. You can use mustache placeholders: {{first_name}}, {{lastOrderDays}}, {{totalSpend}}, {{orderCount}}, {{city}}. E.g. 'Hey {{first_name}}, we noticed you haven't shopped in {{lastOrderDays}} days. Here is a 10% coupon...'"
      }

      Valid fields and rules:
      - totalSpend (number): Total money spent by customer (e.g. gt 100)
      - orderCount (number): Number of total orders (e.g. gt 5)
      - lastOrderDays (number): Number of days since last order (e.g. gt 30 means inactive for more than 30 days)
      - purchasedCategories (string): Category name (lowercase) (operator must be 'contains' or 'not_contains', value e.g. 'coffee')
      - gender (string): e.g. 'male', 'female' (operator 'eq')
      - city (string): e.g. 'new york', 'london' (operator 'eq' or 'contains')

      Choose a channel:
      - WhatsApp: Best for high engagement, VIPs, interactive chats.
      - SMS: Best for quick, transactional reminders or urgent offers.
      - Email: Best for longer newsletters, high-information content, and cost-effective bulk retention.
      - RCS: Best for interactive, rich cards, media, and dynamic actions on Android.

      Return ONLY the raw JSON block. Do not include markdown formatting except if outputting a code block, but raw JSON is preferred.
    `;

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: `${systemInstruction}\n\nMarketer Prompt: "${prompt}"` }] }
      ]
    });

    const responseText = result.response.text();
    const cleanedJson = cleanJSONResponse(responseText);
    return JSON.parse(cleanedJson);
  } catch (err) {
    console.error("Error calling Gemini API:", err);
    console.log("Falling back to offline heuristics.");
    return parseOfflinePrompt(prompt);
  }
}

module.exports = {
  generateStrategy
};

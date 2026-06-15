const { generateCampaignStrategy, generateAIInsights } = require('../services/aiService');

exports.runStrategist = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const strategy = await generateCampaignStrategy(prompt);
    res.json(strategy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInsights = async (req, res) => {
  try {
    const insights = await generateAIInsights();
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

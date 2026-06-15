const express = require('express');
const cors = require('cors');
const deliveryQueue = require('./delivery_queue');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Simulated Channel Service' });
});

/**
 * Endpoint called by the CRM to queue a message dispatch
 */
app.post('/send', (req, res) => {
  const { communicationId, recipient, message, channel, callbackUrl } = req.body;

  if (!communicationId || !recipient || !message || !channel || !callbackUrl) {
    return res.status(400).json({ 
      error: 'Missing required parameters: communicationId, recipient, message, channel, callbackUrl' 
    });
  }

  // Enqueue task for simulated sending
  deliveryQueue.enqueue({
    communicationId,
    recipient,
    message,
    channel,
    callbackUrl
  });

  res.status(202).json({ 
    status: 'QUEUED', 
    message: `Message ${communicationId} successfully enqueued for delivery simulation.` 
  });
});

app.listen(PORT, () => {
  console.log(`Channel Service running on port ${PORT}`);
});

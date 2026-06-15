const EventEmitter = require('events');

// Stats configuration for simulated delivery lifecycle by channel
const CHANNEL_PROFILES = {
  WhatsApp: { deliveryRate: 0.98, openRate: 0.92, readRate: 0.85, clickRate: 0.25, convRate: 0.08 },
  SMS:      { deliveryRate: 0.94, openRate: 0.85, readRate: 0.60, clickRate: 0.08, convRate: 0.03 },
  Email:    { deliveryRate: 0.99, openRate: 0.28, readRate: 0.22, clickRate: 0.04, convRate: 0.01 },
  RCS:      { deliveryRate: 0.92, openRate: 0.82, readRate: 0.70, clickRate: 0.14, convRate: 0.05 }
};

class DeliveryQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false;
    this.retryQueue = [];
    
    // Periodically log queue size
    setInterval(() => {
      if (this.queue.length > 0 || this.retryQueue.length > 0) {
        console.log(`[Queue Stats] Active Delivery Queue: ${this.queue.length} | Callback Retries Pending: ${this.retryQueue.length}`);
      }
    }, 5000);
  }

  /**
   * Add a message to the delivery simulation queue.
   */
  enqueue(messageTask) {
    this.queue.push(messageTask);
    console.log(`[Queue] Enqueued message ${messageTask.communicationId} for ${messageTask.recipient}`);
    this.processQueue();
  }

  /**
   * Process the next item in the delivery queue.
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const task = this.queue.shift();
    
    // Simulate sending network latency
    const sendDelay = 500 + Math.random() * 1000; // 0.5s to 1.5s
    setTimeout(async () => {
      try {
        await this._simulateLifecycle(task);
      } catch (err) {
        console.error(`[Queue] Error processing task ${task.communicationId}:`, err);
      } finally {
        this.processing = false;
        // Process next item in the queue
        this.processQueue();
      }
    }, sendDelay);
  }

  /**
   * Simulates the full multi-stage async lifecycle of a communication.
   */
  async _simulateLifecycle(task) {
    const { communicationId, channel, callbackUrl } = task;
    const profile = CHANNEL_PROFILES[channel] || CHANNEL_PROFILES.Email;

    // Stage 1: Delivery
    const isDelivered = Math.random() < profile.deliveryRate;
    if (!isDelivered) {
      console.log(`[Simulation] ${communicationId} (${channel}) -> FAILED`);
      await this._triggerCallback(callbackUrl, { communicationId, status: 'FAILED' });
      return;
    }

    console.log(`[Simulation] ${communicationId} (${channel}) -> DELIVERED`);
    await this._triggerCallback(callbackUrl, { communicationId, status: 'DELIVERED' });

    // Stage 2: Open (Optional)
    const openDelay = 1000 + Math.random() * 2000; // 1-3s
    setTimeout(async () => {
      const isOpened = Math.random() < profile.openRate;
      if (!isOpened) return;

      console.log(`[Simulation] ${communicationId} (${channel}) -> OPENED`);
      await this._triggerCallback(callbackUrl, { communicationId, status: 'OPENED' });

      // Stage 3: Read (Optional)
      const readDelay = 1000 + Math.random() * 2000;
      setTimeout(async () => {
        const isRead = Math.random() < profile.readRate;
        if (!isRead) return;

        console.log(`[Simulation] ${communicationId} (${channel}) -> READ`);
        await this._triggerCallback(callbackUrl, { communicationId, status: 'READ' });

        // Stage 4: Click (Optional)
        const clickDelay = 2000 + Math.random() * 3000; // 2-5s
        setTimeout(async () => {
          const isClicked = Math.random() < profile.clickRate;
          if (!isClicked) return;

          console.log(`[Simulation] ${communicationId} (${channel}) -> CLICKED`);
          await this._triggerCallback(callbackUrl, { communicationId, status: 'CLICKED' });

          // Stage 5: Convert (Optional, e-commerce purchase attribution!)
          const convDelay = 3000 + Math.random() * 4000; // 3-7s
          setTimeout(async () => {
            const isConverted = Math.random() < profile.convRate;
            if (!isConverted) return;

            // Generate a realistic order size
            const purchaseValue = Math.floor(40 + Math.random() * 160); // $40 to $200
            console.log(`[Simulation] ${communicationId} (${channel}) -> CONVERTED ($${purchaseValue})`);
            await this._triggerCallback(callbackUrl, { 
              communicationId, 
              status: 'CONVERTED', 
              value: purchaseValue 
            });
          }, convDelay);

        }, clickDelay);

      }, readDelay);

    }, openDelay);
  }

  /**
   * Invokes the CRM webhook with retry logic.
   */
  async _triggerCallback(url, payload, attempt = 1) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
    } catch (err) {
      console.warn(`[Callback Failed] Failed callback for ${payload.communicationId} (Status: ${payload.status}) - Attempt ${attempt}. Error: ${err.message}`);
      
      const maxAttempts = 4;
      if (attempt < maxAttempts) {
        const retryDelay = Math.pow(3, attempt) * 1000; // Exponential backoff: 3s, 9s, 27s
        
        const retryTask = { url, payload, attempt: attempt + 1, runAt: Date.now() + retryDelay };
        this.retryQueue.push(retryTask);

        setTimeout(() => {
          // Remove from retry queue when we start executing it
          this.retryQueue = this.retryQueue.filter(r => r !== retryTask);
          this._triggerCallback(url, payload, attempt + 1);
        }, retryDelay);

        console.log(`[Retry Queue] Scheduled retry ${attempt + 1}/${maxAttempts} in ${retryDelay / 1000}s`);
      } else {
        console.error(`[Callback Dead] Failed all ${maxAttempts} callback attempts for ${payload.communicationId}`);
      }
    }
  }
}

const deliveryQueue = new DeliveryQueue();
module.exports = deliveryQueue;

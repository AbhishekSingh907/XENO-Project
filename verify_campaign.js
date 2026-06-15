// Programmatic E2E Campaign Verification Script
// Tests Mongoose aggregation pipelines and the asynchronous delivery webhook callback loop.

async function run() {
  console.log("=== Starting CRM Verification ===");

  try {
    // 1. Health check
    console.log("1. Checking CRM Backend health...");
    const healthRes = await fetch('http://localhost:5000/api/health');
    const health = await healthRes.json();
    console.log("Health status:", health);

    // 2. Customer count
    console.log("\n2. Querying customer database...");
    const custRes = await fetch('http://localhost:5000/api/customers');
    const customers = await custRes.json();
    console.log(`Found ${customers.length} shopper profiles in MongoDB.`);

    // 3. Dry-run segmentation
    console.log("\n3. Testing Segment Builder dry-run...");
    const segment = {
      condition: 'AND',
      rules: [{ field: 'totalSpend', operator: 'gt', value: 120 }]
    };
    const dryRunRes = await fetch('http://localhost:5000/api/campaigns/dry-run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segment })
    });
    const dryRun = await dryRunRes.json();
    console.log(`Audience size for spend > $120: ${dryRun.count} shoppers.`);

    // 4. Launch Campaign
    console.log("\n4. Launching VIP WhatsApp Campaign...");
    const campaignData = {
      name: "VIP Appreciation Campaign",
      description: "Auto-generated test campaign",
      channel: "WhatsApp",
      segment: segment,
      messageTemplate: "Hey {{first_name}}! Thanks for spending ${{totalSpend}} with us. Here is code VIP50."
    };

    const campaignLaunchRes = await fetch('http://localhost:5000/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignData)
    });
    const launchResult = await campaignLaunchRes.json();
    console.log("Launch response:", launchResult);
    const campaignId = launchResult.campaignId;

    // 5. Monitor callbacks
    console.log(`\n5. Monitoring delivery callbacks for Campaign ${campaignId}...`);
    console.log("Waiting 8 seconds for simulation events (sends, opens, clicks, sales) to process...");
    await new Promise(resolve => setTimeout(resolve, 8000));

    // 6. Fetch stats
    const campaignsRes = await fetch('http://localhost:5000/api/campaigns');
    const campaigns = await campaignsRes.json();
    const targetCampaign = campaigns.find(c => c._id === campaignId);

    console.log("\n6. Live Campaign Statistics:");
    console.log("---------------------------------------");
    console.log("Total Target Audience: ", targetCampaign.stats.total || targetCampaign.audienceSize);
    console.log("Delivered Messages:   ", targetCampaign.stats.delivered);
    console.log("Opened Messages:      ", targetCampaign.stats.opened);
    console.log("Read Messages:        ", targetCampaign.stats.read);
    console.log("Clicked Links:        ", targetCampaign.stats.clicked);
    console.log("Purchases Generated:  ", targetCampaign.stats.converted);
    console.log("Total ROI (Revenue):  ", `$${targetCampaign.stats.revenue}`);
    console.log("---------------------------------------");

    if (targetCampaign.stats.delivered > 0) {
      console.log("SUCCESS: Asynchronous callback loop works perfectly!");
    } else {
      console.log("ERROR: No callbacks received.");
    }

  } catch (err) {
    console.error("Verification failed:", err.message);
  }
}

run();

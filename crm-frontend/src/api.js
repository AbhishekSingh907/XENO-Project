const CRM_API_URL = 'http://localhost:5000/api';

export async function fetchCustomers() {
  const res = await fetch(`${CRM_API_URL}/customers`);
  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

export async function fetchCampaigns() {
  const res = await fetch(`${CRM_API_URL}/campaigns`);
  if (!res.ok) throw new Error('Failed to fetch campaigns');
  return res.json();
}

export async function fetchCampaignDetails(id) {
  const res = await fetch(`${CRM_API_URL}/campaigns/${id}`);
  if (!res.ok) throw new Error('Failed to fetch campaign details');
  return res.json();
}

export async function createCampaign(campaignData) {
  const res = await fetch(`${CRM_API_URL}/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(campaignData)
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to launch campaign');
  }
  return res.json();
}

export async function runSegmentDryRun(segment) {
  const res = await fetch(`${CRM_API_URL}/segments/dry-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ segment })
  });
  if (!res.ok) throw new Error('Failed to dry-run segment');
  return res.json();
}

export async function getAIStrategy(prompt) {
  const res = await fetch(`${CRM_API_URL}/ai/strategist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to analyze prompt');
  }
  return res.json();
}

export async function resetDatabase() {
  const res = await fetch(`${CRM_API_URL}/seed`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to reset database');
  return res.json();
}

import { create } from 'zustand';

const getApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

const API_BASE = getApiUrl();

export const useCRMStore = create((set, get) => ({
  customers: [],
  campaigns: [],
  orders: [],
  insights: null,
  activeTab: 'dashboard',
  activeCampaignId: null,
  activeCustomerId: null,
  aiChatHistory: [
    {
      role: 'ai',
      text: "Welcome back, Chief Marketer. 🔮 I've mapped the database and recalculated LTV scores.\n\nAsk me to target a segment or build a strategy: e.g., *'Find high-spend beauty shoppers in Delhi and draft a WhatsApp campaign with 20% off.'*"
    }
  ],
  strategistProposal: null,
  loading: {
    data: true,
    ai: false,
    campaign: false,
    insights: false
  },
  connectionError: null,

  // Set active routing tab
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Select a campaign for the control tower
  setActiveCampaignId: (id) => set({ activeCampaignId: id }),

  // Select a customer for details timeline modal
  setActiveCustomerId: (id) => set({ activeCustomerId: id }),

  // Fetch all core datasets from server
  loadData: async (silent = false) => {
    if (!silent) {
      set(state => ({ loading: { ...state.loading, data: true } }));
    }
    try {
      const [custRes, campRes, ordRes] = await Promise.all([
        fetch(`${API_BASE}/customers`),
        fetch(`${API_BASE}/campaigns`),
        fetch(`${API_BASE}/orders`)
      ]);

      if (!custRes.ok || !campRes.ok || !ordRes.ok) {
        throw new Error("One or more server queries failed.");
      }

      const [customers, campaigns, orders] = await Promise.all([
        custRes.json(),
        campRes.json(),
        ordRes.json()
      ]);

      set({ 
        customers, 
        campaigns, 
        orders, 
        connectionError: null 
      });
    } catch (err) {
      console.error("CRM Store loading error:", err);
      set({ connectionError: "Failed to connect to the CRM Backend. Ensure Port 5000 is listening." });
    } finally {
      if (!silent) {
        set(state => ({ loading: { ...state.loading, data: false } }));
      }
    }
  },

  // Fetch AI Insights
  loadInsights: async () => {
    set(state => ({ loading: { ...state.loading, insights: true } }));
    try {
      const res = await fetch(`${API_BASE}/ai/insights`);
      if (res.ok) {
        const insights = await res.json();
        set({ insights });
      }
    } catch (err) {
      console.error("Failed to load AI Insights:", err);
    } finally {
      set(state => ({ loading: { ...state.loading, insights: false } }));
    }
  },

  // Submit AI Strategist Prompts
  submitAIPrompt: async (prompt) => {
    if (!prompt.trim()) return;

    // Append user query to chat history
    set(state => ({
      aiChatHistory: [...state.aiChatHistory, { role: 'user', text: prompt }],
      loading: { ...state.loading, ai: true },
      strategistProposal: null
    }));

    try {
      const res = await fetch(`${API_BASE}/ai/strategist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) throw new Error("AI Strategist failed to process prompt.");
      
      const proposal = await res.json();

      set(state => ({
        aiChatHistory: [
          ...state.aiChatHistory,
          { role: 'ai', text: proposal.explanation }
        ],
        strategistProposal: proposal
      }));

      return proposal;
    } catch (err) {
      console.error(err);
      set(state => ({
        aiChatHistory: [
          ...state.aiChatHistory,
          { role: 'ai', text: "Error: I encountered a latency block contacting the strategy model. Please try again." }
        ]
      }));
    } finally {
      set(state => ({ loading: { ...state.loading, ai: false } }));
    }
  },

  // Execute Campaign
  launchCampaign: async (campaignData) => {
    set(state => ({ loading: { ...state.loading, campaign: true } }));
    try {
      const res = await fetch(`${API_BASE}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Launch failed.");
      }

      const launchResult = await res.json();
      
      // Force reload data to reflect the new campaign
      await get().loadData(true);

      // Append success message to AI chat if we came from AIStrategist
      set(state => ({
        aiChatHistory: [
          ...state.aiChatHistory,
          { 
            role: 'ai', 
            text: `🚀 **Campaign Dispatch Activated**: "${campaignData.name}" has been launched successfully targeting ${launchResult.audienceSize} shoppers via ${campaignData.channel}.\n\nYou can track simulated open and click callbacks in the Campaign Control Tower.` 
          }
        ],
        strategistProposal: null
      }));

      return launchResult;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      set(state => ({ loading: { ...state.loading, campaign: false } }));
    }
  },

  // Reset database to initial mock state
  resetDatabase: async () => {
    try {
      const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
      if (res.ok) {
        await get().loadData(false);
        await get().loadInsights();
        set({ strategistProposal: null });
      }
    } catch (err) {
      console.error("Database reset failed:", err);
    }
  }
}));

import React, { useState, useRef, useEffect } from 'react';
import { useCRMStore } from '../store/crmStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Play, Users, MessageSquare, AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "Find fashion shoppers in Delhi and draft a WhatsApp discount",
  "Retarget inactive coffee buyers with a weekend SMS promo",
  "Find high-value shoppers and write an appreciation email"
];

export default function AICommandCenter() {
  const { 
    aiChatHistory, 
    strategistProposal, 
    submitAIPrompt, 
    launchCampaign, 
    loading,
    setActiveTab,
    setActiveCampaignId
  } = useCRMStore();

  const [promptInput, setPromptInput] = useState('');
  const [proposalName, setProposalName] = useState('');
  const [proposalDesc, setProposalDesc] = useState('');
  const [proposalChannel, setProposalChannel] = useState('Email');
  const [proposalTemplate, setProposalTemplate] = useState('');
  const [audienceCount, setAudienceCount] = useState(null);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [launchError, setLaunchError] = useState('');
  const [launchSuccess, setLaunchSuccess] = useState(false);

  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatHistory, loading.ai]);

  // Sync state when new proposal is generated
  useEffect(() => {
    if (strategistProposal) {
      setProposalName(`AI-Strategist: ${strategistProposal.channel} Re-engage`);
      setProposalDesc(`AI-generated campaign targeting ${strategistProposal.channel} shoppers`);
      setProposalChannel(strategistProposal.channel);
      setProposalTemplate(strategistProposal.messageTemplate);
      runDryRun(strategistProposal.segment);
    }
  }, [strategistProposal]);

  const runDryRun = async (segment) => {
    setAudienceLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/campaigns/dry-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segment })
      });
      if (res.ok) {
        const data = await res.json();
        setAudienceCount(data.count);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAudienceLoading(false);
    }
  };

  const handleSendPrompt = async (textToSend) => {
    const text = textToSend || promptInput;
    if (!text.trim() || loading.ai) return;

    setPromptInput('');
    setLaunchSuccess(false);
    setLaunchError('');
    await submitAIPrompt(text);
  };

  const handleLaunch = async () => {
    if (!strategistProposal || loading.campaign) return;
    setLaunchError('');

    try {
      const res = await launchCampaign({
        name: proposalName,
        description: proposalDesc,
        channel: proposalChannel,
        segment: strategistProposal.segment,
        messageTemplate: proposalTemplate
      });

      setLaunchSuccess(true);
      
      // Navigate to Campaigns tab after short delay
      setTimeout(() => {
        setActiveCampaignId(res.campaignId);
        setActiveTab('campaigns');
      }, 1500);

    } catch (err) {
      setLaunchError(err.message || 'Failed to dispatch campaign.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 h-[calc(100vh-140px)] z-10 relative">
      
      {/* Left chat panel */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card rounded-2xl p-5 flex flex-col h-full overflow-hidden"
      >
        {/* Chat Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl ai-orb-pulse flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-base flex items-center gap-2">
                AI Campaign Strategist
              </h3>
              <p className="text-xs text-slate-400">Gemini Neural Strategist 2.5 Active</p>
            </div>
          </div>
          <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-1 rounded">
            Live Database Connected
          </span>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 mb-4">
          <AnimatePresence initial={false}>
            {aiChatHistory.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`max-w-[85%] p-4 rounded-2xl text-[14px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'self-end bg-violet-600/10 border border-violet-500/20 text-slate-100 rounded-br-none'
                    : 'self-start bg-white/2 border border-white/5 text-slate-200 rounded-bl-none'
                }`}
              >
                {msg.text.split('\n\n').map((para, pIdx) => (
                  <p key={pIdx} className={pIdx < msg.text.split('\n\n').length - 1 ? 'mb-3' : ''}>
                    {para.startsWith('*Example') ? (
                      <span className="text-slate-400 italic block border-l-2 border-white/10 pl-3 py-1">{para}</span>
                    ) : para}
                  </p>
                ))}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading.ai && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="self-start bg-white/2 border border-white/5 p-4 rounded-2xl rounded-bl-none text-slate-300 flex items-center gap-3"
            >
              <div className="w-4 h-4 spinner-loader" />
              <span>Recalculating segments and drafting campaign copy...</span>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {aiChatHistory.length <= 1 && (
          <div className="mb-4">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-2 font-medium">Quick Ideas</p>
            <div className="flex flex-col gap-2">
              {SUGGESTED_PROMPTS.map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSendPrompt(prompt)}
                  className="text-left text-xs bg-white/2 hover:bg-violet-500/10 hover:border-violet-500/30 text-slate-300 hover:text-white border border-white/5 p-3 rounded-xl transition duration-200 flex justify-between items-center group"
                >
                  <span>{prompt}</span>
                  <ArrowRight size={14} className="text-slate-500 group-hover:text-violet-400 transition transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendPrompt(); }}
          className="flex items-center gap-3 bg-white/2 border border-white/5 p-2 rounded-xl focus-within:border-violet-500/40 focus-within:box-shadow-[0_0_15px_rgba(139,92,246,0.1)] transition"
        >
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-white text-sm p-3 placeholder-slate-500"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Type campaign intent (e.g. 'Target inactive shoppers on WhatsApp')..."
            disabled={loading.ai}
          />
          <button 
            type="submit" 
            className="p-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition disabled:opacity-50"
            disabled={loading.ai || !promptInput.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </motion.div>

      {/* Right Strategy Workbench Panel */}
      <AnimatePresence mode="wait">
        {!strategistProposal ? (
          <motion.div
            key="empty-strategy"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass-card rounded-2xl p-5 flex flex-col justify-center items-center text-center h-full border border-dashed border-white/5"
          >
            <HelpCircle size={40} className="text-slate-600 mb-3" />
            <h4 className="font-display font-medium text-slate-300 mb-1">Campaign Workbench</h4>
            <p className="text-xs text-slate-500 max-w-[240px]">
              Chat with the AI Strategist on the left. The formulated segment parameters and copy will pop up here.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="strategy-active"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass-card rounded-2xl p-5 flex flex-col gap-4 h-full overflow-y-auto"
          >
            <div className="border-b border-white/5 pb-3">
              <h4 className="font-display font-bold text-cyan-400 text-sm tracking-wide uppercase flex items-center gap-2">
                <Play size={14} /> Campaign Composition
              </h4>
            </div>

            {/* Campaign Name */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Campaign Name</label>
              <input
                type="text"
                className="w-full bg-black/40 border border-white/5 focus:border-violet-500/50 outline-none text-white text-xs p-2.5 rounded-lg mt-1 transition"
                value={proposalName}
                onChange={(e) => setProposalName(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Description</label>
              <input
                type="text"
                className="w-full bg-black/40 border border-white/5 focus:border-violet-500/50 outline-none text-white text-xs p-2.5 rounded-lg mt-1 transition"
                value={proposalDesc}
                onChange={(e) => setProposalDesc(e.target.value)}
              />
            </div>

            {/* Grid for Channel & Audience */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Channel</label>
                <select
                  className="w-full bg-black/40 border border-white/5 focus:border-violet-500/50 outline-none text-white text-xs p-2.5 rounded-lg mt-1 transition"
                  value={proposalChannel}
                  onChange={(e) => setProposalChannel(e.target.value)}
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="SMS">SMS</option>
                  <option value="Email">Email</option>
                  <option value="RCS">RCS</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Audience Size</label>
                <div className="w-full bg-black/40 border border-white/5 h-[38px] px-2.5 rounded-lg mt-1 flex items-center gap-2 text-xs">
                  <Users size={12} className="text-cyan-400" />
                  {audienceLoading ? (
                    <div className="w-3.5 h-3.5 spinner-loader" />
                  ) : (
                    <span className="font-semibold text-slate-200">
                      {audienceCount !== null ? `${audienceCount} Shoppers` : 'Calculated 0'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AI segment rules chip preview */}
            <div className="bg-white/2 border border-white/5 p-3 rounded-xl">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-2">Segment Logic</span>
              <div className="flex flex-wrap gap-1.5">
                {strategistProposal.segment.rules.map((rule, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-md"
                  >
                    {rule.field} {rule.operator === 'gt' ? '>' : rule.operator === 'lt' ? '<' : rule.operator === 'contains' ? 'contains' : '='} {rule.value}
                  </span>
                ))}
              </div>
            </div>

            {/* Template editing panel */}
            <div className="flex-1 flex flex-col min-h-[140px]">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Copywriting Template</label>
                <span className="text-[9px] text-slate-500">Allows mustache variables</span>
              </div>
              <textarea
                className="w-full flex-1 bg-black/40 border border-white/5 focus:border-violet-500/50 outline-none text-white text-xs p-3 rounded-lg font-mono resize-none transition leading-normal"
                value={proposalTemplate}
                onChange={(e) => setProposalTemplate(e.target.value)}
              />
            </div>

            {/* Error notifications */}
            {launchError && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg flex items-center gap-2 text-rose-400 text-xs">
                <AlertCircle size={14} />
                <span>{launchError}</span>
              </div>
            )}

            {/* Success transitions */}
            {launchSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg flex items-center gap-2 text-emerald-400 text-xs">
                <AlertCircle size={14} />
                <span>Campaign Dispatched! Opening tracker...</span>
              </div>
            )}

            {/* Launch button */}
            <button
              onClick={handleLaunch}
              className="w-full py-3 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-display flex justify-center items-center gap-2 transition duration-200 cursor-pointer disabled:opacity-50"
              disabled={loading.campaign || audienceCount === 0 || audienceCount === null || launchSuccess}
            >
              {loading.campaign ? (
                <>
                  <div className="w-3.5 h-3.5 spinner-loader border-top-color-black" />
                  <span>Activating Webhooks...</span>
                </>
              ) : (
                <>
                  <Play size={14} fill="black" />
                  <span>Approve & Dispatch Campaign</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

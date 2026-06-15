import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Play, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { getAIStrategy, runSegmentDryRun, createCampaign } from '../api';

export default function AIStrategist({ onCampaignLaunched, setActiveTab }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Hello! I am your AI Campaign Strategist. Describe your marketing goal in plain English, and I'll generate a target segment, choose the best messaging channel, draft a personalized message template, and calculate your target audience size.\n\n*Example prompt: 'Find fashion shoppers who spent over $100 and haven't purchased in a month, and draft a high-converting WhatsApp message.'*"
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [dryRunLoading, setDryRunLoading] = useState(false);

  // Strategy state
  const [strategy, setStrategy] = useState(null);
  const [campaignName, setCampaignName] = useState('');
  const [campaignDesc, setCampaignDesc] = useState('');
  const [customTemplate, setCustomTemplate] = useState('');
  const [customChannel, setCustomChannel] = useState('');
  const [dryRunCount, setDryRunCount] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle submitting chat prompt
  const handleSendPrompt = async (e) => {
    e.preventDefault();
    if (!inputPrompt.trim() || loading) return;

    const userText = inputPrompt;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputPrompt('');
    setLoading(true);
    setErrorMsg('');
    setStrategy(null);
    setDryRunCount(null);

    try {
      const response = await getAIStrategy(userText);
      setStrategy(response);
      
      // Seed editable preview state
      setCampaignName(`AI Campaign: ${response.channel} Re-engagement`);
      setCampaignDesc(`Strategized via AI: "${userText.substring(0, 50)}..."`);
      setCustomTemplate(response.messageTemplate);
      setCustomChannel(response.channel);

      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: response.explanation
        }
      ]);
      
      // Auto run dry run
      fetchDryRun(response.segment);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: "I encountered an error analyzing your request. Please ensure the CRM backend is running and try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDryRun = async (segment) => {
    setDryRunLoading(true);
    try {
      const res = await runSegmentDryRun(segment);
      setDryRunCount(res.count);
    } catch (err) {
      console.error("Dry run failed:", err);
    } finally {
      setDryRunLoading(false);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!strategy || launching) return;
    setLaunching(true);
    setErrorMsg('');

    try {
      await createCampaign({
        name: campaignName,
        description: campaignDesc,
        channel: customChannel,
        segment: strategy.segment,
        messageTemplate: customTemplate
      });

      // Show success in chat
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          text: `🎉 **Campaign "${campaignName}" launched successfully!** I have queued deliveries for ${dryRunCount} shoppers. You can view the live progress of callbacks in the **Campaign Control Tower**.`
        }
      ]);
      
      if (onCampaignLaunched) onCampaignLaunched();
      
      // Reset strategist panel
      setStrategy(null);
      setDryRunCount(null);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to launch campaign');
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="ai-workspace">
      {/* Left Chat Window */}
      <div className="glass-panel chat-panel glow-card">
        <div className="card-header flex-between">
          <h3 className="title-header flex-align-center" style={{ margin: 0 }}>
            <Sparkles size={20} style={{ color: 'var(--primary)' }} />
            AI Strategist Chat
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
            Powered by Gemini
          </span>
        </div>

        <div className="chat-history">
          {messages.map((m, idx) => (
            <div key={idx} className={`chat-bubble ${m.role}`}>
              {m.text.split('\n\n').map((para, pIdx) => (
                <p key={pIdx} style={{ marginBottom: pIdx < m.text.split('\n\n').length - 1 ? '0.75rem' : 0 }}>
                  {para}
                </p>
              ))}
            </div>
          ))}
          {loading && (
            <div className="chat-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="spinner" />
              <span>Analyzing shopper base and drafting campaign strategy...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSendPrompt} className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Type your marketing goal (e.g. 'Target high spenders on WhatsApp')..."
            disabled={loading}
          />
          <button type="submit" className="btn" style={{ padding: '0.5rem' }} disabled={loading || !inputPrompt.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Right Strategy Preview Panel */}
      <div className="glass-panel strategy-preview-panel">
        <h3 className="preview-header">
          <Sparkles size={18} />
          Campaign Workbench
        </h3>

        {!strategy ? (
          <div className="empty-state" style={{ height: '100%' }}>
            <MessageSquare size={40} className="empty-state-icon" />
            <p>Awaiting campaign strategy proposal...</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', maxWidth: '250px' }}>
              Use the chat to describe who you want to target and what you want to say.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            {/* Input Details */}
            <div>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Campaign Name</label>
              <input
                type="text"
                className="rule-input"
                style={{ width: '100%', marginTop: '0.25rem' }}
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Description</label>
              <input
                type="text"
                className="rule-input"
                style={{ width: '100%', marginTop: '0.25rem' }}
                value={campaignDesc}
                onChange={(e) => setCampaignDesc(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Channel</label>
                <select
                  className="rule-select"
                  style={{ width: '100%', marginTop: '0.25rem' }}
                  value={customChannel}
                  onChange={(e) => setCustomChannel(e.target.value)}
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="SMS">SMS</option>
                  <option value="Email">Email</option>
                  <option value="RCS">RCS</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Audience Count</label>
                <div 
                  className="flex-align-center" 
                  style={{ 
                    marginTop: '0.25rem', 
                    padding: '0.5rem', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    height: '38px',
                    fontSize: '0.875rem'
                  }}
                >
                  <Users size={14} className="text-secondary" />
                  {dryRunLoading ? (
                    <div className="spinner" style={{ width: '0.875rem', height: '0.875rem' }} />
                  ) : (
                    <span>{dryRunCount !== null ? `${dryRunCount} shoppers` : 'Calculating...'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Rules Preview */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '0.5rem' }}>Targeting Criteria</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {strategy.segment.rules.map((rule, index) => (
                  <span 
                    key={index}
                    style={{ 
                      fontSize: '0.75rem', 
                      background: 'rgba(6, 182, 212, 0.1)', 
                      color: 'var(--secondary)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      border: '1px solid rgba(6, 182, 212, 0.2)'
                    }}
                  >
                    {rule.field} {rule.operator === 'gt' ? '>' : rule.operator === 'lt' ? '<' : rule.operator === 'eq' ? '=' : rule.operator} "{rule.value}"
                  </span>
                ))}
              </div>
            </div>

            {/* Template Editor */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Message Body</label>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Variables allowed: {"{{first_name}}"}, {"{{coupon}}"}</span>
              </div>
              <textarea
                className="rule-input"
                style={{ width: '100%', flex: 1, minHeight: '120px', resize: 'none', fontSize: '0.875rem', fontFamily: 'monospace' }}
                value={customTemplate}
                onChange={(e) => setCustomTemplate(e.target.value)}
              />
            </div>

            {errorMsg && (
              <div className="flex-align-center" style={{ color: 'var(--error)', fontSize: '0.8125rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '6px' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button 
              className="btn success" 
              style={{ width: '100%', justifyContent: 'center', height: '42px' }}
              onClick={handleLaunchCampaign}
              disabled={launching || dryRunCount === 0 || dryRunCount === null}
            >
              {launching ? (
                <>
                  <div className="spinner" />
                  <span>Launching campaign...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Approve & Dispatch Campaign</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

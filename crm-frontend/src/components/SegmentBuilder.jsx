import React, { useState, useEffect } from 'react';
import { useCRMStore } from '../store/crmStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Play, Users, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';

const FIELD_OPTIONS = [
  { value: 'totalSpend', label: 'Total Spend ($)' },
  { value: 'orderCount', label: 'Order Count' },
  { value: 'lastOrderDays', label: 'Days Since Last Order' },
  { value: 'purchasedCategories', label: 'Purchased Category' },
  { value: 'gender', label: 'Gender' },
  { value: 'city', label: 'City' }
];

const OPERATOR_OPTIONS = {
  totalSpend: [
    { value: 'gt', label: 'Greater than (>)' },
    { value: 'lt', label: 'Less than (<)' },
    { value: 'eq', label: 'Equals (=)' }
  ],
  orderCount: [
    { value: 'gt', label: 'Greater than (>)' },
    { value: 'lt', label: 'Less than (<)' },
    { value: 'eq', label: 'Equals (=)' }
  ],
  lastOrderDays: [
    { value: 'gt', label: 'Greater than (>)' },
    { value: 'lt', label: 'Less than (<)' }
  ],
  purchasedCategories: [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' }
  ],
  gender: [
    { value: 'eq', label: 'Equals' }
  ],
  city: [
    { value: 'eq', label: 'Equals' },
    { value: 'contains', label: 'Contains' }
  ]
};

const DEFAULT_OPERATORS = [
  { value: 'eq', label: 'Equals (=)' },
  { value: 'gt', label: 'Greater than (>)' },
  { value: 'lt', label: 'Less than (<)' }
];

const PRESET_SEGMENTS = [
  {
    name: "VIP High-Spenders",
    desc: "Spend > $120",
    condition: "AND",
    rules: [{ field: "totalSpend", operator: "gt", value: "120" }]
  },
  {
    name: "Sleeping Shoppers",
    desc: "No order in 40+ days",
    condition: "AND",
    rules: [{ field: "lastOrderDays", operator: "gt", value: "40" }]
  },
  {
    name: "Beauty Enthusiasts",
    desc: "Bought beauty items",
    condition: "AND",
    rules: [{ field: "purchasedCategories", operator: "contains", value: "beauty" }]
  }
];

export default function SegmentBuilder() {
  const { launchCampaign, loadData, setActiveTab, setActiveCampaignId } = useCRMStore();

  const [rules, setRules] = useState([
    { field: 'totalSpend', operator: 'gt', value: '100' }
  ]);
  const [condition, setCondition] = useState('AND');
  const [dryRunCount, setDryRunCount] = useState(null);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  
  // Campaign launch details
  const [campName, setCampName] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campChannel, setCampChannel] = useState('Email');
  const [campTemplate, setCampTemplate] = useState("Hi {{first_name}}! We appreciate you being a customer. Use code THANKYOU for 10% off your next purchase!");
  
  const [launching, setLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Run dry run count on rules or junction updates
  useEffect(() => {
    handleDryRun();
  }, [rules, condition]);

  const handleFieldChange = (index, value) => {
    const updated = [...rules];
    updated[index].field = value;
    
    const ops = OPERATOR_OPTIONS[value] || DEFAULT_OPERATORS;
    updated[index].operator = ops[0].value;
    updated[index].value = '';
    setRules(updated);
  };

  const handleRuleChange = (index, key, value) => {
    const updated = [...rules];
    updated[index][key] = value;
    setRules(updated);
  };

  const addRule = () => {
    setRules([...rules, { field: 'totalSpend', operator: 'gt', value: '' }]);
  };

  const removeRule = (index) => {
    if (rules.length === 1) return;
    setRules(rules.filter((_, i) => i !== index));
  };

  const applyPreset = (preset) => {
    setCondition(preset.condition);
    setRules(preset.rules);
  };

  const handleDryRun = async () => {
    if (rules.some(r => r.value === '')) {
      setDryRunCount(null);
      return;
    }

    setDryRunLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/campaigns/dry-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segment: { condition, rules } })
      });
      if (res.ok) {
        const data = await res.json();
        setDryRunCount(data.count);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDryRunLoading(false);
    }
  };

  const handleLaunch = async (e) => {
    e.preventDefault();
    if (!campName || launching) return;
    setLaunching(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await launchCampaign({
        name: campName,
        description: campDesc,
        channel: campChannel,
        segment: { condition, rules },
        messageTemplate: campTemplate
      });

      setSuccessMsg(`Campaign successfully launched to ${res.audienceSize} shoppers!`);
      setCampName('');
      setCampDesc('');
      
      // Auto-navigate
      setTimeout(() => {
        setActiveCampaignId(res.campaignId);
        setActiveTab('campaigns');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to launch campaign.');
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 z-10 relative">
      
      {/* Visual rule composer */}
      <div className="space-y-6">
        
        {/* Presets Row */}
        <div className="glass-card rounded-2xl p-5">
          <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-violet-400" /> AI-Suggested Segments
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESET_SEGMENTS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => applyPreset(preset)}
                className="text-left bg-white/2 hover:bg-violet-500/10 border border-white/5 hover:border-violet-500/30 p-3 rounded-xl transition duration-200 cursor-pointer"
              >
                <div className="font-semibold text-slate-200 text-xs">{preset.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{preset.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Rule Builder Panel */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
            <h3 className="font-display font-semibold text-white text-base">
              Segment Composition
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Match where</span>
              <select 
                className="bg-black/40 border border-white/5 text-white text-xs p-1.5 rounded outline-none"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="AND">ALL (AND)</option>
                <option value="OR">ANY (OR)</option>
              </select>
              <span className="text-slate-400">rules match</span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <AnimatePresence initial={false}>
              {rules.map((rule, idx) => {
                const operators = OPERATOR_OPTIONS[rule.field] || DEFAULT_OPERATORS;
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col md:flex-row gap-2 bg-white/2 border border-white/5 p-3 rounded-xl items-center"
                  >
                    {/* Field Dropdown */}
                    <select
                      className="w-full md:w-[180px] bg-black/40 border border-white/5 text-white text-xs p-2.5 rounded-lg outline-none"
                      value={rule.field}
                      onChange={(e) => handleFieldChange(idx, e.target.value)}
                    >
                      {FIELD_OPTIONS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>

                    {/* Operator Dropdown */}
                    <select
                      className="w-full md:w-[150px] bg-black/40 border border-white/5 text-white text-xs p-2.5 rounded-lg outline-none"
                      value={rule.operator}
                      onChange={(e) => handleRuleChange(idx, 'operator', e.target.value)}
                    >
                      {operators.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>

                    {/* Value Input */}
                    <input
                      type="text"
                      className="flex-1 w-full bg-black/40 border border-white/5 text-white text-xs p-2.5 rounded-lg outline-none placeholder-slate-600"
                      placeholder="Enter value..."
                      value={rule.value}
                      onChange={(e) => handleRuleChange(idx, 'value', e.target.value)}
                    />

                    {/* Remove button */}
                    <button 
                      className="p-2.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition disabled:opacity-50" 
                      onClick={() => removeRule(idx)}
                      disabled={rules.length === 1}
                    >
                      <Trash2 size={15} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-center border-t border-white/5 pt-4">
            <button className="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/5 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer" onClick={addRule}>
              <Plus size={14} />
              Add Segment Condition
            </button>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-cyan-500/5 text-cyan-400 border border-cyan-500/20 rounded-lg text-xs font-medium">
              <Users size={14} />
              <span>
                Audience Count: {dryRunLoading ? '...' : dryRunCount !== null ? `${dryRunCount} shoppers` : '0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Assembly side panel */}
      <div className="glass-card rounded-2xl p-5 flex flex-col h-full gap-4">
        <div className="border-b border-white/5 pb-3">
          <h3 className="font-display font-semibold text-white text-base">
            Campaign Setup
          </h3>
        </div>

        <form onSubmit={handleLaunch} className="flex flex-col gap-4 flex-1">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Campaign Name *</label>
            <input
              type="text"
              className="w-full bg-black/40 border border-white/5 focus:border-violet-500/50 outline-none text-white text-xs p-2.5 rounded-lg mt-1 transition"
              value={campName}
              onChange={(e) => setCampName(e.target.value)}
              placeholder="e.g., Weekend Apparel Launch"
              required
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Description</label>
            <input
              type="text"
              className="w-full bg-black/40 border border-white/5 focus:border-violet-500/50 outline-none text-white text-xs p-2.5 rounded-lg mt-1 transition"
              value={campDesc}
              onChange={(e) => setCampDesc(e.target.value)}
              placeholder="e.g., Target segment with high fashion spend"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Channel *</label>
            <select
              className="w-full bg-black/40 border border-white/5 focus:border-violet-500/50 outline-none text-white text-xs p-2.5 rounded-lg mt-1 transition"
              value={campChannel}
              onChange={(e) => setCampChannel(e.target.value)}
            >
              <option value="Email">Email</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="SMS">SMS</option>
              <option value="RCS">RCS</option>
            </select>
          </div>

          <div className="flex flex-col flex-1 min-h-[140px]">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Message Copy Template *</label>
              <span className="text-[9px] text-slate-500">Variables allowed</span>
            </div>
            <textarea
              className="w-full flex-1 bg-black/40 border border-white/5 focus:border-violet-500/50 outline-none text-white text-xs p-3 rounded-lg font-mono resize-none transition leading-normal"
              value={campTemplate}
              onChange={(e) => setCampTemplate(e.target.value)}
              required
            />
          </div>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg flex items-center gap-2 text-rose-400 text-xs">
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg flex items-center gap-2 text-emerald-400 text-xs">
              <AlertCircle size={14} />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold bg-violet-600 hover:bg-violet-500 text-white text-xs font-display flex justify-center items-center gap-2 transition duration-200 cursor-pointer disabled:opacity-50"
            disabled={launching || dryRunCount === 0 || dryRunCount === null || successMsg}
          >
            {launching ? (
              <>
                <div className="w-3.5 h-3.5 spinner-loader" />
                <span>Launching...</span>
              </>
            ) : (
              <span>Launch Campaign Now</span>
            )}
          </button>
        </form>
      </div>

    </div>
  );
}

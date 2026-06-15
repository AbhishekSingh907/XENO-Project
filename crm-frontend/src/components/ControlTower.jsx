import React, { useState, useEffect } from 'react';
import { useCRMStore } from '../store/crmStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MessageSquare, Layers, Eye, Users, RefreshCw, Smartphone, Send, Calendar } from 'lucide-react';

export default function ControlTower() {
  const { 
    campaigns, 
    activeCampaignId, 
    setActiveCampaignId, 
    loadData 
  } = useCRMStore();

  const [campaignDetails, setCampaignDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (activeCampaignId) {
      fetchDetails(activeCampaignId);
    } else {
      setCampaignDetails(null);
    }
  }, [activeCampaignId]);

  // Polling loop for selected active campaigns
  useEffect(() => {
    let interval;
    if (activeCampaignId && isPolling) {
      interval = setInterval(() => {
        fetchDetails(activeCampaignId, true); // silent load
        loadData(true); // silent list refresh
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [activeCampaignId, isPolling]);

  // Decides whether to continue polling based on campaign log states
  useEffect(() => {
    if (campaignDetails) {
      const activeLogsCount = campaignDetails.logs.filter(
        l => !['CONVERTED', 'FAILED'].includes(l.status)
      ).length;
      
      const campaignIsActive = campaignDetails.campaign.status === 'SENDING' || activeLogsCount > 0;
      setIsPolling(campaignIsActive);
    } else {
      setIsPolling(false);
    }
  }, [campaignDetails]);

  const fetchDetails = async (id, silent = false) => {
    if (!silent) setLoadingDetails(true);
    try {
      const res = await fetch(`http://localhost:5000/api/campaigns/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaignDetails(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoadingDetails(false);
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'WhatsApp': return <MessageSquare size={14} className="text-emerald-400" />;
      case 'SMS': return <Phone size={14} className="text-cyan-400" />;
      case 'RCS': return <MessageSquare size={14} className="text-violet-400" />;
      default: return <Mail size={14} className="text-rose-400" />;
    }
  };

  const getStatusBadge = (status) => {
    let colorCls = '';
    if (status === 'SENT') colorCls = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    else if (status === 'DELIVERED') colorCls = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    else if (status === 'OPENED') colorCls = 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
    else if (status === 'READ') colorCls = 'bg-violet-500/20 text-purple-300 border border-violet-500/30';
    else if (status === 'CLICKED') colorCls = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
    else if (status === 'CONVERTED') colorCls = 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-[0_0_8px_rgba(16,185,129,0.3)]';
    else if (status === 'FAILED') colorCls = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    else colorCls = 'bg-slate-500/10 text-slate-400 border border-slate-500/20';

    return (
      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ${colorCls}`}>
        {status}
      </span>
    );
  };

  // Render mock preview mockups (WhatsApp/SMS bubble, RCS media card, Email client)
  const renderMessageMockup = (channel, template) => {
    const previewText = template.replace(/\{\{\w+\}\}/g, (match) => {
      if (match === '{{first_name}}') return 'Arjun';
      if (match === '{{totalSpend}}') return '125.00';
      if (match === '{{lastOrderDays}}') return '12';
      if (match === '{{coupon}}') return 'ARJUN643';
      return match;
    });

    if (channel === 'WhatsApp') {
      return (
        <div className="bg-[#0b141a] border border-[#202c33] rounded-xl p-4 flex flex-col font-sans max-w-[320px] mx-auto shadow-xl">
          <div className="flex items-center gap-2 bg-[#202c33] -mx-4 -mt-4 px-3 py-2 rounded-t-xl border-b border-[#202c33]">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-xs text-black">X</div>
            <div className="text-[11px] font-semibold text-white">Xeno D2C Outlet</div>
          </div>
          <div className="bg-[#056162] text-slate-100 text-xs p-3 rounded-lg rounded-tl-none mt-3 self-start max-w-[90%] shadow relative">
            <p className="whitespace-pre-wrap">{previewText}</p>
            <span className="text-[9px] text-[#8696a0] block text-right mt-1.5">12:30 PM</span>
          </div>
        </div>
      );
    }

    if (channel === 'SMS' || channel === 'RCS') {
      return (
        <div className="bg-[#15161e] border border-white/5 rounded-xl p-4 flex flex-col font-sans max-w-[320px] mx-auto shadow-xl">
          <div className="flex justify-center border-b border-white/5 pb-2 mb-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">{channel} Preview</span>
          </div>
          {channel === 'RCS' && (
            <div className="bg-white/2 border border-white/5 rounded-t-lg overflow-hidden mb-1 flex items-center justify-center py-4 bg-gradient-to-r from-violet-600/10 to-cyan-500/10">
              <Smartphone size={24} className="text-violet-400" />
            </div>
          )}
          <div className="bg-white/5 border border-white/5 text-slate-100 text-xs p-3 rounded-2xl rounded-tl-none self-start max-w-[90%] shadow">
            <p className="whitespace-pre-wrap">{previewText}</p>
          </div>
          {channel === 'RCS' && (
            <div className="mt-2 flex gap-1 justify-start">
              <button className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1.5 rounded-full cursor-not-allowed">Shop Now 🛍️</button>
              <button className="text-[9px] bg-white/5 text-slate-300 border border-white/5 px-3 py-1.5 rounded-full cursor-not-allowed">Claim Code</button>
            </div>
          )}
        </div>
      );
    }

    // Default Email preview
    return (
      <div className="bg-[#0f111a] border border-white/5 rounded-xl p-4 flex flex-col font-sans shadow-xl text-xs">
        <div className="border-b border-white/5 pb-2 mb-2 text-slate-400 space-y-1">
          <div><span className="text-slate-500">From:</span> marketing@xeno-brand.com</div>
          <div><span className="text-slate-500">To:</span> arjun@gmail.com</div>
        </div>
        <div className="text-slate-200 bg-white/2 p-3 rounded-lg whitespace-pre-wrap min-h-[120px] leading-relaxed">
          {previewText}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[0.80fr_1.20fr] gap-6 z-10 relative h-[calc(100vh-140px)]">
      
      {/* Campaign List side panel */}
      <motion.div 
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card rounded-2xl p-5 flex flex-col h-full overflow-hidden"
      >
        <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
          <h3 className="font-display font-semibold text-white text-base flex items-center gap-2">
            <Layers size={18} className="text-violet-400" /> Campaign Logs
          </h3>
          <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded transition cursor-pointer" onClick={() => loadData(true)}>
            <RefreshCw size={12} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {campaigns.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-slate-500 text-xs">
              <Users className="w-8 h-8 mb-2 text-slate-600" />
              <span>No campaigns recorded yet.</span>
            </div>
          ) : (
            campaigns.map(camp => {
              const active = activeCampaignId === camp._id;
              const openRate = camp.stats.sent > 0 ? Math.round((camp.stats.opened / camp.stats.sent) * 100) : 0;
              const clickRate = camp.stats.sent > 0 ? Math.round((camp.stats.clicked / camp.stats.sent) * 100) : 0;

              return (
                <div
                  key={camp._id}
                  onClick={() => setActiveCampaignId(camp._id)}
                  className={`border p-3.5 rounded-xl cursor-pointer transition flex flex-col gap-1.5 ${
                    active 
                      ? 'bg-violet-600/10 border-violet-500/50 box-shadow-[0_0_15px_rgba(139,92,246,0.05)]' 
                      : 'bg-white/2 border-white/5 hover:bg-white/4'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200 text-xs truncate max-w-[150px]">{camp.name}</span>
                    <div className="flex items-center gap-1.5">
                      {getChannelIcon(camp.channel)}
                      <span className="text-[10px] text-slate-400">{camp.channel}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 text-[10px] text-slate-500">
                    <span>Audience: <strong className="text-slate-300">{camp.audienceSize}</strong></span>
                    <span>Open Rate: <strong className="text-slate-300">{openRate}%</strong></span>
                    <span>Click Rate: <strong className="text-slate-300">{clickRate}%</strong></span>
                  </div>

                  {camp.status === 'SENDING' && (
                    <div className="flex items-center gap-1.5 text-[9px] text-amber-400 mt-1">
                      <div className="w-3 h-3 spinner-loader" />
                      <span>Simulating sends...</span>
                    </div>
                  )}

                  {camp.stats.revenue > 0 && (
                    <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                      Sales ROI: ${camp.stats.revenue.toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Selected Campaign detailed viewer */}
      <AnimatePresence mode="wait">
        {!activeCampaignId ? (
          <motion.div
            key="empty-details"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            className="glass-card rounded-2xl p-5 flex flex-col justify-center items-center text-center h-full border border-dashed border-white/5"
          >
            <Eye size={40} className="text-slate-600 mb-3" />
            <h4 className="font-display font-medium text-slate-300 mb-1">Campaign Detail Control</h4>
            <p className="text-xs text-slate-500 max-w-[240px]">
              Select a campaign from the left log panel to view active webhooks and delivery simulators.
            </p>
          </motion.div>
        ) : loadingDetails ? (
          <motion.div
            key="loading-details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-2xl p-5 flex flex-col justify-center items-center h-full"
          >
            <div className="w-8 h-8 spinner-loader" />
            <p className="text-xs text-slate-500 mt-3">Fetching logs from database...</p>
          </motion.div>
        ) : !campaignDetails ? (
          <p className="text-center text-rose-400 text-xs">Failed to load details.</p>
        ) : (
          <motion.div
            key="details-loaded"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            className="glass-card rounded-2xl p-5 flex flex-col gap-4 h-full overflow-hidden"
          >
            {/* Header info */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <h3 className="font-display font-bold text-white text-base">{campaignDetails.campaign.name}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{campaignDetails.campaign.description || 'Campaign Dispatch Active'}</p>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded border ${
                  campaignDetails.campaign.status === 'COMPLETED' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {campaignDetails.campaign.status}
                </span>
              </div>
            </div>

            {/* Simulated Live Funnel metrics ribbon */}
            <div className="grid grid-cols-5 gap-2.5 bg-white/1 border border-white/5 p-3.5 rounded-xl">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Sent</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">{campaignDetails.campaign.stats.sent}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Delivered</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">{campaignDetails.campaign.stats.delivered}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Opened</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">{campaignDetails.campaign.stats.opened}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Clicked</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">{campaignDetails.campaign.stats.clicked}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider text-emerald-400">ROI</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">${campaignDetails.campaign.stats.revenue.toLocaleString()}</div>
              </div>
            </div>

            {/* Grid for Mockup and Shopper logs */}
            <div className="grid grid-cols-1 md:grid-cols-[0.45fr_0.55fr] gap-4 flex-1 overflow-hidden">
              
              {/* Left-hand device preview mockup */}
              <div className="flex flex-col justify-center bg-black/40 border border-white/5 p-3 rounded-xl overflow-y-auto">
                <div className="flex items-center gap-1.5 mb-2.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                  <Smartphone size={12} /> Device Render
                </div>
                {renderMessageMockup(campaignDetails.campaign.channel, campaignDetails.campaign.messageTemplate)}
              </div>

              {/* Right-hand recipient history logs table */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Simulated Webhook Callbacks</span>
                  {isPolling && (
                    <span className="flex items-center gap-1 text-[9px] text-violet-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow" />
                      listening callbacks...
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto border border-white/5 rounded-lg">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-white/2 text-slate-400 border-b border-white/5">
                        <th className="p-2.5 font-semibold">Shopper</th>
                        <th className="p-2.5 font-semibold">Status</th>
                        <th className="p-2.5 font-semibold text-right">Sale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignDetails.logs.map(log => (
                        <tr key={log._id} className="border-b border-white/5 hover:bg-white/1">
                          <td className="p-2.5 font-semibold text-slate-200">
                            <div>{log.customerName}</div>
                            <div className="text-[9px] text-slate-500 font-normal">{log.customerEmail}</div>
                          </td>
                          <td className="p-2.5">{getStatusBadge(log.status)}</td>
                          <td className="p-2.5 text-right font-bold text-slate-200">
                            {log.status === 'CONVERTED' ? `$${log.conversionValue}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

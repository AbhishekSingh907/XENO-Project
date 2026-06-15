import React, { useEffect, useState } from 'react';
import { useCRMStore } from '../store/crmStore';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend 
} from 'recharts';
import { TrendingUp, Users, Send, Percent, Sparkles, Layers, Activity } from 'lucide-react';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']; // WhatsApp, SMS, Email, RCS colors

export default function AnalyticsDashboard() {
  const { campaigns, customers, orders, loadInsights, insights, loading } = useCRMStore();

  // Load insights on mount
  useEffect(() => {
    loadInsights();
  }, []);

  // Compute Aggregate Stats
  const totalCustomers = customers.length;
  const totalCampaigns = campaigns.length;

  const aggregateStats = campaigns.reduce((acc, camp) => {
    acc.sent += camp.stats.sent;
    acc.delivered += camp.stats.delivered;
    acc.opened += camp.stats.opened;
    acc.read += camp.stats.read;
    acc.clicked += camp.stats.clicked;
    acc.converted += camp.stats.converted;
    acc.revenue += camp.stats.revenue;
    return acc;
  }, { sent: 0, delivered: 0, opened: 0, read: 0, clicked: 0, converted: 0, revenue: 0 });

  const ctr = aggregateStats.sent > 0 ? Math.round((aggregateStats.clicked / aggregateStats.sent) * 100) : 0;
  const deliveryRate = aggregateStats.sent > 0 ? Math.round((aggregateStats.delivered / aggregateStats.sent) * 100) : 0;

  // Funnel Data
  const funnelData = [
    { name: 'Sent', count: aggregateStats.sent, fill: 'var(--primary)' },
    { name: 'Delivered', count: aggregateStats.delivered, fill: 'var(--secondary)' },
    { name: 'Opened', count: aggregateStats.opened, fill: '#a78bfa' },
    { name: 'Read', count: aggregateStats.read, fill: '#c084fc' },
    { name: 'Clicked', count: aggregateStats.clicked, fill: '#34d399' },
    { name: 'Converted', count: aggregateStats.converted, fill: 'var(--success)' }
  ];

  // Channel Mix Data
  const channelDataMap = campaigns.reduce((acc, camp) => {
    acc[camp.channel] = (acc[camp.channel] || 0) + (camp.stats.revenue || 0);
    return acc;
  }, { WhatsApp: 0, SMS: 0, Email: 0, RCS: 0 });

  const channelData = Object.keys(channelDataMap).map(key => ({
    name: key,
    value: channelDataMap[key] || 10 // small mock default to show pie on empty state
  }));

  // Attributed Revenue Time series data
  // Group orders that have attributedCampaignId by date
  const revenueTimeSeries = orders
    .filter(o => o.attributedCampaignId)
    .reduce((acc, o) => {
      const dateStr = new Date(o.orderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const existing = acc.find(item => item.date === dateStr);
      if (existing) {
        existing.revenue += o.totalAmount;
      } else {
        acc.push({ date: dateStr, revenue: o.totalAmount });
      }
      return acc;
    }, []);

  // Sort time series chronologically
  const sortedTimeSeries = [...revenueTimeSeries].sort((a,b) => new Date(a.date) - new Date(b.date));
  
  // Provide realistic seed timeline if empty
  const revenueData = sortedTimeSeries.length > 0 ? sortedTimeSeries : [
    { date: 'Jun 10', revenue: 120 },
    { date: 'Jun 11', revenue: 250 },
    { date: 'Jun 12', revenue: 180 },
    { date: 'Jun 13', revenue: 420 },
    { date: 'Jun 14', revenue: 380 },
    { date: 'Jun 15', revenue: aggregateStats.revenue > 0 ? aggregateStats.revenue : 500 }
  ];

  return (
    <div className="space-y-6 z-10 relative">
      {/* 4 Hero Stats Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Attributed Revenue */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 glow-border"
        >
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Attributed Revenue</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white text-glow-cyan">
            ${aggregateStats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-[10px] text-slate-500 mt-1">LTV influenced via active marketing campaigns</p>
        </motion.div>

        {/* Shoppers base */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Shoppers</span>
            <Users size={16} className="text-violet-400" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white">
            {totalCustomers}
          </h2>
          <p className="text-[10px] text-slate-500 mt-1">D2C shopper profiles currently indexed</p>
        </motion.div>

        {/* Campaign Sent */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Campaigns Sent</span>
            <Send size={16} className="text-amber-400" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white">
            {totalCampaigns}
          </h2>
          <p className="text-[10px] text-slate-500 mt-1">Multichannel campaigns triggered</p>
        </motion.div>

        {/* Average CTR */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-5 animate-pulse-glow"
        >
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Average CTR</span>
            <Percent size={16} className="text-cyan-400" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white text-glow-purple">
            {ctr}%
          </h2>
          <p className="text-[10px] text-slate-500 mt-1">Avg click-through rate across channels</p>
        </motion.div>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6">
        
        {/* Revenue Area Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-5 flex flex-col h-[320px]"
        >
          <h3 className="font-display font-bold text-white text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400" /> Campaign Attributed Revenue Growth
          </h3>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#475569" strokeWidth={0.5} />
                <YAxis stroke="#475569" strokeWidth={0.5} />
                <Tooltip 
                  contentStyle={{ background: '#0a0b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: 'white' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--secondary)" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Channel Mix Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-5 flex flex-col h-[320px]"
        >
          <h3 className="font-display font-bold text-white text-sm mb-2 uppercase tracking-wider flex items-center gap-2">
            <Layers size={16} className="text-violet-400" /> Attributed Revenue Mix
          </h3>
          <div className="flex-1 w-full text-xs flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#0a0b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend iconSize={8} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Funnel chart and AI Suggestions Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        
        {/* Delivery Funnel bar chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-5 flex flex-col h-[340px]"
        >
          <h3 className="font-display font-bold text-white text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
            <Activity size={16} className="text-cyan-400" /> Interactive Delivery Funnel
          </h3>
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#475569" strokeWidth={0.5} />
                <YAxis stroke="#475569" strokeWidth={0.5} />
                <Tooltip 
                  contentStyle={{ background: '#0a0b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                  itemStyle={{ color: 'white' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Recommendations panel */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-5 flex flex-col h-[340px] overflow-hidden"
        >
          <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3">
            <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-violet-400" /> AI Insights Engine
            </h3>
            {loading.insights && <div className="w-4 h-4 spinner-loader" />}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {!insights ? (
              <div className="h-full flex flex-col justify-center items-center text-slate-500 text-xs">
                <Sparkles className="w-8 h-8 mb-2 animate-pulse" />
                <span>Aggregating shopper patterns for recommendations...</span>
              </div>
            ) : (
              insights.recommendations.map((rec, rIdx) => (
                <div 
                  key={rIdx}
                  className="bg-white/2 border border-white/5 hover:border-violet-500/30 p-3 rounded-xl transition duration-200"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-200 text-xs">{rec.title}</span>
                    <span 
                      className={`text-[9px] px-2 py-0.5 rounded font-semibold border ${
                        rec.urgency === 'HIGH' 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {rec.urgency}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{rec.body}</p>
                  <div className="mt-2 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Predicted ROI:</span>
                    <span className="font-semibold text-emerald-400">{rec.predictedROI}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

    </div>
  );
}

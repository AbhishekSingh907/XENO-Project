import React, { useState, useEffect } from 'react';
import { useCRMStore } from '../store/crmStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ShoppingBag, Calendar, Mail, MapPin, Award, Search, X, Sparkles, AlertTriangle } from 'lucide-react';

export default function ShopperDatabase() {
  const { customers, orders, activeCustomerId, setActiveCustomerId } = useCRMStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [campaignMap, setCampaignMap] = useState({});

  useEffect(() => {
    // Fetch campaign list to map campaign ID -> Name for orders
    fetch('http://localhost:5000/api/campaigns')
      .then(res => res.json())
      .then(camps => {
        const mapping = {};
        camps.forEach(c => {
          mapping[c._id] = c.name;
        });
        setCampaignMap(mapping);
      })
      .catch(err => console.error(err));
  }, [orders]);

  const selectedCustomer = customers.find(c => c._id === activeCustomerId || c.id === activeCustomerId);
  
  const customerOrders = selectedCustomer
    ? orders.filter(o => o.customerId === selectedCustomer._id || o.customerId === selectedCustomer.id)
            .sort((a,b) => new Date(b.orderDate) - new Date(a.orderDate))
    : [];

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEngagementBadge = (score) => {
    let color = '';
    if (score >= 80) color = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    else if (score >= 50) color = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
    else color = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';

    return (
      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${color}`}>
        {score} / 100
      </span>
    );
  };

  // Generate dynamic, realistic AI insights based on customer profile
  const generateShopperAIInsights = (customer) => {
    const categories = customer.purchasedCategories.join(', ');
    const isChurn = customer.riskScore > 50;

    let text = `${customer.name.split(' ')[0]} is a ${customer.engagementScore >= 80 ? 'highly engaged VIP' : 'moderately active'} customer. `;
    
    if (customer.purchasedCategories.length > 0) {
      text += `They demonstrate a strong affinity for the **${categories}** product categories. `;
    } else {
      text += `They have not placed any category purchases yet. `;
    }

    text += `Their preferred delivery channel is **${customer.preferredChannel || 'Email'}**. `;

    if (isChurn) {
      text += `🚨 **High Churn Risk**: With a risk score of ${customer.riskScore}%, they have been inactive for ${customer.lastOrderDays} days. We recommend a high-incentive 20% discount offer dispatched on their preferred channel.`;
    } else {
      text += `Their retention risk is low (${customer.riskScore}%). Schedule a replenishment reminder or new arrivals teaser to optimize average order value ($${customer.avgOrderValue.toFixed(2)}).`;
    }

    return text;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-6 z-10 relative h-[calc(100vh-140px)]">
      
      {/* Customer profile list grid */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl p-5 flex flex-col h-full overflow-hidden"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/5 pb-4 mb-4">
          <h3 className="font-display font-semibold text-white text-base">
            Shopper Index
          </h3>
          <div className="flex items-center gap-2 bg-white/2 border border-white/5 px-3 py-1.5 rounded-lg w-full md:w-[240px]">
            <Search size={14} className="text-slate-500" />
            <input
              type="text"
              className="bg-transparent border-none outline-none text-white text-xs w-full placeholder-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shoppers by name, email, city..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border border-white/5 rounded-lg">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-white/2 text-slate-400 border-b border-white/5">
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">City</th>
                <th className="p-3 font-semibold text-right">Orders</th>
                <th className="p-3 font-semibold text-right">LTV</th>
                <th className="p-3 font-semibold">Inactivity</th>
                <th className="p-3 font-semibold">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(cust => (
                <tr 
                  key={cust._id} 
                  onClick={() => setActiveCustomerId(cust._id)}
                  className={`border-b border-white/5 hover:bg-white/1 cursor-pointer transition ${
                    activeCustomerId === cust._id ? 'bg-cyan-500/5' : ''
                  }`}
                >
                  <td className="p-3 font-semibold text-slate-200">
                    <div>{cust.name}</div>
                    <div className="text-[9px] text-slate-500 font-normal">{cust.email}</div>
                  </td>
                  <td className="p-3 text-slate-300">{cust.city}</td>
                  <td className="p-3 text-right text-slate-300">{cust.orderCount}</td>
                  <td className="p-3 text-right font-bold text-cyan-400">${cust.totalSpend.toFixed(2)}</td>
                  <td className="p-3 text-slate-400">
                    {cust.lastOrderDays === 9999 ? 'Never' : `${cust.lastOrderDays} days ago`}
                  </td>
                  <td className="p-3">{getEngagementBadge(cust.engagementScore)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Profile detail sidebar modal */}
      <AnimatePresence mode="wait">
        {!activeCustomerId ? (
          <motion.div
            key="empty-profile"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            className="glass-card rounded-2xl p-5 flex flex-col justify-center items-center text-center h-full border border-dashed border-white/5"
          >
            <Users size={40} className="text-slate-600 mb-3" />
            <h4 className="font-display font-medium text-slate-300 mb-1">Shopper Timeline</h4>
            <p className="text-xs text-slate-500 max-w-[240px]">
              Select a customer profile from the table to load lifetime values, timeline activity, and AI suggestions.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="profile-loaded"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            className="glass-card rounded-2xl p-5 flex flex-col gap-4 h-full overflow-y-auto"
          >
            {/* Header profile profile details */}
            <div className="flex justify-between items-start border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 flex items-center justify-center font-display font-extrabold text-sm text-white shadow-lg">
                  {selectedCustomer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base leading-none">{selectedCustomer.name}</h3>
                  <span className="text-[9px] bg-violet-500/15 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded uppercase font-semibold mt-1 inline-block">
                    {selectedCustomer.gender}
                  </span>
                </div>
              </div>
              
              <button className="text-slate-500 hover:text-white transition p-1 bg-white/2 hover:bg-white/5 rounded" onClick={() => setActiveCustomerId(null)}>
                <X size={14} />
              </button>
            </div>

            {/* Grid metrics details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/1 border border-white/5 p-3 rounded-xl">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">Lifetime Value</div>
                <div className="text-base font-bold text-cyan-400 mt-1">${selectedCustomer.totalSpend.toFixed(2)}</div>
              </div>

              <div className="bg-white/1 border border-white/5 p-3 rounded-xl">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">Avg Order Value</div>
                <div className="text-base font-bold text-slate-200 mt-1">${selectedCustomer.avgOrderValue.toFixed(2)}</div>
              </div>
            </div>

            {/* Demographics details listing */}
            <div className="space-y-2 text-xs text-slate-400 bg-white/2 border border-white/5 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <Mail size={12} className="text-slate-500" />
                <span>{selectedCustomer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-slate-500" />
                <span>{selectedCustomer.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingBag size={12} className="text-slate-500" />
                <span>{selectedCustomer.orderCount} total purchases</span>
              </div>
            </div>

            {/* Engagement Score rings SVG progress */}
            <div className="grid grid-cols-2 gap-3 bg-white/1 border border-white/5 p-3.5 rounded-xl items-center">
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">Engagement</span>
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.03)" strokeWidth="4" fill="transparent" />
                    <circle cx="32" cy="32" r="26" stroke="var(--primary)" strokeWidth="4" fill="transparent" 
                      strokeDasharray="163.3"
                      strokeDashoffset={163.3 - (163.3 * selectedCustomer.engagementScore) / 100}
                    />
                  </svg>
                  <span className="absolute text-[11px] font-bold text-slate-200">{selectedCustomer.engagementScore}%</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">Churn Risk</span>
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.03)" strokeWidth="4" fill="transparent" />
                    <circle cx="32" cy="32" r="26" stroke={selectedCustomer.riskScore > 50 ? 'var(--error)' : 'var(--success)'} strokeWidth="4" fill="transparent" 
                      strokeDasharray="163.3"
                      strokeDashoffset={163.3 - (163.3 * selectedCustomer.riskScore) / 100}
                    />
                  </svg>
                  <span className="absolute text-[11px] font-bold text-slate-200">{selectedCustomer.riskScore}%</span>
                </div>
              </div>
            </div>

            {/* AI insights block */}
            <div className="bg-violet-600/5 border border-violet-500/15 p-3 rounded-xl">
              <span className="text-[9px] text-violet-400 uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1.5">
                <Sparkles size={11} /> AI Shopper Insight
              </span>
              <p className="text-[11.5px] text-slate-300 leading-normal" dangerouslySetInnerHTML={{ __html: generateShopperAIInsights(selectedCustomer) }} />
            </div>

            {/* Customer order timeline */}
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-2">Purchase History</span>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {customerOrders.length === 0 ? (
                  <p className="text-slate-500 text-[10px] italic">No transaction records found.</p>
                ) : (
                  customerOrders.map(order => (
                    <div 
                      key={order._id}
                      className="bg-white/2 border border-white/5 p-2.5 rounded-lg text-xs"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-slate-200">Order #{order._id.substring(18).toUpperCase()}</span>
                        <span className="font-bold text-cyan-400">${order.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                        <span className="truncate max-w-[150px]">
                          {order.items.map(i => `${i.productName} (${i.category})`).join(', ')}
                        </span>
                      </div>

                      {order.attributedCampaignId && (
                        <div className="flex items-center gap-1 bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded text-[9px] mt-1.5 w-max">
                          <Award size={10} />
                          <span>Attributed: {campaignMap[order.attributedCampaignId] || 'Promo'}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

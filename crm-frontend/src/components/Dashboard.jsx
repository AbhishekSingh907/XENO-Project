import React from 'react';
import { Send, TrendingUp, BarChart3, Users, Mail, Phone, MessageSquare, Layers } from 'lucide-react';

export default function Dashboard({ campaigns, customers }) {
  // Aggregate stats
  const totalCampaigns = campaigns.length;
  const totalCustomers = customers.length;
  
  const totalStats = campaigns.reduce((acc, camp) => {
    acc.sent += camp.stats.sent;
    acc.delivered += camp.stats.delivered;
    acc.opened += camp.stats.opened;
    acc.read += camp.stats.read;
    acc.clicked += camp.stats.clicked;
    acc.converted += camp.stats.converted;
    acc.revenue += camp.stats.revenue;
    return acc;
  }, { sent: 0, delivered: 0, opened: 0, read: 0, clicked: 0, converted: 0, revenue: 0 });

  // Calculate channel mix
  const channelCounts = campaigns.reduce((acc, camp) => {
    acc[camp.channel] = (acc[camp.channel] || 0) + 1;
    return acc;
  }, { WhatsApp: 0, SMS: 0, Email: 0, RCS: 0 });

  // Funnel percentages based on Sent
  const getPercentage = (value, base) => {
    if (!base) return 0;
    return Math.round((value / base) * 100);
  };

  const funnelStages = [
    { label: 'Sent', value: totalStats.sent, color: 'var(--primary)' },
    { label: 'Delivered', value: totalStats.delivered, color: 'var(--secondary)' },
    { label: 'Opened', value: totalStats.opened, color: '#a78bfa' }, // Light violet
    { label: 'Read', value: totalStats.read, color: '#c084fc' }, // Medium purple
    { label: 'Clicked', value: totalStats.clicked, color: '#34d399' }, // Emerald
    { label: 'Purchased', value: totalStats.converted, color: 'var(--success)' }
  ];

  return (
    <div>
      <div className="metrics-grid">
        <div className="glass-panel metric-card">
          <div className="metric-header">
            <span>Total Shoppers</span>
            <Users size={18} className="text-secondary" />
          </div>
          <div className="metric-value">{totalCustomers}</div>
          <div className="metric-subtext">Active profiles in database</div>
        </div>

        <div className="glass-panel metric-card secondary">
          <div className="metric-header">
            <span>Campaigns Sent</span>
            <Send size={18} style={{ color: 'var(--secondary)' }} />
          </div>
          <div className="metric-value">{totalCampaigns}</div>
          <div className="metric-subtext">Across 4 channels</div>
        </div>

        <div className="glass-panel metric-card success">
          <div className="metric-header">
            <span>Attributed Sales</span>
            <TrendingUp size={18} style={{ color: 'var(--success)' }} />
          </div>
          <div className="metric-value">${totalStats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="metric-subtext">Sales tracked via link conversion</div>
        </div>

        <div className="glass-panel metric-card warning">
          <div className="metric-header">
            <span>Overall Conversion Rate</span>
            <BarChart3 size={18} style={{ color: 'var(--warning)' }} />
          </div>
          <div className="metric-value">{getPercentage(totalStats.converted, totalStats.sent)}%</div>
          <div className="metric-subtext">Sent-to-purchase conversion</div>
        </div>
      </div>

      <div className="logs-grid">
        {/* Conversion Funnel */}
        <div className="glass-panel glow-card">
          <div className="card-header">
            <h3 className="title-header flex-align-center">
              <Layers size={18} className="text-primary" />
              Interactive Engagement Funnel
            </h3>
          </div>
          
          {totalStats.sent === 0 ? (
            <div className="empty-state">
              <BarChart3 size={40} className="empty-state-icon" />
              <p>No campaign performance data available yet.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Send a campaign to see the real-time funnel update.</p>
            </div>
          ) : (
            <div className="funnel-container">
              {funnelStages.map((stage, i) => {
                const percentage = getPercentage(stage.value, totalStats.sent);
                return (
                  <div key={stage.label} className="funnel-bar-wrapper">
                    <div className="funnel-label">{stage.label}</div>
                    <div className="funnel-track">
                      <div 
                        className="funnel-bar" 
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: stage.color,
                          backgroundImage: 'none' // Override index.css gradient for custom stage coloring
                        }}
                      />
                    </div>
                    <div className="funnel-value">
                      {stage.value} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Channel Mix & Recommendations */}
        <div className="glass-panel">
          <div className="card-header">
            <h3 className="title-header flex-align-center">
              <Send size={18} className="text-secondary" />
              Channel Performance Analysis
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>WhatsApp Mix</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={16} style={{ color: '#25D366' }} />
                  <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>{channelCounts.WhatsApp} campaigns</span>
                </div>
              </div>
              
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Email Mix</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={16} style={{ color: '#ea4335' }} />
                  <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>{channelCounts.Email} campaigns</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>SMS Mix</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={16} style={{ color: '#3b82f6' }} />
                  <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>{channelCounts.SMS} campaigns</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>RCS Mix</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={16} style={{ color: '#a855f7' }} />
                  <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>{channelCounts.RCS} campaigns</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(6, 182, 212, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.15)', fontSize: '0.875rem' }}>
              <div style={{ fontWeight: '600', color: 'var(--secondary)', marginBottom: '0.25rem' }}>💡 Campaign Optimization Tip</div>
              {totalStats.sent > 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>
                  WhatsApp currently boasts the highest simulated response rate. Target high-value VIP segments on WhatsApp, and leverage Email for inactive shopper campaigns to minimize simulated cost overhead.
                </p>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>
                  Start by clicking the <strong>AI Command Center</strong> tab to brainstorm a custom segment, or create a campaign in <strong>Campaign Control Tower</strong> to generate delivery metrics.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

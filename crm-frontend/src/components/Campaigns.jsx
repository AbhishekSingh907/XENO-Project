import React, { useState, useEffect } from 'react';
import { Mail, Phone, MessageSquare, Layers, Eye, Users, RefreshCw } from 'lucide-react';
import { fetchCampaigns, fetchCampaignDetails } from '../api';

export default function Campaigns({ campaigns, refreshCampaigns }) {
  const [selectedCampId, setSelectedCampId] = useState(null);
  const [campaignDetails, setCampaignDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [autoPoll, setAutoPoll] = useState(false);

  useEffect(() => {
    if (selectedCampId) {
      loadDetails(selectedCampId);
    } else {
      setCampaignDetails(null);
    }
  }, [selectedCampId]);

  // Polling loop for active campaigns to show real-time callback progression
  useEffect(() => {
    let interval;
    if (selectedCampId && autoPoll) {
      interval = setInterval(() => {
        loadDetails(selectedCampId, true); // Silent load (no loading spinner)
        refreshCampaigns(); // Update campaign list list too
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [selectedCampId, autoPoll]);

  // Enable/disable polling based on campaign state
  useEffect(() => {
    if (campaignDetails && campaignDetails.campaign.status === 'COMPLETED') {
      const activeLogsCount = campaignDetails.logs.filter(
        l => !['CONVERTED', 'FAILED'].includes(l.status)
      ).length;
      
      // If there are still active communications that haven't hit terminal states, poll
      setAutoPoll(activeLogsCount > 0);
    } else if (campaignDetails && campaignDetails.campaign.status === 'SENDING') {
      setAutoPoll(true);
    } else {
      setAutoPoll(false);
    }
  }, [campaignDetails]);

  const loadDetails = async (id, silent = false) => {
    if (!silent) setLoadingDetails(true);
    try {
      const res = await fetchCampaignDetails(id);
      setCampaignDetails(res);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoadingDetails(false);
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'WhatsApp': return <MessageSquare size={16} style={{ color: '#25D366' }} />;
      case 'SMS': return <Phone size={16} style={{ color: '#3b82f6' }} />;
      case 'RCS': return <MessageSquare size={16} style={{ color: '#a855f7' }} />;
      default: return <Mail size={16} style={{ color: '#ea4335' }} />;
    }
  };

  const getStatusBadge = (status) => {
    const cls = `status-badge ${status.toLowerCase()}`;
    return <span className={cls}>{status}</span>;
  };

  return (
    <div className="logs-grid" style={{ gridTemplateColumns: '0.8fr 1.2fr' }}>
      {/* Campaign List */}
      <div className="glass-panel">
        <div className="card-header flex-between">
          <h3 className="title-header flex-align-center" style={{ margin: 0 }}>
            <Layers size={18} className="text-primary" />
            Campaign List
          </h3>
          <button className="btn secondary" style={{ padding: '0.25rem' }} onClick={refreshCampaigns}>
            <RefreshCw size={14} />
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="empty-state">
            <Users size={32} className="empty-state-icon" />
            <p>No campaigns found.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Create a campaign manually or using the AI Strategist to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {campaigns.map(camp => {
              const active = selectedCampId === camp.id;
              const openRate = camp.stats.sent > 0 ? Math.round((camp.stats.opened / camp.stats.sent) * 100) : 0;
              const clickRate = camp.stats.sent > 0 ? Math.round((camp.stats.clicked / camp.stats.sent) * 100) : 0;

              return (
                <div
                  key={camp.id}
                  onClick={() => setSelectedCampId(camp.id)}
                  style={{
                    background: active ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    padding: '1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9375rem' }}>{camp.name}</span>
                    <div className="flex-align-center">
                      {getChannelIcon(camp.channel)}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{camp.channel}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>Audience: <strong>{camp.audienceSize}</strong></span>
                    <span>Opens: <strong>{openRate}%</strong></span>
                    <span>Clicks: <strong>{clickRate}%</strong></span>
                    {camp.stats.revenue > 0 && (
                      <span className="text-success" style={{ color: 'var(--success)' }}>
                        ROI: <strong>${camp.stats.revenue}</strong>
                      </span>
                    )}
                  </div>
                  
                  {camp.status === 'SENDING' && (
                    <div className="flex-align-center" style={{ fontSize: '0.6875rem', color: 'var(--warning)', marginTop: '0.5rem' }}>
                      <div className="spinner" style={{ width: '0.6875rem', height: '0.6875rem' }} />
                      <span>Sending messages...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Campaign Details */}
      <div className="glass-panel">
        {!selectedCampId ? (
          <div className="empty-state" style={{ height: '100%' }}>
            <Eye size={40} className="empty-state-icon" />
            <p>Select a campaign to view delivery details</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Choose from the left-hand panel to open real-time delivery logs.</p>
          </div>
        ) : loadingDetails ? (
          <div className="empty-state">
            <div className="spinner" style={{ width: '2.5rem', height: '2.5rem' }} />
            <p style={{ marginTop: '1rem' }}>Loading delivery log logs...</p>
          </div>
        ) : !campaignDetails ? (
          <p>Failed to load details.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            {/* Header info */}
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div>
                <h3 className="title-header" style={{ margin: 0 }}>{campaignDetails.campaign.name}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {campaignDetails.campaign.description || 'No description provided.'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Status</div>
                <span 
                  style={{ 
                    fontSize: '0.75rem', 
                    background: campaignDetails.campaign.status === 'COMPLETED' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: campaignDetails.campaign.status === 'COMPLETED' ? 'var(--success)' : 'var(--warning)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: '600'
                  }}
                >
                  {campaignDetails.campaign.status}
                </span>
              </div>
            </div>

            {/* Campaign Stats Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Delivered</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '700' }}>
                  {campaignDetails.campaign.stats.delivered}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/{campaignDetails.campaign.stats.total}</span>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Opened</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '700' }}>{campaignDetails.campaign.stats.opened}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Clicked</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '700' }}>{campaignDetails.campaign.stats.clicked}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Purchased</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--success)' }}>{campaignDetails.campaign.stats.converted}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Revenue</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--success)' }}>${campaignDetails.campaign.stats.revenue}</div>
              </div>
            </div>

            {/* Template Card */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '0.25rem' }}>Message Template:</div>
              <pre style={{ fontSize: '0.8125rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{campaignDetails.campaign.messageTemplate}</pre>
            </div>

            {/* Recipient Logs */}
            <div className="flex-between">
              <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Shopper Delivery History</span>
              {autoPoll && (
                <span className="flex-align-center" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                  <div className="spinner" style={{ width: '0.75rem', height: '0.75rem' }} />
                  Listening for channel callbacks...
                </span>
              )}
            </div>

            <div className="table-container" style={{ flex: 1, maxHeight: '250px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Shopper</th>
                    <th>Email</th>
                    <th>Personalized Message</th>
                    <th>Status</th>
                    <th>Attr. Sale</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignDetails.logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: '600' }}>{log.customerName}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{log.customerEmail}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-muted)' }} title={log.message}>
                        {log.message}
                      </td>
                      <td>{getStatusBadge(log.status)}</td>
                      <td style={{ color: log.status === 'CONVERTED' ? 'var(--success)' : 'var(--text-muted)' }}>
                        {log.status === 'CONVERTED' ? `$${log.conversionValue}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Users, ShoppingBag, Calendar, Mail, MapPin, Award, Layers } from 'lucide-react';
import { fetchCampaigns } from '../api';

export default function DatabaseExplorer({ customers, orders }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [campaignMap, setCampaignMap] = useState({});

  useEffect(() => {
    // Load campaigns to map ID -> Name for attribution tracking
    fetchCampaigns()
      .then(camps => {
        const mapping = {};
        camps.forEach(c => {
          mapping[c.id] = c.name;
        });
        setCampaignMap(mapping);
      })
      .catch(err => console.error("Error loading campaigns mapping:", err));
  }, [orders]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  
  // Find orders for selected customer
  const customerOrders = selectedCustomerId
    ? orders.filter(o => o.customerId === selectedCustomerId).sort((a,b) => new Date(b.orderDate) - new Date(a.orderDate))
    : [];

  return (
    <div className="logs-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
      {/* Customer profiles list */}
      <div className="glass-panel">
        <div className="card-header">
          <h3 className="title-header flex-align-center">
            <Users size={18} className="text-primary" />
            Shopper Database
          </h3>
        </div>

        <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>City</th>
                <th>Orders</th>
                <th>Total Spend</th>
                <th>Last Order</th>
                <th>Categories</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(cust => (
                <tr 
                  key={cust.id} 
                  onClick={() => setSelectedCustomerId(cust.id)}
                  style={{ 
                    cursor: 'pointer',
                    background: selectedCustomerId === cust.id ? 'rgba(6, 182, 212, 0.05)' : 'transparent',
                    borderLeft: selectedCustomerId === cust.id ? '3px solid var(--secondary)' : 'none'
                  }}
                >
                  <td style={{ fontWeight: '600' }}>
                    <div>{cust.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{cust.email}</div>
                  </td>
                  <td>{cust.city}</td>
                  <td>{cust.orderCount}</td>
                  <td style={{ fontWeight: '600', color: 'var(--secondary)' }}>${cust.totalSpend.toFixed(2)}</td>
                  <td>{cust.lastOrderDays === 9999 ? 'Never' : `${cust.lastOrderDays}d ago`}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {cust.purchasedCategories.map(cat => (
                        <span 
                          key={cat} 
                          style={{ 
                            fontSize: '0.6875rem', 
                            background: 'rgba(255,255,255,0.05)', 
                            color: 'var(--text-secondary)', 
                            padding: '0.125rem 0.35rem', 
                            borderRadius: '4px',
                            border: '1px solid var(--border)'
                          }}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer profile detail pane */}
      <div className="glass-panel">
        {!selectedCustomerId ? (
          <div className="empty-state" style={{ height: '100%' }}>
            <Users size={40} className="empty-state-icon" />
            <p>Select a shopper to view profile timeline</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Click a row in the shopper database to inspect customer lifetime value and orders.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card-header flex-between" style={{ paddingBottom: '1rem', marginBottom: 0 }}>
              <div>
                <h3 className="title-header" style={{ margin: 0 }}>{selectedCustomer.name}</h3>
                <span style={{ fontSize: '0.75rem', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--primary)', padding: '0.15rem 0.4rem', borderRadius: '4px', textTransform: 'capitalize' }}>
                  {selectedCustomer.gender}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lifetime Value</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--secondary)' }}>
                  ${selectedCustomer.totalSpend.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Shopper Details Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div className="flex-align-center" style={{ color: 'var(--text-secondary)' }}>
                <Mail size={14} />
                <span>{selectedCustomer.email}</span>
              </div>
              <div className="flex-align-center" style={{ color: 'var(--text-secondary)' }}>
                <MapPin size={14} />
                <span>{selectedCustomer.city}</span>
              </div>
              <div className="flex-align-center" style={{ color: 'var(--text-secondary)' }}>
                <ShoppingBag size={14} />
                <span>{selectedCustomer.orderCount} total orders placed</span>
              </div>
            </div>

            {/* Shopper Order Timeline */}
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.875rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={14} className="text-secondary" />
                Purchase Timeline
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxH: '250px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {customerOrders.length === 0 ? (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No orders placed yet.</p>
                ) : (
                  customerOrders.map(order => (
                    <div 
                      key={order.id}
                      style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid var(--border)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8125rem'
                      }}
                    >
                      <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: '600' }}>Order #{order.id.split('_')[1] || order.id}</span>
                        <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>${Number(order.totalAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex-between" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                        <span>
                          {order.items.map(i => `${i.productName} (${i.category})`).join(', ')}
                        </span>
                      </div>

                      {/* Campaign Attribution Indicator */}
                      {order.attributedCampaignId && (
                        <div 
                          className="flex-align-center" 
                          style={{ 
                            marginTop: '0.5rem', 
                            padding: '0.25rem 0.5rem', 
                            background: 'rgba(16, 185, 129, 0.08)',
                            borderRadius: '4px',
                            border: '1px solid rgba(16, 185, 129, 0.15)',
                            fontSize: '0.75rem',
                            color: 'var(--success)'
                          }}
                        >
                          <Award size={12} />
                          <span>Attributed to: <strong>{campaignMap[order.attributedCampaignId] || 'Campaign'}</strong></span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

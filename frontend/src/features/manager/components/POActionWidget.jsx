import React, { useState, useEffect } from 'react';
import api from '../../../core/api/axios';

export const POActionWidget = () => {
  const [draftPOs, setDraftPOs] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchDraftPOs = async () => {
      try {
        const res = await api.get('/purchase-orders/');
        const drafts = res.data.filter(po => po.status === 'Draft');
        setDraftPOs(drafts);
      } catch (err) {
        console.error('Failed to fetch POs for widget:', err);
      }
    };
    fetchDraftPOs();
  }, []);

  if (draftPOs.length === 0) return null;

  return (
    <div style={{ marginBottom: 'var(--spacing-4)' }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-warning)',
          borderLeft: '4px solid var(--color-warning)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        color: 'var(--color-text-primary)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Action Required</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {draftPOs.length} Draft Purchase Order{draftPOs.length > 1 ? 's' : ''} await approval.
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--color-text-secondary)' }}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderTop: 'none',
          borderBottomLeftRadius: 'var(--radius-md)',
          borderBottomRightRadius: 'var(--radius-md)',
          padding: '1rem',
          boxShadow: 'var(--shadow-sm)',
          marginTop: '-4px'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Draft Purchase Orders</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {draftPOs.map((po, index) => (
              <div key={po.id || index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.75rem',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)'
              }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>PO #{po.id || 'N/A'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    Supplier: {po.supplier?.name || po.supplier || 'Unknown'}
                  </div>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  ${po.total_amount ? parseFloat(po.total_amount).toFixed(2) : '0.00'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

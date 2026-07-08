import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../core/api/axios';

export const POActionWidget = () => {
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    const fetchDraftPOs = async () => {
      try {
        const res = await api.get('/purchase-orders/');
        const drafts = res.data.filter(po => po.status === 'Draft');
        setDraftCount(drafts.length);
      } catch (err) {
        console.error('Failed to fetch POs for widget:', err);
      }
    };
    fetchDraftPOs();
  }, []);

  if (draftCount === 0) return null;

  return (
    <Link to="/suppliers?tab=purchase-orders" style={{ textDecoration: 'none' }}>
      <div style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-warning)',
        borderLeft: '4px solid var(--color-warning)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        marginBottom: 'var(--spacing-4)',
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
            {draftCount} Draft Purchase Order{draftCount > 1 ? 's' : ''} await approval.
          </div>
        </div>
      </div>
    </Link>
  );
};

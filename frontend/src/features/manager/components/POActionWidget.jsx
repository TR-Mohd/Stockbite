import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../core/api/axios';
import { formatCurrency, formatDateStandard } from '../../../utils/formatters';

const MAX_VISIBLE = 3;

export const POActionWidget = () => {
  const [draftPOs, setDraftPOs] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

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

  const visiblePOs = draftPOs.slice(0, MAX_VISIBLE);
  const hiddenCount = draftPOs.length - MAX_VISIBLE;

  const totalDraftCost = draftPOs.reduce((sum, po) => {
    const cost = (po.suggested_quantity != null && po.unit_cost != null) ? po.suggested_quantity * po.unit_cost : 0;
    return sum + cost;
  }, 0);

  const isStale = (dateStr) => {
    if (!dateStr) return false;
    const msIn48Hours = 48 * 60 * 60 * 1000;
    return (new Date() - new Date(dateStr)) > msIn48Hours;
  };

  return (
    <div style={{ marginBottom: 'var(--spacing-4)' }}>
      {/* Banner header — collapses/expands the list */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-warning)',
          borderLeft: '4px solid var(--color-warning)',
          borderRadius: isExpanded ? 'var(--radius-md) var(--radius-md) 0 0' : 'var(--radius-md)',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--color-text-primary)',
          boxShadow: 'var(--shadow-sm)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Action Required</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            {draftPOs.length} Draft Purchase Order{draftPOs.length > 1 ? 's' : ''} awaiting approval
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--color-text-secondary)' }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {/* Expanded PO list */}
      {isExpanded && (
        <div style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderTop: 'none',
          borderBottomLeftRadius: 'var(--radius-md)',
          borderBottomRightRadius: 'var(--radius-md)',
          padding: '0.75rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          {/* Header with Total Cost */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', padding: '0 0.25rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Draft Purchase Orders</h4>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Total Est: <span style={{ color: 'var(--color-warning)' }}>~{formatCurrency(totalDraftCost)}</span>
            </div>
          </div>
          {visiblePOs.map((po, index) => {
            const estimatedTotal = (po.suggested_quantity != null && po.unit_cost != null)
              ? po.suggested_quantity * po.unit_cost
              : null;

            return (
              <div
                key={po.id || index}
                onClick={() => navigate('/manager/suppliers?tab=orders')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.65rem 0.75rem',
                  backgroundColor: 'var(--color-bg-base)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  borderLeft: '3px solid var(--color-warning)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-base)'}
              >
                {/* Left: ingredient + supplier */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {po.ingredient_name || 'Unknown Ingredient'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: isStale(po.date) ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
                    {po.supplier_name || '—'} · {formatDateStandard(po.date)} {isStale(po.date) && '⚠️'}
                  </div>
                </div>

                {/* Right: qty + estimated cost */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0, marginLeft: '1rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                    {po.suggested_quantity} {po.unit}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    {estimatedTotal != null
                      ? <span>~{formatCurrency(estimatedTotal)} <span style={{ opacity: 0.7 }}>(est.)</span></span>
                      : <span style={{ opacity: 0.5 }}>cost unavailable</span>
                    }
                  </div>
                </div>
              </div>
            );
          })}

          {/* "View all" footer when more than MAX_VISIBLE POs exist */}
          {hiddenCount > 0 && (
            <div
              onClick={() => navigate('/manager/suppliers?tab=orders')}
              style={{
                textAlign: 'center',
                fontSize: '0.82rem',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: 'var(--radius-sm)',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-base)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              + {hiddenCount} more · View all →
            </div>
          )}

          {/* Always-visible "Go to PO History" shortcut */}
          {hiddenCount <= 0 && (
            <div
              onClick={() => navigate('/manager/suppliers?tab=orders')}
              style={{
                textAlign: 'right',
                fontSize: '0.82rem',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                padding: '0.25rem 0.25rem 0 0',
              }}
            >
              View in PO History →
            </div>
          )}
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatQuantity, formatCurrency, formatDateStandard } from '../../utils/formatters';
import { NumberInput } from '../../components/ui/NumberInput';
import styles from './suppliers.module.css';

export const ReceivePOModal = ({ isOpen, onClose, order, onSubmit }) => {
  const [receivedItems, setReceivedItems] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order && order.items) {
      const init = {};
      order.items.forEach(item => {
        init[item.id] = {
          actual_quantity:
            item.suggested_quantity !== undefined && item.suggested_quantity !== null
              ? String(item.suggested_quantity)
              : '0',
          actual_unit_cost:
            item.unit_cost_at_time !== undefined && item.unit_cost_at_time !== null
              ? String(item.unit_cost_at_time)
              : '0',
        };
      });
      setReceivedItems(init);
    }
  }, [order]);

  if (!order) return null;

  const items = order.items || [];

  const handleFieldChange = (itemId, field, value) => {
    setReceivedItems(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        [field]: value,
      },
    }));
  };

  const isAllValid =
    items.length > 0 &&
    items.every(item => {
      const row = receivedItems[item.id];
      if (!row) return false;
      const qty = Number(row.actual_quantity);
      const cost = Number(row.actual_unit_cost);
      return (
        row.actual_quantity !== '' &&
        !isNaN(qty) &&
        qty >= 0 &&
        row.actual_unit_cost !== '' &&
        !isNaN(cost) &&
        cost >= 0
      );
    });

  const totalOrderedValue = items.reduce((sum, item) => {
    const qty = Number(item.suggested_quantity) || 0;
    const cost = Number(item.unit_cost_at_time) || 0;
    return sum + qty * cost;
  }, 0);

  const totalReceivedValue = items.reduce((sum, item) => {
    const row = receivedItems[item.id] || {};
    const qty = Number(row.actual_quantity) || 0;
    const cost = Number(row.actual_unit_cost) || 0;
    return sum + qty * cost;
  }, 0);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!onSubmit || !order || !isAllValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        items: items.map(item => {
          const row = receivedItems[item.id] || {};
          return {
            item_id: item.id,
            actual_quantity: Number(row.actual_quantity),
            actual_unit_cost: Number(row.actual_unit_cost),
          };
        }),
      };
      await onSubmit(order.id, payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receive Purchase Order #${order.id.slice(0, 8)}`}
      size="large"
    >
      <form onSubmit={handleSubmit}>
        <div className={styles.modalSection}>
          {/* Header info strip */}
          <div className={styles.infoGrid} style={{ marginBottom: '1.25rem' }}>
            <div className={styles.infoItem}>
              <span className={styles.infoItemLabel}>Supplier</span>
              <span className={styles.infoItemValue}>{order.supplier_name || '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoItemLabel}>Date</span>
              <span className={styles.infoItemValue}>
                {order.date ? formatDateStandard(order.date) : '—'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoItemLabel}>Line Items</span>
              <span className={styles.infoItemValue}>{items.length} item(s)</span>
            </div>
          </div>

          {/* All-items-required banner callout */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-subtle, #f8fafc)',
              borderLeft: '4px solid var(--color-primary)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm, 0.375rem)',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
            }}
          >
            <strong>All line items must be received together in a single delivery.</strong> Verify
            or update the actual quantity and invoice unit cost for every line item below.
          </div>

          {/* Multi-item table */}
          <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.875rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <th style={{ padding: '0.65rem 0.75rem' }}>Ingredient</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Ordered Qty</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Quoted Cost</th>
                  <th style={{ padding: '0.65rem 0.75rem', width: '160px' }}>Actual Qty *</th>
                  <th style={{ padding: '0.65rem 0.75rem', width: '160px' }}>Actual Unit Cost *</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Received Value</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const row = receivedItems[item.id] || {};
                  const lineValue =
                    (Number(row.actual_quantity) || 0) * (Number(row.actual_unit_cost) || 0);

                  return (
                    <tr
                      key={item.id}
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>
                        {item.ingredient_name || item.ingredient_id}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                        {formatQuantity(item.suggested_quantity, item.unit)} {item.unit || ''}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                        {formatCurrency(item.unit_cost_at_time)}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <NumberInput
                          unit={item.unit}
                          min="0"
                          required
                          value={row.actual_quantity || ''}
                          onChange={e =>
                            handleFieldChange(item.id, 'actual_quantity', e.target.value)
                          }
                          placeholder="0"
                        />
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <NumberInput
                          min="0"
                          required
                          value={row.actual_unit_cost || ''}
                          onChange={e =>
                            handleFieldChange(item.id, 'actual_unit_cost', e.target.value)
                          }
                          placeholder="0"
                        />
                      </td>
                      <td
                        style={{
                          padding: '0.65rem 0.75rem',
                          textAlign: 'right',
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(lineValue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Total Ordered vs Total Received summary */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '2rem',
              paddingTop: '0.75rem',
              borderTop: '2px solid var(--color-border)',
              fontSize: '0.95rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--color-text-secondary)', marginRight: '0.5rem' }}>
                Total Ordered Value:
              </span>
              <strong style={{ color: 'var(--color-text-secondary)' }}>
                {formatCurrency(totalOrderedValue)}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', marginRight: '0.5rem' }}>
                Total Received Value:
              </span>
              <strong style={{ color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                {formatCurrency(totalReceivedValue)}
              </strong>
            </div>
          </div>
        </div>

        <div
          className="modal-footer"
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            {!isAllValid && (
              <span className={styles.textMuted} style={{ fontSize: '0.85rem' }}>
                Please enter valid quantities and unit costs for all {items.length} item(s).
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!isAllValid || isSubmitting}>
              {isSubmitting ? 'Receiving...' : 'Confirm Receipt'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

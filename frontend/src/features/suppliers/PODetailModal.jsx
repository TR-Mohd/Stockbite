import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatDateStandard, formatCurrency, formatQuantity } from '../../utils/formatters';
import styles from './suppliers.module.css';

export const PODetailModal = ({ isOpen, onClose, order }) => {
  if (!order) return null;

  const items = order.items || [];
  const totalCost = items.reduce((sum, item) => {
    const qty =
      item.actual_received_quantity != null
        ? Number(item.actual_received_quantity)
        : Number(item.suggested_quantity) || 0;
    const cost = Number(item.unit_cost_at_time) || 0;
    return sum + qty * cost;
  }, 0);

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft': return styles.badgeDraft;
      case 'sent': return styles.badgeSent;
      case 'received': return styles.badgeReceived;
      case 'partially received': return styles.badgeWarning;
      case 'over-received': return styles.badgeWarning;
      case 'cancelled': return styles.badgeInactive;
      default: return '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Purchase Order Details #${order.id}`}
      size="large"
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <div className={styles.modalSection}>
        <div className={styles.infoGrid} style={{ marginBottom: '1.5rem' }}>
          <div className={styles.infoItem}>
            <span className={styles.infoItemLabel}>Supplier</span>
            <span className={styles.infoItemValue}>{order.supplier_name || order.supplier_id || '—'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoItemLabel}>Order Date</span>
            <span className={styles.infoItemValue}>{order.date ? formatDateStandard(order.date) : '—'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoItemLabel}>Status</span>
            <div>
              <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoItemLabel}>Total Value</span>
            <span className={styles.infoItemValue} style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
              {formatCurrency(totalCost)}
            </span>
          </div>
          {order.notes && (
            <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
              <span className={styles.infoItemLabel}>Notes</span>
              <span className={styles.infoItemValue}>{order.notes}</span>
            </div>
          )}
        </div>

        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
          Line Items ({items.length})
        </h4>

        <div style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>Ingredient</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Ordered Qty</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Quoted Unit Cost</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Received Qty</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No line items found.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const qty =
                    item.actual_received_quantity != null
                      ? Number(item.actual_received_quantity)
                      : Number(item.suggested_quantity) || 0;
                  const lineTotal = qty * (Number(item.unit_cost_at_time) || 0);
                  return (
                    <tr key={item.id || item.ingredient_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>
                        {item.ingredient_name || item.ingredient_id}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                        {formatQuantity(item.suggested_quantity, item.unit)} {item.unit || ''}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                        {item.unit_cost_at_time != null ? formatCurrency(item.unit_cost_at_time) : '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                        {item.actual_received_quantity != null 
                          ? `${formatQuantity(item.actual_received_quantity, item.unit)} ${item.unit || ''}`
                          : '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(lineTotal)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: 'var(--color-bg-base)', borderTop: '2px solid var(--color-border)', fontWeight: 700 }}>
                  <td colSpan={4} style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Total:</td>
                  <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: 'var(--color-primary)' }}>
                    {formatCurrency(totalCost)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </Modal>
  );
};

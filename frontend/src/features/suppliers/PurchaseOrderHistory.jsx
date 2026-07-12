import React, { useState, useEffect, useCallback } from 'react';
import api from '../../core/api/axios';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useAuthStore } from '../../core/store/authStore';
import { Modal } from '../../components/ui/Modal';
import { ReceivePOModal } from './ReceivePOModal';
import { formatDateStandard, formatCurrency } from '../../utils/formatters';
import styles from './suppliers.module.css';

const STATUS_FLOW = {
  Draft: 'Sent',
  Sent: 'Received',
  Received: null,
};

const STATUS_LABELS = {
  Draft: 'Mark as Sent',
  Sent: 'Mark as Received',
};

export const PurchaseOrderHistory = () => {
  const { user } = useAuthStore();
  const isManager = user?.role === 'Manager';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [receiveModalOrder, setReceiveModalOrder] = useState(null);
  const [undoConfirmOrder, setUndoConfirmOrder] = useState(null);
  const [sendConfirmOrder, setSendConfirmOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/purchase-orders/');
      setOrders(response.data);
    } catch (err) {
      console.error('Failed to fetch purchase orders:', err);
      setError('Could not load purchase orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const confirmSend = async () => {
    if (!sendConfirmOrder) return;
    setUpdatingId(sendConfirmOrder.id);
    try {
      await api.post(`/purchase-orders/${sendConfirmOrder.id}/send`);
      setOrders((prev) => prev.map((o) => (o.id === sendConfirmOrder.id ? { ...o, status: 'Sent' } : o)));
      setSendConfirmOrder(null);
    } catch (err) {
      console.error('Failed to send PO:', err);
      alert('Failed to send PO. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async (orderId) => {
    const reason = window.prompt("Reason for cancellation:");
    if (!reason) return;
    setUpdatingId(orderId);
    try {
      await api.post(`/purchase-orders/${orderId}/cancel`, { reason });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'Cancelled', cancelled_reason: reason } : o)));
    } catch (err) {
      console.error('Failed to cancel PO:', err);
      alert('Failed to cancel PO. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReceiveSubmit = async (orderId, actualQuantity) => {
    setUpdatingId(orderId);
    try {
      await api.post(`/purchase-orders/${orderId}/receive`, { actual_quantity: actualQuantity });
      await fetchOrders(); // Re-fetch to get updated status and actual_received_quantity
      setReceiveModalOrder(null);
    } catch (err) {
      if (err.response?.status === 409) {
        alert('Concurrent inventory update detected. Please retry.');
      } else {
        console.error('Failed to receive PO:', err);
        alert('Failed to receive PO. Please try again.');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmUndoReceive = async () => {
    if (!undoConfirmOrder) return;
    setUpdatingId(undoConfirmOrder.id);
    try {
      await api.post(`/purchase-orders/${undoConfirmOrder.id}/undo-receive`);
      await fetchOrders();
      setUndoConfirmOrder(null);
    } catch (err) {
      if (err.response?.status >= 400 && err.response?.data?.detail) {
        alert(err.response.data.detail);
      } else {
        console.error('Failed to undo receive:', err);
        alert('Failed to undo receipt. Please try again.');
      }
    } finally {
      setUpdatingId(null);
    }
  };

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

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        Loading purchase orders...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginTop: '2rem' }}>
        <ErrorState 
          title="Failed to Load Purchase Orders" 
          message={error} 
          onRetry={fetchOrders} 
        />
      </div>
    );
  }

  // Stat calculations
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Sent' || o.status === 'Partially Received').length;
  const draftOrders = orders.filter(o => o.status === 'Draft').length;
  const completedOrders = orders.filter(o => o.status === 'Received' || o.status === 'Over-Received').length;
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;

  return (
    <>
      <div className={styles.sectionToolbar}>
        <h2 className={styles.sectionTitle}>Purchase Order History</h2>
        <Button size="sm" variant="secondary" onClick={fetchOrders}>
          Refresh
        </Button>
      </div>

      <div className={styles.summaryStrip}>
        <div className={`${styles.statCard} ${styles.neutral}`}>
          <div className={styles.statLabel}>Total POs</div>
          <div className={styles.statValue}>
            {totalOrders}
            {cancelledOrders > 0 && (
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', fontWeight: 'normal' }}>
                ({cancelledOrders} Cancelled)
              </span>
            )}
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.warning}`}>
          <div className={styles.statLabel}>Pending Delivery</div>
          <div className={styles.statValue}>{pendingOrders}</div>
        </div>
        <div className={`${styles.statCard} ${styles.neutral}`}>
          <div className={styles.statLabel}>Drafts</div>
          <div className={styles.statValue}>{draftOrders}</div>
        </div>
        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statLabel}>Completed</div>
          <div className={styles.statValue}>{completedOrders}</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ padding: '3rem 0', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)' }}>
          <EmptyState 
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            }
            title="No purchase orders yet"
            description="Purchase orders will appear here once drafted or sent."
          />
        </div>
      ) : (
        <table className={styles.poTable}>
          <thead>
            <tr>
              <th style={{ textAlign: 'right' }}>PO ID</th>
              <th style={{ textAlign: 'left' }}>Supplier</th>
              <th style={{ textAlign: 'left' }}>Ingredient</th>
              <th style={{ textAlign: 'right' }}>Quantity</th>
              <th style={{ textAlign: 'left' }}>Date</th>
              <th style={{ textAlign: 'left' }}>Notes</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className={styles.textMuted} style={{ textAlign: 'right' }}>#{order.id}</td>
                <td style={{ fontWeight: 500, textAlign: 'left' }}>{order.supplier_name || order.supplier_id || '—'}</td>
                <td style={{ textAlign: 'left' }}>{order.ingredient_name || '—'}</td>
                <td style={{ textAlign: 'right' }}>{order.suggested_quantity} {order.unit || ''}</td>
                <td className={styles.textMuted} style={{ textAlign: 'left' }}>
                  {order.date ? formatDateStandard(order.date) : '—'}
                </td>
                <td className={styles.textMuted} style={{ textAlign: 'left' }}>{order.notes || '—'}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div className={styles.actionCell} style={{ justifyContent: 'center' }}>
                    {order.status === 'Draft' && isManager && (
                      <>
                        <Button size="sm" variant="primary" onClick={() => setSendConfirmOrder(order)} disabled={updatingId === order.id}>
                          {updatingId === order.id ? 'Saving...' : 'Mark as Sent'}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleCancel(order.id)} disabled={updatingId === order.id}>
                          Cancel
                        </Button>
                      </>
                    )}
                    {order.status === 'Draft' && !isManager && (
                      <span className={`${styles.badge} ${styles.badgeDraft}`} style={{ opacity: 0.8 }}>
                        Pending Manager
                      </span>
                    )}
                    {order.status === 'Sent' && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => setReceiveModalOrder(order)} disabled={updatingId === order.id}>
                          Mark as Received
                        </Button>
                        {isManager && (
                          <Button size="sm" variant="danger" onClick={() => handleCancel(order.id)} disabled={updatingId === order.id}>
                            Cancel
                          </Button>
                        )}
                      </>
                    )}
                    {(order.status === 'Received' || order.status === 'Partially Received' || order.status === 'Over-Received') && (
                      <>
                        <span className={styles.textMuted} style={{ fontSize: 'var(--font-size-xs)' }}>
                          ✓ Completed
                        </span>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => setUndoConfirmOrder(order)} 
                          disabled={updatingId === order.id || order.actual_received_quantity == null}
                          title={order.actual_received_quantity == null ? "Legacy PO receipt cannot be undone" : "Undo Receipt"}
                          style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem', fontSize: 'var(--font-size-xs)' }}
                        >
                          Undo Receipt
                        </Button>
                      </>
                    )}
                    {order.status === 'Cancelled' && (
                      <span className={styles.textMuted} style={{ fontSize: 'var(--font-size-xs)' }}>
                        ✗ Cancelled
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <ReceivePOModal
        isOpen={!!receiveModalOrder}
        onClose={() => setReceiveModalOrder(null)}
        order={receiveModalOrder}
        onSubmit={handleReceiveSubmit}
      />
      
      {/* Undo Confirmation Modal */}
      <Modal
        isOpen={!!undoConfirmOrder}
        onClose={() => setUndoConfirmOrder(null)}
        title="Confirm Undo Receipt"
        size="small"
      >
        {undoConfirmOrder && (
          <div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
              Undo receiving <strong>{undoConfirmOrder.actual_received_quantity || undoConfirmOrder.suggested_quantity} {undoConfirmOrder.unit || ''}</strong> of <strong>{undoConfirmOrder.ingredient_name}</strong>? 
              <br /><br />
              This will subtract the stock and revert the PO status to Sent.
            </p>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <Button variant="secondary" onClick={() => setUndoConfirmOrder(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmUndoReceive}>Yes, Undo Receipt</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Send Confirmation Modal */}
      <Modal
        isOpen={!!sendConfirmOrder}
        onClose={() => setSendConfirmOrder(null)}
        title="Confirm Send Purchase Order"
        size="medium"
      >
        {sendConfirmOrder && (
          <div>
            <div className={styles.infoGrid} style={{ marginBottom: '1.5rem', marginTop: '0.5rem' }}>
              <div className={styles.infoItem}>
                <span className={styles.infoItemLabel}>Supplier</span>
                <span className={styles.infoItemValue}>{sendConfirmOrder.supplier_name || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoItemLabel}>Ingredient</span>
                <span className={styles.infoItemValue}>{sendConfirmOrder.ingredient_name || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoItemLabel}>Quantity</span>
                <span className={styles.infoItemValue}>{sendConfirmOrder.suggested_quantity} {sendConfirmOrder.unit || ''}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoItemLabel}>Est. Cost</span>
                <span className={styles.infoItemValue}>
                  {sendConfirmOrder.unit_cost 
                    ? formatCurrency(sendConfirmOrder.suggested_quantity * sendConfirmOrder.unit_cost)
                    : '—'}
                </span>
              </div>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Send this PO to <strong>{sendConfirmOrder.supplier_name || 'the supplier'}</strong>? This cannot be undone once sent.
            </p>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setSendConfirmOrder(null)}>Cancel</Button>
              <Button variant="primary" onClick={confirmSend}>Yes, Mark as Sent</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

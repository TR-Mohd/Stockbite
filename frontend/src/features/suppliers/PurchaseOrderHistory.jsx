import React, { useState, useEffect, useCallback } from 'react';
import api from '../../core/api/axios';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../core/store/authStore';
import { ReceivePOModal } from './ReceivePOModal';
import { formatDateStandard } from '../../utils/formatters';
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

  const handleSend = async (orderId) => {
    setUpdatingId(orderId);
    try {
      await api.post(`/purchase-orders/${orderId}/send`);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'Sent' } : o)));
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
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'Received' } : o)));
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

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft': return styles.badgeDraft;
      case 'sent': return styles.badgeSent;
      case 'received': return styles.badgeReceived;
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
      <div className={styles.errorState}>
        <p>{error}</p>
        <Button size="sm" variant="secondary" onClick={fetchOrders} style={{ marginTop: '0.5rem' }}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.sectionToolbar}>
        <h2 className={styles.sectionTitle}>Purchase Order History ({orders.length})</h2>
        <Button size="sm" variant="secondary" onClick={fetchOrders}>
          Refresh
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyPlaceholder}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <h3>No purchase orders yet</h3>
          <p>Draft a new PO from the low-stock alerts to get started.</p>
        </div>
      ) : (
        <table className={styles.poTable}>
          <thead>
            <tr>
              <th>PO ID</th>
              <th>Supplier</th>
              <th>Ingredient</th>
              <th>Quantity</th>
              <th>Date</th>
              <th>Notes</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className={styles.textMuted}>#{order.id}</td>
                <td style={{ fontWeight: 500 }}>{order.supplier_name || order.supplier_id || '—'}</td>
                <td>{order.ingredient_name || '—'}</td>
                <td>{order.suggested_quantity} {order.unit || ''}</td>
                <td className={styles.textMuted}>
                  {order.date ? formatDateStandard(order.date) : '—'}
                </td>
                <td className={styles.textMuted}>{order.notes || '—'}</td>
                <td>
                  <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <div className={styles.actionCell}>
                    {order.status === 'Draft' && isManager && (
                      <>
                        <Button size="sm" variant="primary" onClick={() => handleSend(order.id)} disabled={updatingId === order.id}>
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
                    {(order.status === 'Received' || order.status === 'Cancelled') && (
                      <span className={styles.textMuted} style={{ fontSize: 'var(--font-size-xs)' }}>
                        {order.status === 'Received' ? '✓ Completed' : '✗ Cancelled'}
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
    </>
  );
};

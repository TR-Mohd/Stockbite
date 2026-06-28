import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import api from '../../core/api/axios';
import styles from './suppliers.module.css';

export const SupplierDetailModal = ({ supplier, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!supplier) return;
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const response = await api.get(`/purchase-orders/?supplier_id=${supplier.id}`);
        setOrders(response.data);
      } catch (err) {
        console.error('Failed to fetch order history:', err);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [supplier]);

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft': return styles.badgeDraft;
      case 'sent': return styles.badgeSent;
      case 'received': return styles.badgeReceived;
      default: return styles.badge;
    }
  };

  return (
    <Modal
      isOpen={!!supplier}
      onClose={onClose}
      title={supplier?.name || 'Supplier Details'}
      size="large"
      footer={
        <Button variant="secondary" onClick={onClose}>Close</Button>
      }
    >
      {supplier && (
        <>
          {/* Contact Information */}
          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Contact Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoItemLabel}>Specialization</span>
                <span className={styles.infoItemValue}>
                  {supplier.specialization || '—'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoItemLabel}>Status</span>
                <span className={`${styles.badge} ${supplier.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                  {supplier.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoItemLabel}>Phone</span>
                <span className={styles.infoItemValue}>{supplier.phone || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoItemLabel}>Email</span>
                <span className={styles.infoItemValue}>{supplier.email || '—'}</span>
              </div>
              <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                <span className={styles.infoItemLabel}>Address</span>
                <span className={styles.infoItemValue}>{supplier.address || '—'}</span>
              </div>
              {supplier.contact_person && (
                <div className={styles.infoItem}>
                  <span className={styles.infoItemLabel}>Contact Person</span>
                  <span className={styles.infoItemValue}>{supplier.contact_person}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order History */}
          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>
              Past Purchase Orders {!loadingOrders && `(${orders.length})`}
            </h3>
            {loadingOrders ? (
              <div className={styles.loadingState} style={{ padding: '1.5rem' }}>
                Loading order history...
              </div>
            ) : orders.length === 0 ? (
              <div className={styles.emptyPlaceholder} style={{ padding: '2rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p>No purchase orders with this supplier yet.</p>
              </div>
            ) : (
              <table className={styles.poTable}>
                <thead>
                  <tr>
                    <th>PO ID</th>
                    <th>Ingredient</th>
                    <th>Qty</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className={styles.textMuted}>#{order.id}</td>
                      <td>{order.ingredient_name || '—'}</td>
                      <td>{order.suggested_quantity} {order.unit || ''}</td>
                      <td className={styles.textMuted}>
                        {order.date ? new Date(order.date).toLocaleDateString('id-ID') : '—'}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </Modal>
  );
};

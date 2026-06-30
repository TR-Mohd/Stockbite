import React, { useState, useEffect } from 'react';
import api from '../../core/api/axios';
import { Button } from '../../components/ui/Button';
import styles from './suppliers.module.css';
import { SupplierDetailModal } from './SupplierDetailModal';

export const SupplierDirectory = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/suppliers/');
      setSuppliers(response.data);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
      setError('Could not load suppliers. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        Loading suppliers...
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <p>{error}</p>
        <Button size="sm" variant="secondary" onClick={fetchSuppliers} style={{ marginTop: '0.5rem' }}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.sectionToolbar}>
        <h2 className={styles.sectionTitle}>All Suppliers ({suppliers.length})</h2>
      </div>

      {suppliers.length === 0 ? (
        <div className={styles.emptyPlaceholder}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <h3>No suppliers found</h3>
          <p>Suppliers added from the backend will appear here.</p>
        </div>
      ) : (
        <div className={styles.supplierGrid}>
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className={`${styles.supplierCard} ${!supplier.is_active ? styles.inactive : ''}`}
            >
              <div className={styles.cardTop}>
                <h3 className={styles.supplierName}>{supplier.name}</h3>
                <div style={{ display: 'flex', gap: '0.375rem', flexDirection: 'column', alignItems: 'flex-end' }}>
                  {supplier.specialization && (
                    <span className={`${styles.badge} ${styles.badgeSpecialization}`}>
                      {supplier.specialization}
                    </span>
                  )}
                  <span className={`${styles.badge} ${supplier.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                    {supplier.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className={styles.supplierDetails}>
                {supplier.phone && (
                  <div className={styles.detailRow}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    {supplier.phone}
                  </div>
                )}
                {supplier.email && (
                  <div className={styles.detailRow}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    {supplier.email}
                  </div>
                )}
                {supplier.address && (
                  <div className={styles.detailRow}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {supplier.address}
                  </div>
                )}
              </div>

              <div className={styles.cardActions}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedSupplier(supplier)}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SupplierDetailModal
        supplier={selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
      />
    </>
  );
};

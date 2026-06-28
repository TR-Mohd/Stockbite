import React, { useState, useEffect } from 'react';
import api from '../../core/api/axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import styles from './suppliers.module.css';

export const DraftPOCreator = ({ onOrderCreated }) => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    supplier_id: '',
    quantity: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingAlerts(true);
      try {
        const [ingredientsRes, suppliersRes] = await Promise.all([
          api.get('/ingredients/?low_stock=true'),
          api.get('/suppliers/?active=true'),
        ]);
        setLowStockItems(ingredientsRes.data);
        setSuppliers(suppliersRes.data);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Could not load low-stock data. Is the backend running?');
      } finally {
        setLoadingAlerts(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setSuccessMessage('');
    setError(null);
    // Suggest a quantity that brings stock 50% above the reorder point
    const suggested = Math.max(1, Math.ceil((item.reorder_point * 1.5) - item.current_stock));
    // Pre-select preferred supplier if available
    const preferredSupplier = suppliers.find((s) => s.id === item.preferred_supplier_id);
    setFormData({
      supplier_id: preferredSupplier?.id || (suppliers[0]?.id || ''),
      quantity: String(suggested),
      notes: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || !formData.supplier_id || !formData.quantity) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.post('/purchase-orders/', {
        supplier_id: formData.supplier_id,
        ingredient_id: selectedItem.id,
        suggested_quantity: parseFloat(formData.quantity),
        status: 'Draft',
        notes: formData.notes,
      });
      setSuccessMessage(
        `Draft PO for "${selectedItem.name}" created successfully! View it in the Purchase Orders tab.`
      );
      setSelectedItem(null);
      setFormData({ supplier_id: '', quantity: '', notes: '' });
      if (onOrderCreated) onOrderCreated();
    } catch (err) {
      console.error('Failed to create PO:', err);
      setError('Failed to create draft PO. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedItem(null);
    setFormData({ supplier_id: '', quantity: '', notes: '' });
    setError(null);
  };

  return (
    <>
      <div className={styles.sectionToolbar}>
        <h2 className={styles.sectionTitle}>Draft Purchase Order</h2>
      </div>

      {successMessage && (
        <div className={styles.successBanner}>{successMessage}</div>
      )}

      <div className={styles.draftContainer}>
        {/* Left Panel: Low-Stock Alerts */}
        <div className={styles.alertsPanel}>
          <h3 className={styles.alertsPanelTitle}>
            🔴 Low-Stock Alerts
            {!loadingAlerts && ` (${lowStockItems.length})`}
          </h3>
          <p className={styles.alertsPanelSub}>
            Select an ingredient to auto-generate a draft purchase order.
          </p>

          {loadingAlerts ? (
            <div className={styles.loadingState} style={{ padding: '2rem' }}>
              Loading alerts...
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className={styles.emptyPlaceholder} style={{ padding: '2rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
              <h3>All stock levels OK</h3>
              <p>No ingredients are below their reorder point.</p>
            </div>
          ) : (
            <div className={styles.alertsList}>
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className={styles.alertItem}
                  style={
                    selectedItem?.id === item.id
                      ? { borderLeftColor: 'var(--color-primary)', background: '#FFF7ED' }
                      : {}
                  }
                >
                  <div className={styles.alertItemInfo}>
                    <span className={styles.alertItemName}>{item.name}</span>
                    <span className={styles.alertItemMeta}>
                      Reorder point: {item.reorder_point} {item.unit}
                    </span>
                    <span className={styles.alertItemStock}>
                      Stock: {item.current_stock} {item.unit}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={selectedItem?.id === item.id ? 'primary' : 'secondary'}
                    onClick={() => handleSelectItem(item)}
                  >
                    {selectedItem?.id === item.id ? 'Selected' : 'Select'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel: PO Form */}
        <div className={styles.formPanel}>
          <h3 className={styles.formPanelTitle}>
            {selectedItem ? `Creating PO for: ${selectedItem.name}` : 'Purchase Order Details'}
          </h3>

          {!selectedItem ? (
            <div className={styles.emptyPlaceholder} style={{ padding: '3rem 1rem' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <h3>No ingredient selected</h3>
              <p>Select a low-stock ingredient on the left to begin drafting a PO.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.formGrid}>
              {error && <div className={styles.errorState}>{error}</div>}

              {/* Supplier Select */}
              <div className={styles.formRow}>
                <label className={styles.formLabel} htmlFor="po-supplier">
                  Supplier *
                </label>
                <select
                  id="po-supplier"
                  className={styles.formSelect}
                  value={formData.supplier_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, supplier_id: e.target.value }))}
                  required
                >
                  <option value="">— Select a supplier —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.specialization ? `(${s.specialization})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <Input
                id="po-quantity"
                label={`Quantity to Order (${selectedItem.unit || 'units'}) *`}
                type="number"
                min="0.1"
                step="0.1"
                value={formData.quantity}
                onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                required
              />

              {/* Notes */}
              <div className={styles.formRow}>
                <label className={styles.formLabel} htmlFor="po-notes">
                  Notes (Optional)
                </label>
                <textarea
                  id="po-notes"
                  className={styles.formTextarea}
                  placeholder="e.g. Please deliver by Friday morning."
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className={styles.formActions}>
                <Button type="button" variant="ghost" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Draft PO'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

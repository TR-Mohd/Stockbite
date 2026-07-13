import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatQuantity } from '../../utils/formatters';
import { NumberInput } from '../../components/ui/NumberInput';
import styles from './suppliers.module.css';

export const ReceivePOModal = ({ isOpen, onClose, order, onSubmit }) => {
  const [actualQuantity, setActualQuantity] = useState('');

  useEffect(() => {
    if (order) {
      setActualQuantity(order.suggested_quantity);
    }
  }, [order]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && order) {
      onSubmit(order.id, parseFloat(actualQuantity));
    }
  };

  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receive Purchase Order #${order.id.slice(0, 8)}`}
      size="medium"
    >
      <form onSubmit={handleSubmit}>
        <div className={styles.modalSection}>
          <div className={styles.infoGrid} style={{ marginBottom: '1.5rem' }}>
            <div className={styles.infoItem}>
              <span className={styles.infoItemLabel}>Ingredient</span>
              <span className={styles.infoItemValue}>{order.ingredient_name}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoItemLabel}>Supplier</span>
              <span className={styles.infoItemValue}>{order.supplier_name}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoItemLabel}>Ordered Quantity</span>
              <span className={styles.infoItemValue}>{formatQuantity(order.suggested_quantity, order.unit)} {order.unit}</span>
            </div>
          </div>
          
          <div className="modal-form-group">
            <label className="modal-label">Actual Quantity Received ({order.unit}) *</label>
            <NumberInput
              unit={order.unit}
              min="0"
              required
              className="modal-input"
              value={actualQuantity}
              onChange={(e) => setActualQuantity(e.target.value)}
            />
            <p className={styles.textMuted} style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Adjust this value if the received amount differs from the ordered amount.
            </p>
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Confirm Receipt
          </Button>
        </div>
      </form>
    </Modal>
  );
};

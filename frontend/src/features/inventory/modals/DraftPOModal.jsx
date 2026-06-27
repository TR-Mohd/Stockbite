import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import '../../../styles/inventory/modals/InventoryModals.css';

export const DraftPOModal = ({ isOpen, onClose, ingredient, onSubmit }) => {
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState('');

  useEffect(() => {
    if (isOpen && ingredient) {
      // Pre-fill logic: suggest ROP minus current stock (or standard buffer if out of stock)
      const suggested = Math.max(ingredient.rop - ingredient.stock, 0) || ingredient.rop * 2;
      setQuantity(suggested.toString());
      setSupplier('');
    }
  }, [isOpen, ingredient]);

  if (!ingredient) return null;

  const handleSubmit = (actionType) => {
    if (!quantity || !supplier) return;
    // We pass back actionType to differentiate Draft vs Send
    onSubmit({ ingredientId: ingredient.id, quantity: Number(quantity), supplier, actionType });
    onClose();
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={!quantity || !supplier}>
        Save as Draft
      </Button>
      <Button variant="primary" onClick={() => handleSubmit('send')} disabled={!quantity || !supplier}>
        Send to Supplier
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Draft Purchase Order: ${ingredient.name}`} footer={footer}>
      <div className="modal-info-panel">
        <div className="modal-info-row">
          <span className="modal-info-label">Current Stock:</span>
          <span className="modal-info-value">{ingredient.stock} {ingredient.uom}</span>
        </div>
        <div className="modal-info-row">
          <span className="modal-info-label">Reorder Point (ROP):</span>
          <span className="modal-info-value">{ingredient.rop} {ingredient.uom}</span>
        </div>
        <div className="modal-info-row">
          <span className="modal-info-label">Deficit:</span>
          <span className="modal-info-value" style={{ color: 'var(--color-error)' }}>
            {Math.max(ingredient.rop - ingredient.stock, 0)} {ingredient.uom}
          </span>
        </div>
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Supplier *</label>
        <select 
          className="modal-select" 
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
        >
          <option value="">Select a supplier...</option>
          <option value="Fresh Farms Co.">Fresh Farms Co.</option>
          <option value="Sysco Regional">Sysco Regional</option>
          <option value="Local Bakery Supply">Local Bakery Supply</option>
        </select>
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Order Quantity ({ingredient.uom}) *</label>
        <input 
          type="number" 
          className="modal-input" 
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
        />
        <span className="modal-error-text" style={{ color: 'var(--color-text-tertiary)' }}>
          Suggested quantity pre-filled based on current deficit.
        </span>
      </div>
    </Modal>
  );
};

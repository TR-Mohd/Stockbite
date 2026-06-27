import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import './InventoryModals.css';

export const LogWasteModal = ({ isOpen, onClose, ingredient, onSubmit }) => {
  const [wasteQty, setWasteQty] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && ingredient) {
      setWasteQty('');
      setReason('');
      setNotes('');
      setError('');
    }
  }, [isOpen, ingredient]);

  if (!ingredient) return null;

  const validateQuantity = (val) => {
    setWasteQty(val);
    const num = Number(val);
    if (num > ingredient.stock) {
      setError(`Cannot exceed current stock (${ingredient.stock} ${ingredient.uom})`);
    } else {
      setError('');
    }
  };

  const handleSubmit = () => {
    if (!wasteQty || !reason || error || Number(wasteQty) <= 0) return;
    onSubmit({ ingredientId: ingredient.id, wasteQty: Number(wasteQty), reason, notes });
    onClose();
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={handleSubmit} disabled={!wasteQty || !reason || !!error || Number(wasteQty) <= 0}>
        Log Waste
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Log Waste: ${ingredient.name}`} footer={footer}>
      <div className="modal-info-panel">
        <div className="modal-info-row">
          <span className="modal-info-label">Current Stock:</span>
          <span className="modal-info-value">{ingredient.stock} {ingredient.uom}</span>
        </div>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          Logging waste will deduct the specified quantity from the current stock level.
        </p>
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Quantity Wasted ({ingredient.uom}) *</label>
        <input 
          type="number" 
          className="modal-input" 
          value={wasteQty}
          onChange={(e) => validateQuantity(e.target.value)}
          min="1"
          max={ingredient.stock}
        />
        {error && <span className="modal-error-text">{error}</span>}
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Reason *</label>
        <select 
          className="modal-select" 
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option value="">Select reason...</option>
          <option value="Spoiled">Spoiled</option>
          <option value="Damaged">Damaged</option>
          <option value="Expired">Expired</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {reason === 'Other' && (
        <div className="modal-form-group">
          <label className="modal-label">Specify Reason *</label>
          <input 
            type="text" 
            className="modal-input" 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter reason..."
          />
        </div>
      )}
    </Modal>
  );
};

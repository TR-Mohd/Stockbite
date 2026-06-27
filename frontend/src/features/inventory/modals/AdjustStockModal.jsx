import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import './InventoryModals.css';

export const AdjustStockModal = ({ isOpen, onClose, ingredient, onSubmit }) => {
  const [newStock, setNewStock] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && ingredient) {
      setNewStock(ingredient.stock.toString());
      setReason('');
      setNotes('');
    }
  }, [isOpen, ingredient]);

  if (!ingredient) return null;

  const handleSubmit = () => {
    if (newStock === '' || !reason) return;
    onSubmit({ ingredientId: ingredient.id, newStock: Number(newStock), reason, notes });
    onClose();
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={handleSubmit} disabled={newStock === '' || !reason}>
        Confirm Adjustment
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Adjust Stock: ${ingredient.name}`} footer={footer}>
      <div className="modal-info-panel">
        <div className="modal-info-row">
          <span className="modal-info-label">Current System Stock:</span>
          <span className="modal-info-value">{ingredient.stock} {ingredient.uom}</span>
        </div>
      </div>

      <div className="modal-form-group">
        <label className="modal-label">New Actual Stock ({ingredient.uom}) *</label>
        <input 
          type="number" 
          className="modal-input" 
          value={newStock}
          onChange={(e) => setNewStock(e.target.value)}
          min="0"
        />
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Reason for Adjustment *</label>
        <select 
          className="modal-select" 
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option value="">Select reason...</option>
          <option value="Physical count correction">Physical count correction</option>
          <option value="Damaged in storage">Damaged in storage</option>
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

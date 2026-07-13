import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { NumberInput } from '../../../components/ui/NumberInput';
import { formatQuantity } from '../../../utils/formatters';
import '../../../styles/inventory/modals/InventoryModals.css';

export const AdjustStockModal = ({ isOpen, onClose, inventoryData, onSubmit, initialIngredientId = '' }) => {
  const [selectedIngredientId, setSelectedIngredientId] = useState(initialIngredientId);
  const [newStock, setNewStock] = useState('');
  const [newUnitCost, setNewUnitCost] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const selectedIngredient = useMemo(() => {
    return inventoryData?.find(item => item.id === selectedIngredientId) || null;
  }, [inventoryData, selectedIngredientId]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIngredientId(initialIngredientId);
      setNewStock('');
      setNewUnitCost('');
      setReason('');
      setNotes('');
    }
  }, [isOpen, initialIngredientId]);

  useEffect(() => {
    if (selectedIngredient) {
      setNewUnitCost(selectedIngredient.unitCost || 0);
    } else {
      setNewUnitCost('');
    }
  }, [selectedIngredient]);

  const handleSubmit = () => {
    if (!selectedIngredient || newStock === '' || newUnitCost === '' || !reason) return;
    onSubmit({ 
      ingredientId: selectedIngredient.id, 
      newStock: Number(newStock), 
      newUnitCost: Number(newUnitCost),
      reason, 
      notes 
    });
    onClose();
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={handleSubmit} disabled={!selectedIngredient || newStock === '' || newUnitCost === '' || !reason}>
        Confirm Adjustment
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adjust Stock" footer={footer}>
      <div className="modal-form-group">
        <label className="modal-label">Ingredient *</label>
        <select 
          className="modal-select" 
          value={selectedIngredientId}
          onChange={(e) => setSelectedIngredientId(e.target.value)}
        >
          <option value="">Select ingredient...</option>
          {inventoryData?.map(item => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {selectedIngredient && (
        <div className="modal-info-panel" style={{ marginBottom: '16px' }}>
          <div className="modal-info-row">
            <span className="modal-info-label">Current System Stock:</span>
            <span className="modal-info-value">{formatQuantity(selectedIngredient.stock, selectedIngredient.uom)} {selectedIngredient.uom}</span>
          </div>
        </div>
      )}

      <div className="modal-form-group">
        <label className="modal-label">New Actual Stock ({selectedIngredient?.uom || ''}) *</label>
        <NumberInput 
          unit={selectedIngredient?.uom}
          className="modal-input" 
          value={newStock}
          onChange={(e) => setNewStock(e.target.value)}
          min="0"
          disabled={!selectedIngredient}
        />
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Unit Cost (Rp) *</label>
        <NumberInput 
          className="modal-input" 
          value={newUnitCost}
          onChange={(e) => setNewUnitCost(e.target.value)}
          min="0"
          disabled={!selectedIngredient}
        />
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Reason for Adjustment *</label>
        <select 
          className="modal-select" 
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={!selectedIngredient}
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


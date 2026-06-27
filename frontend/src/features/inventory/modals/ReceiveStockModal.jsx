import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import './InventoryModals.css';

export const ReceiveStockModal = ({ isOpen, onClose, inventoryData, onSubmit }) => {
  const [rows, setRows] = useState([{ id: Date.now(), ingredientId: '', quantity: '' }]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRows([{ id: Date.now(), ingredientId: '', quantity: '' }]);
    }
  }, [isOpen]);

  const handleAddRow = () => {
    setRows([...rows, { id: Date.now(), ingredientId: '', quantity: '' }]);
  };

  const handleRemoveRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const handleRowChange = (id, field, value) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSubmit = () => {
    // Filter out empty rows
    const validRows = rows.filter(r => r.ingredientId && r.quantity && Number(r.quantity) > 0);
    
    if (validRows.length === 0) return; // Basic validation
    
    onSubmit(validRows);
    onClose();
  };

  const totalItems = rows.filter(r => r.ingredientId && r.quantity).length;
  
  const isSubmitDisabled = rows.some(r => (!r.ingredientId || !r.quantity || Number(r.quantity) <= 0)) && rows.length > 0;

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={handleSubmit} disabled={isSubmitDisabled || rows.length === 0}>
        Process Delivery
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receive Bulk Stock" footer={footer} size="large">
      <div className="modal-info-panel">
        <div className="modal-info-row">
          <span className="modal-info-label">Items to receive:</span>
          <span className="modal-info-value">{totalItems} row(s)</span>
        </div>
      </div>

      {rows.map((row, index) => (
        <div key={row.id} className="modal-form-row">
          <div className="flex-2">
            {index === 0 && <label className="modal-label">Ingredient</label>}
            <select 
              className="modal-select" 
              value={row.ingredientId}
              onChange={(e) => handleRowChange(row.id, 'ingredientId', e.target.value)}
            >
              <option value="">Select ingredient...</option>
              {inventoryData.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.uom}) - Current: {item.stock}
                </option>
              ))}
            </select>
          </div>
          <div>
            {index === 0 && <label className="modal-label">Qty Received</label>}
            <input 
              type="number" 
              className="modal-input" 
              placeholder="0"
              min="1"
              value={row.quantity}
              onChange={(e) => handleRowChange(row.id, 'quantity', e.target.value)}
            />
          </div>
          <div className="flex-none">
            {index === 0 && <label className="modal-label">&nbsp;</label>}
            <button 
              className="remove-row-btn" 
              onClick={() => handleRemoveRow(row.id)}
              disabled={rows.length === 1}
              title="Remove row"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      ))}

      <button className="add-row-btn" onClick={handleAddRow}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add another item
      </button>
    </Modal>
  );
};

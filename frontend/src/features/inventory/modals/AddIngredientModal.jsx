import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { NumberInput } from '../../../components/ui/NumberInput';
import api from '../../../core/api/axios';
import '../../../styles/inventory/modals/InventoryModals.css';

const ErrorIcon = () => (
  <svg 
    className="inventory-error-banner-icon" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const AddIngredientModal = ({ isOpen, onClose, inventoryData, onSubmit }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Uncategorized');
  const [unit, setUnit] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [reorderPoint, setReorderPoint] = useState('');
  const [supplierId, setSupplierId] = useState('');
  
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      setName('');
      setCategory('Uncategorized');
      setUnit('');
      setUnitCost('');
      setReorderPoint('');
      setSupplierId('');
      setError('');
      fetchSuppliers();
    }
  }, [isOpen]);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers/');
      setSuppliers(response.data);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    }
  };

  const handleSubmit = async () => {
    setError('');
    
    // Duplicate Name Validation (Case Insensitive)
    const normalizedName = name.trim().toLowerCase();
    const isDuplicate = inventoryData.some(item => item.name.toLowerCase() === normalizedName);
    
    if (isDuplicate) {
      setError(`An ingredient named "${name.trim()}" already exists.`);
      return;
    }

    if (!name.trim() || !unit.trim()) {
      setError('Name and Unit are required.');
      return;
    }

    const cost = Number(unitCost);
    const rop = Number(reorderPoint);

    if (cost < 0 || rop < 0) {
      setError('Unit Cost and Reorder Point cannot be negative.');
      return;
    }

    const payload = {
      name: name.trim(),
      category: category.trim() || 'Uncategorized',
      unit: unit.trim(),
      unit_cost: cost || 0,
      reorder_point: rop || 0,
      preferred_supplier_id: supplierId || null,
      stock_level: 0 // Default starting stock
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'System error occurred. Please try again.';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  const isFormValid = name.trim() !== '' && unit.trim() !== '';

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={handleSubmit} disabled={!isFormValid}>
        Add Ingredient
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Ingredient" footer={footer}>
      {error && (
        <div className="inventory-error-banner" role="alert">
          <ErrorIcon />
          <span>{error}</span>
        </div>
      )}

      <div className="modal-form-group">
        <label className="modal-label">Ingredient Name *</label>
        <input 
          type="text" 
          className="modal-input" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Tomato Paste"
        />
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Category</label>
        <input 
          type="text" 
          className="modal-input" 
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Vegetables"
        />
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Unit of Measurement (UOM) *</label>
        <input 
          type="text" 
          className="modal-input" 
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="e.g. kg, L, pcs"
        />
      </div>

      <div className="modal-form-group" style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <label className="modal-label">Unit Cost (Rp)</label>
          <NumberInput 
            className="modal-input" 
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            min="0"
            placeholder="0"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="modal-label">Reorder Point</label>
          <NumberInput 
            unit={unit}
            className="modal-input" 
            value={reorderPoint}
            onChange={(e) => setReorderPoint(e.target.value)}
            min="0"
            placeholder="0"
          />
        </div>
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Preferred Supplier</label>
        <select 
          className="modal-select" 
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        >
          <option value="">None</option>
          {suppliers.map(sup => (
            <option key={sup.id} value={sup.id}>
              {sup.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="modal-info-panel" style={{ marginTop: '16px' }}>
        <div className="modal-info-row" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          <span>Note: Initial stock level will be set to 0. Use "Receive Stock" to log incoming inventory.</span>
        </div>
      </div>
    </Modal>
  );
};

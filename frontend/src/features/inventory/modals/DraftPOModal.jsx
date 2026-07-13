import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { NumberInput } from '../../../components/ui/NumberInput';
import { formatQuantity } from '../../../utils/formatters';
import api from '../../../core/api/axios';
import '../../../styles/inventory/modals/InventoryModals.css';

export const DraftPOModal = ({ isOpen, onClose, ingredient, onSubmit }) => {
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState('');
  const [suppliersList, setSuppliersList] = useState([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchSuppliers = async () => {
        setIsLoadingSuppliers(true);
        try {
          const response = await api.get('/suppliers/');
          setSuppliersList(response.data);
        } catch (error) {
          console.error('Failed to fetch suppliers:', error);
        } finally {
          setIsLoadingSuppliers(false);
        }
      };
      fetchSuppliers();
    }
  }, [isOpen]);

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
      <Button variant="primary" onClick={() => handleSubmit('draft')} disabled={!quantity || !supplier}>
        Save as Draft
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Draft Purchase Order: ${ingredient.name}`} footer={footer}>
      <div className="modal-info-panel">
        <div className="modal-info-row">
          <span className="modal-info-label">Current Stock:</span>
          <span className="modal-info-value">{formatQuantity(ingredient.stock, ingredient.uom)} {ingredient.uom}</span>
        </div>
        <div className="modal-info-row">
          <span className="modal-info-label">Reorder Point (ROP):</span>
          <span className="modal-info-value">{formatQuantity(ingredient.rop, ingredient.uom)} {ingredient.uom}</span>
        </div>
        <div className="modal-info-row">
          <span className="modal-info-label">Deficit:</span>
          <span className="modal-info-value" style={{ color: 'var(--color-error)' }}>
            {formatQuantity(Math.max(ingredient.rop - ingredient.stock, 0), ingredient.uom)} {ingredient.uom}
          </span>
        </div>
      </div>

      <div className="modal-form-group" style={{ marginBottom: isSupplierDropdownOpen ? '220px' : '', transition: 'margin-bottom 0.2s' }}>
        <label className="modal-label">Supplier *</label>
        <div 
          className="modal-select" 
          style={{ 
            position: 'relative', 
            cursor: isLoadingSuppliers ? 'not-allowed' : 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-bg-surface)'
          }}
          onClick={() => {
            if (!isLoadingSuppliers) {
              setIsSupplierDropdownOpen(!isSupplierDropdownOpen);
            }
          }}
        >
          <span style={{ 
            color: supplier ? 'inherit' : 'var(--color-text-tertiary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 'calc(100% - 24px)'
          }}>
            {supplier ? suppliersList.find(s => s.id === supplier)?.name : (isLoadingSuppliers ? 'Loading suppliers...' : 'Select a supplier...')}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--color-text-tertiary)' }}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          
          {isSupplierDropdownOpen && (
            <ul style={{ 
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md, 6px)',
              zIndex: 50,
              padding: '0.25rem 0', 
              marginTop: '0.25rem', 
              maxHeight: '200px', 
              overflowY: 'auto',
              listStyle: 'none',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
            }}>
              {suppliersList.map(s => (
                <li 
                  key={s.id} 
                  style={{ 
                    padding: '0.5rem 1rem', 
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    backgroundColor: supplier === s.id ? 'var(--color-bg-surface-hover)' : 'transparent',
                    color: 'var(--color-text-primary)'
                  }}
                  onClick={(e) => { 
                    e.stopPropagation();
                    setSupplier(s.id); 
                    setIsSupplierDropdownOpen(false); 
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-bg-surface-hover)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = supplier === s.id ? 'var(--color-bg-surface-hover)' : 'transparent'}
                >
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Order Quantity ({ingredient.uom}) *</label>
        <NumberInput 
          unit={ingredient.uom}
          className="modal-input" 
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="0"
          placeholder="Enter quantity..."
        />
        <span className="modal-error-text" style={{ color: 'var(--color-text-tertiary)' }}>
          Suggested quantity pre-filled based on current deficit.
        </span>
      </div>
    </Modal>
  );
};

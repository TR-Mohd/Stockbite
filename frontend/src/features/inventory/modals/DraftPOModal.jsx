import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { NumberInput } from '../../../components/ui/NumberInput';
import { IngredientCombobox } from '../../../components/ui/IngredientCombobox';
import { formatQuantity, formatCurrency } from '../../../utils/formatters';
import api from '../../../core/api/axios';
import '../../../styles/inventory/modals/InventoryModals.css';

export const DraftPOModal = ({ isOpen, onClose, ingredient, onSubmit }) => {
  const [items, setItems] = useState([]);
  const [supplier, setSupplier] = useState('');
  const [suppliersList, setSuppliersList] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoadingSuppliers(true);
        try {
          const [supRes, ingRes] = await Promise.all([
            api.get('/suppliers/'),
            api.get('/inventory/')
          ]);
          setSuppliersList(supRes.data);
          setAllIngredients(ingRes.data);
        } catch (error) {
          console.error('Failed to fetch modal data:', error);
        } finally {
          setIsLoadingSuppliers(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && ingredient) {
      const recommendedOrder = Math.max((ingredient.rop * 2) - ingredient.stock, 0);
      setItems([
        {
          ingredient_id: ingredient.id,
          ingredient_name: ingredient.name,
          uom: ingredient.uom || ingredient.unit || 'pcs',
          stock: ingredient.stock,
          rop: ingredient.rop,
          ordered_quantity: recommendedOrder.toString(),
          unit_cost: (ingredient.unit_cost !== undefined && ingredient.unit_cost !== null) ? String(ingredient.unit_cost) : ''
        }
      ]);
      setSupplier('');
      setNotes('');
    } else if (isOpen) {
      setItems([]);
      setSupplier('');
      setNotes('');
    }
  }, [isOpen, ingredient]);

  if (!isOpen) return null;

  const handleAddIngredient = (ing) => {
    if (items.some(i => i.ingredient_id === ing.id)) return;
    const stock = ing.stock_level;
    const rop = ing.reorder_point;
    const recQty = Math.max((rop * 2) - stock, 0);
    setItems(prev => [
      ...prev,
      {
        ingredient_id: ing.id,
        ingredient_name: ing.name,
        uom: ing.unit,
        stock: stock,
        rop: rop,
        ordered_quantity: recQty.toString(),
        unit_cost: (ing.unit_cost !== undefined && ing.unit_cost !== null) ? String(ing.unit_cost) : ''
      }
    ]);
  };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item =>
      item.ingredient_id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(item => item.ingredient_id !== id));
  };

  const totalEstimatedCost = items.reduce((sum, item) => {
    const qty = Number(item.ordered_quantity) || 0;
    const cost = Number(item.unit_cost) || 0;
    return sum + (qty * cost);
  }, 0);

  const isFormValid = supplier && items.length > 0 && items.every(item => {
    const qty = Number(item.ordered_quantity);
    const cost = Number(item.unit_cost);
    return !isNaN(qty) && qty > 0 && !isNaN(cost) && cost >= 0;
  });

  const handleSubmit = (actionType) => {
    if (!isFormValid) return;
    const defaultNote = actionType === 'draft' ? 'Saved as draft' : 'Sent to supplier';
    const finalNotes = notes.trim() !== '' ? notes : defaultNote;
    onSubmit({
      supplier,
      actionType,
      notes: finalNotes,
      items: items.map(i => ({
        ingredient_id: i.ingredient_id,
        ordered_quantity: Number(i.ordered_quantity),
        unit_cost: Number(i.unit_cost) || 0
      }))
    });
    onClose();
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={() => handleSubmit('draft')} disabled={!isFormValid}>
        Save as Draft
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ingredient ? `Draft Purchase Order: ${ingredient.name}` : 'Draft Purchase Order'} size="large" footer={footer}>
      <div className="modal-form-group" style={{ marginBottom: isSupplierDropdownOpen ? '220px' : '1.5rem', transition: 'margin-bottom 0.2s' }}>
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

      <div className="modal-form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="modal-label" style={{ fontWeight: 600, fontSize: '0.95rem' }}>Line Items</label>
        <div style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.75rem' }}>Ingredient</th>
                <th style={{ padding: '0.5rem 0.75rem', width: '130px' }}>Order Qty *</th>
                <th style={{ padding: '0.5rem 0.75rem', width: '130px' }}>Unit Cost (Rp) *</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', width: '120px' }}>Subtotal</th>
                <th style={{ padding: '0.5rem 0.5rem', textAlign: 'center', width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const subtotal = (Number(item.ordered_quantity) || 0) * (Number(item.unit_cost) || 0);
                return (
                  <tr key={item.ingredient_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <div style={{ fontWeight: 600 }}>{item.ingredient_name} ({item.uom})</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        Stock: {formatQuantity(item.stock, item.uom)} · ROP: {formatQuantity(item.rop, item.uom)}
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <NumberInput
                        unit={item.uom}
                        min="0"
                        value={item.ordered_quantity}
                        onChange={(e) => handleItemChange(item.ingredient_id, 'ordered_quantity', e.target.value)}
                        placeholder="Qty"
                      />
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="modal-input"
                        value={item.unit_cost}
                        onChange={(e) => handleItemChange(item.ingredient_id, 'unit_cost', e.target.value)}
                        placeholder="Cost"
                        style={{ width: '100%', padding: '0.4rem 0.5rem' }}
                      />
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(subtotal)}
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.ingredient_id)}
                        disabled={items.length <= 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: items.length <= 1 ? 'var(--color-text-tertiary)' : 'var(--color-error)',
                          cursor: items.length <= 1 ? 'not-allowed' : 'pointer',
                          fontSize: '1.2rem',
                          lineHeight: 1,
                          opacity: items.length <= 1 ? 0.4 : 1
                        }}
                        title={items.length <= 1 ? 'At least one item is required' : 'Remove line item'}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <IngredientCombobox
          ingredients={allIngredients}
          selectedIds={items.map(i => i.ingredient_id)}
          onSelect={handleAddIngredient}
          placeholder="Search & add more ingredients..."
        />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--color-bg-base)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1.5rem',
        border: '1px solid var(--color-border)'
      }}>
        <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Total Estimated PO Value:</span>
        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
          {formatCurrency(totalEstimatedCost)}
        </span>
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Notes (Optional)</label>
        <Input 
          className="modal-input" 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Leave blank for default..."
        />
      </div>
    </Modal>
  );
};

import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { NumberInput } from '../../components/ui/NumberInput';
import api from '../../core/api/axios';
import '../../styles/manager/ManagerDashboard.module.css';
import '../../styles/inventory/modals/InventoryModals.css'; // Reuse modal styles

export const MenuModal = ({ isOpen, onClose, onSave, menuItem }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    image: '',
    is_active: true
  });
  const [ingredients, setIngredients] = useState([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [recipeRows, setRecipeRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchIngredients();
      if (menuItem) {
        setFormData({
          name: menuItem.name || '',
          category: menuItem.category || '',
          price: menuItem.price !== undefined ? String(menuItem.price) : '',
          image: menuItem.image || '',
          is_active: menuItem.is_active !== undefined ? menuItem.is_active : true
        });
        if (menuItem.recipes && Array.isArray(menuItem.recipes)) {
          setRecipeRows(menuItem.recipes.map(r => ({
            ingredient_id: r.ingredient_id,
            ingredient_name: r.ingredient_name || r.name || '',
            unit: r.unit || 'pcs',
            quantity: r.quantity !== undefined ? String(r.quantity) : ''
          })));
        } else {
          setRecipeRows([]);
        }
      } else {
        setFormData({
          name: '',
          category: '',
          price: '',
          image: '',
          is_active: true
        });
        setRecipeRows([]);
      }
      setIngredientSearch('');
      setError('');
    }
  }, [isOpen, menuItem]);

  const fetchIngredients = async () => {
    try {
      const res = await api.get('/inventory/');
      setIngredients(res.data);
    } catch (err) {
      console.error("Failed to fetch ingredients:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddIngredientRow = (ing) => {
    if (recipeRows.some(r => r.ingredient_id === ing.id)) {
      return;
    }
    setRecipeRows(prev => [
      ...prev,
      {
        ingredient_id: ing.id,
        ingredient_name: ing.name,
        unit: ing.unit,
        quantity: '1'
      }
    ]);
    setIngredientSearch('');
  };

  const handleQuantityChange = (ingredient_id, newQty) => {
    setRecipeRows(prev => prev.map(r => 
      r.ingredient_id === ingredient_id ? { ...r, quantity: newQty } : r
    ));
  };

  const handleRemoveRecipeRow = (ingredient_id) => {
    setRecipeRows(prev => prev.filter(r => r.ingredient_id !== ingredient_id));
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.category.trim() || formData.price === '') {
      setError('Please fill out all required fields.');
      return;
    }
    const numericPrice = Number(formData.price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      setError('Price must be a valid non-negative number.');
      return;
    }

    for (const r of recipeRows) {
      const qtyNum = Number(r.quantity);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        setError(`Please specify a valid quantity for ingredient: ${r.ingredient_name}`);
        return;
      }
    }

    const payload = {
      ...formData,
      name: formData.name.trim(),
      category: formData.category.trim(),
      price: numericPrice,
      recipes: recipeRows.map(r => ({
        ingredient_id: r.ingredient_id,
        quantity: Number(r.quantity)
      }))
    };
    onSave(payload);
  };

  const filteredIngredients = ingredients.filter(ing => 
    ing.name.toLowerCase().includes(ingredientSearch.toLowerCase().trim()) &&
    !recipeRows.some(r => r.ingredient_id === ing.id)
  );

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={handleSave}>
        {menuItem ? 'Update Menu Item' : 'Add Menu Item'}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={menuItem ? "Edit Menu Item" : "Add Menu Item"} footer={footer}>
      {error && <div className="modal-error-text" style={{ marginBottom: '1rem' }}>{error}</div>}
      
      <div className="modal-form-group">
        <label className="modal-label">Name *</label>
        <input 
          type="text" 
          name="name"
          className="modal-input" 
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Classic Cheeseburger"
        />
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Category *</label>
        <select 
          name="category"
          className="modal-select" 
          value={formData.category}
          onChange={handleChange}
        >
          <option value="">Select Category...</option>
          <option value="Main Course">Main Course</option>
          <option value="Beverage">Beverage</option>
          <option value="Appetizer">Appetizer</option>
          <option value="Dessert">Dessert</option>
        </select>
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Price (Rp) *</label>
        <input 
          type="number" 
          name="price"
          className="modal-input" 
          value={formData.price}
          onChange={handleChange}
          min="0"
          placeholder="e.g. 50000"
        />
      </div>

      <div className="modal-form-group">
        <label className="modal-label">Image URL</label>
        <input 
          type="text" 
          name="image"
          className="modal-input" 
          value={formData.image}
          onChange={handleChange}
          placeholder="/placeholder-food.png"
        />
      </div>
      
      {!menuItem && (
        <div className="modal-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
          <input 
            type="checkbox" 
            name="is_active"
            id="is_active_checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
          />
          <label htmlFor="is_active_checkbox" style={{ margin: 0 }}>Active</label>
        </div>
      )}

      {/* Recipe Ingredients Section */}
      <div className="modal-form-group" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
        <label className="modal-label" style={{ fontWeight: '600', fontSize: '0.95rem' }}>Recipe Ingredients</label>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
          Search and add ingredients required to prepare this item.
        </p>

        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
          <input
            type="text"
            className="modal-input"
            value={ingredientSearch}
            onChange={(e) => setIngredientSearch(e.target.value)}
            placeholder="Search ingredient to add..."
          />
          {ingredientSearch.trim() !== '' && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                maxHeight: '160px',
                overflowY: 'auto',
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                zIndex: 10,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}
            >
              {filteredIngredients.length === 0 ? (
                <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  No matching ingredients found
                </div>
              ) : (
                filteredIngredients.map(ing => (
                  <div
                    key={ing.id}
                    onClick={() => handleAddIngredientRow(ing)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--color-border)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span>{ing.name}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>({ing.unit})</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {recipeRows.length === 0 ? (
          <div style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: 'var(--color-bg-surface-hover)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            No ingredients added yet to recipe.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recipeRows.map((row) => (
              <div key={row.ingredient_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '500', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.ingredient_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Unit: {row.unit}
                  </div>
                </div>
                <div style={{ width: '130px' }}>
                  <NumberInput
                    unit={row.unit}
                    value={row.quantity}
                    onChange={(e) => handleQuantityChange(row.ingredient_id, e.target.value)}
                    min="0.001"
                    placeholder="Qty"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRecipeRow(row.ingredient_id)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                  title="Remove ingredient"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

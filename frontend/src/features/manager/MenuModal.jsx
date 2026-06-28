import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
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
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (menuItem) {
        setFormData({
          name: menuItem.name,
          category: menuItem.category,
          price: menuItem.price,
          image: menuItem.image || '',
          is_active: menuItem.is_active
        });
      } else {
        setFormData({
          name: '',
          category: '',
          price: '',
          image: '',
          is_active: true
        });
      }
      setError('');
    }
  }, [isOpen, menuItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.category || !formData.price) {
      setError('Please fill out all required fields.');
      return;
    }
    const payload = {
      ...formData,
      price: Number(formData.price)
    };
    onSave(payload);
  };

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
    </Modal>
  );
};

import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import styles from '../../styles/manager/ManagerDashboard.module.css';

export const SupplierModal = ({ isOpen, onClose, onSave, supplier = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    specialization: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        contact_person: supplier.contact_person || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        specialization: supplier.specialization || ''
      });
    } else {
      setFormData({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        specialization: ''
      });
    }
    setErrors({});
  }, [supplier, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'Company Name is required';
    if (!formData.contact_person?.trim()) newErrors.contact_person = 'Contact Person is required';
    if (!formData.phone?.trim()) newErrors.phone = 'Phone is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    if (!formData.specialization?.trim()) newErrors.specialization = 'Category Supplied is required';
    if (!formData.address?.trim()) newErrors.address = 'Address is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  const footer = (
    <div className={styles.modalFooter}>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit}>
        {supplier ? 'Save Changes' : 'Add Supplier'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? 'Edit Supplier' : 'Add New Supplier'}
      footer={footer}
      disableOutsideClick={true}
    >
      <form onSubmit={handleSubmit} className={styles.modalForm} style={{ paddingBottom: '1rem' }}>
        <Input
          label="Company Name"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="e.g. Global Meats Inc."
        />
        
        <Input
          label="Contact Person"
          id="contact_person"
          name="contact_person"
          value={formData.contact_person}
          onChange={handleChange}
          error={errors.contact_person}
          placeholder="e.g. John Smith"
        />

        <Input
          label="Phone"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          placeholder="e.g. +62 812-3456-7890"
        />

        <Input
          label="Email"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="e.g. contact@company.com"
        />

        <Input
          label="Category Supplied"
          id="specialization"
          name="specialization"
          value={formData.specialization}
          onChange={handleChange}
          error={errors.specialization}
          placeholder="e.g. Meat, Produce"
        />

        <Input
          label="Address"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          error={errors.address}
          placeholder="e.g. 123 Main St, City"
        />
      </form>
    </Modal>
  );
};

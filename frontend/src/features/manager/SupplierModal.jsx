import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import styles from '../../styles/manager/ManagerDashboard.module.css';
import { REGIONS } from '../../constants/regions';
import inputStyles from '../../components/ui/Input.module.css';
import { formatPhoneNumber } from '../../utils/formatters';

export const SupplierModal = ({ isOpen, onClose, onSave, supplier = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    specialization: '',
    coverage: 'Regional',
    regionCode: ''
  });

  const [errors, setErrors] = useState({});
  const [isHubDropdownOpen, setIsHubDropdownOpen] = useState(false);

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        contact_person: supplier.contact_person || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        specialization: supplier.specialization || '',
        coverage: supplier.coverage || 'Regional',
        regionCode: supplier.regionCode || ''
      });
    } else {
      setFormData({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        specialization: '',
        coverage: 'Regional',
        regionCode: ''
      });
    }
    setErrors({});
    setIsHubDropdownOpen(false);
  }, [supplier, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'contact_person') {
        const hasContactPerson = !!value.trim();
        if (updated.phone) {
          updated.phone = formatPhoneNumber(updated.phone, hasContactPerson);
        }
      } else if (name === 'phone') {
        const hasContactPerson = !!updated.contact_person?.trim();
        updated.phone = formatPhoneNumber(value, hasContactPerson);
      }

      if (name === 'coverage' && value === 'National') {
        updated.regionCode = '';
      }
      return updated;
    });
    
    setErrors(prev => {
      const newErrors = { ...prev };
      if (newErrors[name]) {
        newErrors[name] = null;
      }
      if (name === 'coverage' && value === 'National') {
        newErrors.regionCode = null;
      }
      
      if (name === 'email') {
        if (value.trim() === '') {
          newErrors.email = 'Email is required';
        } else if (!value.includes('@')) {
          newErrors.email = 'Email must contain "@" symbol';
        } else {
          const parts = value.split('@');
          if (parts[0].length === 0) {
            newErrors.email = 'Email must have a username before "@"';
          } else if (!parts[1].includes('.')) {
            newErrors.email = 'Email domain must contain a dot (e.g., .com)';
          } else {
            const domainParts = parts[1].split('.');
            if (domainParts[0].length === 0) {
              newErrors.email = 'Email domain name is required before the dot';
            } else if (domainParts[domainParts.length - 1].length < 2) {
              newErrors.email = 'Email domain must end with a valid extension (e.g., .com)';
            }
          }
        }
      }
      
      return newErrors;
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'Company Name is required';
    if (!formData.phone?.trim()) newErrors.phone = 'Phone is required';
    
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const parts = formData.email.split('@');
      if (!formData.email.includes('@')) {
        newErrors.email = 'Email must contain "@" symbol';
      } else if (parts[0].length === 0) {
        newErrors.email = 'Email must have a username before "@"';
      } else if (!parts[1].includes('.')) {
        newErrors.email = 'Email domain must contain a dot (e.g., .com)';
      } else {
        const domainParts = parts[1].split('.');
        if (domainParts[0].length === 0) {
          newErrors.email = 'Email domain name is required before the dot';
        } else if (domainParts[domainParts.length - 1].length < 2) {
          newErrors.email = 'Email domain must end with a valid extension (e.g., .com)';
        }
      }
    }
    
    if (!formData.specialization?.trim()) newErrors.specialization = 'Category Supplied is required';
    if (!formData.address?.trim()) newErrors.address = 'Address is required';
    if (formData.coverage === 'Regional' && !formData.regionCode) newErrors.regionCode = 'Logistics Hub is required';
    
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
          label="Contact Person (optional)"
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

        <div className={inputStyles.inputWrapper}>
          <label className={inputStyles.label}>Coverage</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: '0.875rem',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              border: `1px solid ${formData.coverage === 'Regional' ? 'var(--color-primary, #4f46e5)' : 'var(--color-border, #e5e7eb)'}`,
              borderRadius: 'var(--radius-md, 6px)',
              backgroundColor: formData.coverage === 'Regional' ? 'rgba(79, 70, 229, 0.05)' : 'transparent',
              color: formData.coverage === 'Regional' ? 'var(--color-primary, #4f46e5)' : 'var(--color-text-secondary, #4b5563)',
              fontWeight: formData.coverage === 'Regional' ? '500' : 'normal',
              transition: 'all 0.2s',
              flex: 1,
              justifyContent: 'center'
            }}>
              <input type="radio" name="coverage" value="Regional" checked={formData.coverage === 'Regional'} onChange={handleChange} style={{ display: 'none' }} />
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${formData.coverage === 'Regional' ? 'var(--color-primary, #4f46e5)' : 'var(--color-text-tertiary, #9ca3af)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {formData.coverage === 'Regional' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary, #4f46e5)' }} />}
              </div>
              Regional
            </label>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: '0.875rem',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              border: `1px solid ${formData.coverage === 'National' ? 'var(--color-primary, #4f46e5)' : 'var(--color-border, #e5e7eb)'}`,
              borderRadius: 'var(--radius-md, 6px)',
              backgroundColor: formData.coverage === 'National' ? 'rgba(79, 70, 229, 0.05)' : 'transparent',
              color: formData.coverage === 'National' ? 'var(--color-primary, #4f46e5)' : 'var(--color-text-secondary, #4b5563)',
              fontWeight: formData.coverage === 'National' ? '500' : 'normal',
              transition: 'all 0.2s',
              flex: 1,
              justifyContent: 'center'
            }}>
              <input type="radio" name="coverage" value="National" checked={formData.coverage === 'National'} onChange={handleChange} style={{ display: 'none' }} />
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${formData.coverage === 'National' ? 'var(--color-primary, #4f46e5)' : 'var(--color-text-tertiary, #9ca3af)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {formData.coverage === 'National' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary, #4f46e5)' }} />}
              </div>
              National
            </label>
          </div>
        </div>

        <div className={inputStyles.inputWrapper} style={{ marginBottom: isHubDropdownOpen && formData.coverage !== 'National' ? '220px' : '0', transition: 'margin-bottom 0.2s' }}>
          <label className={inputStyles.label}>Logistics Hub</label>
          <div 
            className={`${inputStyles.input} ${errors.regionCode ? inputStyles.inputError : ''}`} 
            style={{ 
              position: 'relative', 
              cursor: formData.coverage === 'National' ? 'not-allowed' : 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              backgroundColor: formData.coverage === 'National' ? 'var(--color-bg-base)' : 'var(--color-bg-surface)',
              color: formData.coverage === 'National' ? 'var(--color-text-tertiary)' : 'inherit'
            }}
            onClick={() => {
              if (formData.coverage !== 'National') {
                setIsHubDropdownOpen(!isHubDropdownOpen);
              }
            }}
          >
            <span style={{ color: formData.regionCode ? 'inherit' : 'var(--color-text-tertiary)' }}>
              {formData.regionCode ? REGIONS.find(r => r.code === formData.regionCode)?.label : '--select hub--'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.chevron}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            
            {isHubDropdownOpen && formData.coverage !== 'National' && (
              <ul className={styles.dropdownList} style={{ padding: '0.25rem 0', marginTop: '0.25rem', maxHeight: '200px', overflowY: 'auto' }}>
                {REGIONS.filter(r => r.code !== 'NAT').map(r => (
                  <li 
                    key={r.code} 
                    className={`${styles.dropdownItem} ${formData.regionCode === r.code ? styles.selected : ''}`}
                    style={{ padding: '0.35rem 1rem', fontSize: '0.875rem' }}
                    onClick={(e) => { 
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, regionCode: r.code })); 
                      setIsHubDropdownOpen(false); 
                      if (errors.regionCode) {
                        setErrors(prev => ({ ...prev, regionCode: null }));
                      }
                    }}
                  >
                    {r.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {errors.regionCode && <span className={inputStyles.errorMessage}>{errors.regionCode}</span>}
        </div>
      </form>
    </Modal>
  );
};

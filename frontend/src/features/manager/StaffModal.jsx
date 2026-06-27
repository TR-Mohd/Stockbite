import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import inputStyles from '../../components/ui/Input.module.css';
import styles from '../../styles/manager/ManagerDashboard.module.css';

export const StaffModal = ({ isOpen, onClose, onSave, staff = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name,
        role: staff.role,
        password: '',
      });
    } else {
      setFormData({
        name: '',
        role: '',
        password: '',
      });
    }
    setErrors({});
    setIsRoleDropdownOpen(false);
  }, [staff, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.role) newErrors.role = 'Role is required';
    
    // Only require password when adding a new staff member
    if (!staff && !formData.password.trim()) {
      newErrors.password = 'Password is required for new staff';
    }
    
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
        {staff ? 'Save Changes' : 'Add Staff'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={staff ? 'Edit Staff Member' : 'Add New Staff Member'}
      footer={footer}
      disableOutsideClick={true}
    >
      <form onSubmit={handleSubmit} className={styles.modalForm} style={{ paddingBottom: '1rem' }}>
        <Input
          label="Name / Username"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Enter username"
        />
        
        <div className={inputStyles.inputWrapper}>
          <label className={inputStyles.label}>Role</label>
          <div 
            className={`${inputStyles.input} ${errors.role ? inputStyles.inputError : ''}`} 
            style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
          >
            <span style={{ color: formData.role ? 'inherit' : 'var(--color-text-tertiary)' }}>
              {formData.role || '--select role--'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.chevron}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            
            {isRoleDropdownOpen && (
              <ul className={styles.dropdownList} style={{ padding: '0.25rem 0', marginTop: '0.25rem' }}>
                {['Manager', 'Cashier', 'Warehouse'].map(option => (
                  <li 
                    key={option} 
                    className={`${styles.dropdownItem} ${formData.role === option ? styles.selected : ''}`}
                    style={{ padding: '0.35rem 1rem', fontSize: '0.875rem' }}
                    onClick={(e) => { 
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, role: option })); 
                      setIsRoleDropdownOpen(false); 
                    }}
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {errors.role && <span className={inputStyles.errorText}>{errors.role}</span>}
        </div>

        <Input
          label={staff ? "New Password (leave blank to keep current)" : "Initial Password"}
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder={staff ? "Enter new password" : "Enter temporary password"}
        />
      </form>
    </Modal>
  );
};

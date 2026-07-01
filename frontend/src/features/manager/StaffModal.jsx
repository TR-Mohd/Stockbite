import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import inputStyles from '../../components/ui/Input.module.css';
import styles from '../../styles/manager/ManagerDashboard.module.css';
import { formatPhoneNumber } from '../../utils/formatters';

export const StaffModal = ({ isOpen, onClose, onSave, staff = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: '',
    password: '',
    phone_number: '',
    email: '',
  });

  const [errors, setErrors] = useState({});
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name,
        username: staff.username || '',
        role: staff.role,
        password: '',
        phone_number: staff.phone_number || '',
        email: staff.email || '',
      });
    } else {
      setFormData({
        name: '',
        username: '',
        role: '',
        password: '',
        phone_number: '',
        email: '',
      });
    }
    setErrors({});
    setIsRoleDropdownOpen(false);
  }, [staff, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'phone_number') {
      finalValue = formatPhoneNumber(value, true);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
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
          label="Full Name"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Enter full name"
        />
        <Input
          label="Username"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          error={errors.username}
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
          type="text"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder={staff ? "Enter new password" : "Enter temporary password"}
        />
        
        <Input
          label="Phone Number"
          id="phone_number"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          error={errors.phone_number}
          placeholder="+62 8xx-xxxx-xxxx"
        />
        
        <Input
          label="Email"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="employee@example.com"
        />
      </form>
    </Modal>
  );
};

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../core/store/authStore';
import '../../styles/inventory/InventoryTable.css';
import styles from './ManagerDashboard.module.css';

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8000/manager/staff', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setStaffList(response.data);
      } catch (err) {
        console.error('Error fetching staff:', err);
        setError('Failed to load staff data');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStaff();
    }
  }, [token]);

  const toggleStatus = (id) => {
    setStaffList(prev => prev.map(staff => 
      staff.id === id 
        ? { ...staff, status: staff.status === 'Active' ? 'Inactive' : 'Active' }
        : staff
    ));
  };

  const handleEdit = (id) => {
    console.log(`Edit clicked for staff ${id}`);
    // No-op for now per requirements, but clickable
  };

  return (
    <div className={styles.dashboardContainer} style={{ minHeight: 'auto' }}>
      <div className={styles.dashboardContent}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Staff Management</h1>
            <p className={styles.subtitle}>Manage employee roles and access</p>
          </div>
          
          <button className="inventory-btn" style={{ 
            backgroundColor: 'var(--color-primary)', 
            color: 'white', 
            border: 'none', 
            padding: '0.75rem 1.5rem', 
            borderRadius: '8px', 
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Add Staff Member
          </button>
        </header>

        <div className="inventory-table-section" style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
          <div className="inventory-table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Last Active</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state-container">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="empty-state-icon">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <h3>No staff members found</h3>
                        <p>Get started by adding your first employee.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  staffList.map((staff) => (
                    <tr key={staff.id} style={{ opacity: staff.status === 'Inactive' ? 0.6 : 1 }}>
                      <td className="text-muted font-medium">{staff.id}</td>
                      <td className="font-medium">
                        {staff.name}
                      </td>
                      <td><span className="category-tag">{staff.role}</span></td>
                      <td className="text-muted text-sm">
                        {staff.last_active ? new Date(staff.last_active).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </td>
                      <td>
                        {staff.status === 'Active' ? (
                          <span className="status-normal">Active</span>
                        ) : (
                          <span style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: 'var(--color-error-bg, rgba(239, 68, 68, 0.1))',
                            color: 'var(--color-error, #ef4444)',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>Inactive</span>
                        )}
                      </td>
                      <td className="actions-cell text-right">
                        <div className="actions-group" style={{ justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                          <button 
                            className="icon-action-btn" 
                            title="Edit"
                            onClick={() => handleEdit(staff.id)}
                            style={{ 
                              border: '1px solid var(--color-border)', 
                              padding: '0.35rem 0.5rem', 
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--color-text-secondary)',
                              background: 'transparent'
                            }}
                          >
                            <EditIcon />
                          </button>
                          <button 
                            className="icon-action-btn text-error" 
                            title={staff.status === 'Active' ? 'Deactivate' : 'Activate'}
                            onClick={() => toggleStatus(staff.id)}
                            style={{ 
                              border: '1px solid var(--color-error, #ef4444)', 
                              padding: '0.25rem 0', 
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              color: 'var(--color-error, #ef4444)',
                              width: '85px',
                              textAlign: 'center',
                              background: 'transparent'
                            }}
                          >
                            {staff.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

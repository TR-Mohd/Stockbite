import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../core/store/authStore';
import '../../styles/inventory/InventoryTable.css';
import styles from '../../styles/manager/ManagerDashboard.module.css';
import { StaffModal } from './StaffModal';
import { Modal } from '../../components/ui/Modal';
import { InlineNotificationQueue } from '../../components/ui/InlineNotificationQueue';

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

export const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  const [notifications, setNotifications] = useState([]);
  
  const addNotification = (message) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    setNotifications(prev => [...prev, { id, message }]);
  };
  
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/manager/staff', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaffList(response.data);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchStaff();
    }
  }, [token, fetchStaff]);

  const toggleStatus = async (id) => {
    try {
      await axios.put(`http://localhost:8000/manager/staff/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const staff = staffList.find(s => s.id === id);
      if (staff) {
        addNotification(<span><strong>{staff.name}</strong> ({staff.id}) {staff.status === 'Active' ? 'deactivated' : 'activated'}.</span>);
      }
      fetchStaff();
    } catch (err) {
      console.error('Error toggling status:', err);
      alert(err.response?.data?.detail || 'Failed to toggle status');
    }
  };

  const handleEdit = (id) => {
    const staff = staffList.find(s => s.id === id);
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedStaff(null);
    setIsModalOpen(true);
  };

  const handleSaveStaff = async (formData) => {
    try {
      const payload = { ...formData };
      let newId;
      if (selectedStaff) {
        newId = selectedStaff.id;
        await axios.put(`http://localhost:8000/manager/staff/${selectedStaff.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        const response = await axios.post('http://localhost:8000/manager/staff', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        newId = response.data.id;
      }
      setIsModalOpen(false);
      addNotification(<span><strong>{payload.name}</strong> ({newId}) {selectedStaff ? 'updated' : 'added'}.</span>);
      fetchStaff();
    } catch (err) {
      console.error('Error saving staff:', err);
      alert(err.response?.data?.detail || 'Failed to save staff data');
    }
  };

  const confirmDelete = (staff) => {
    setStaffToDelete(staff);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!staffToDelete) return;
    try {
      await axios.delete(`http://localhost:8000/manager/staff/${staffToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addNotification(<span><strong>{staffToDelete.name}</strong> ({staffToDelete.id}) deleted.</span>);
      setIsDeleteModalOpen(false);
      setStaffToDelete(null);
      fetchStaff();
    } catch (err) {
      console.error('Error deleting staff:', err);
      alert(err.response?.data?.detail || 'Failed to delete staff member');
    }
  };

  const sortedStaffList = [...staffList].sort((a, b) => {
    if (a.name === user?.username) return -1;
    if (b.name === user?.username) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className={`${styles.dashboardContainer} ${styles.dashboardContainerAuto}`}>
      <div className={styles.dashboardContent}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Staff Management</h1>
            <p className={styles.subtitle}>Manage employee roles and access</p>
          </div>
          
          <div style={{ position: 'relative' }}>
            <InlineNotificationQueue notifications={notifications} onDismiss={removeNotification} />
            <button className={styles.primaryBtn} onClick={handleAdd}>
              Add Staff Member
            </button>
          </div>
        </header>

        <div className={`inventory-table-section ${styles.tableSection}`}>
          <div className="inventory-table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Last Active</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedStaffList.length === 0 ? (
                  <tr>
                    <td colSpan="8">
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
                  sortedStaffList.map((staff) => (
                    <tr key={staff.id} className={staff.status === 'Inactive' ? styles.inactiveRow : ''}>
                      <td className="text-muted font-medium">{staff.id}</td>
                      <td className="text-muted font-medium">
                        {staff.username || '-'}
                      </td>
                      <td className="font-medium">
                        <div className="tooltip-container" style={{ display: 'block', maxWidth: '200px' }}>
                          <div className="truncate-text">{staff.name ? staff.name.charAt(0).toUpperCase() + staff.name.slice(1) : ''}</div>
                          <div className="custom-tooltip">{staff.name ? staff.name.charAt(0).toUpperCase() + staff.name.slice(1) : ''}</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ fontWeight: '600' }}>{staff.phone_number || '-'}</span>
                          <span className="text-muted text-sm">{staff.email || ''}</span>
                        </div>
                      </td>
                      <td><span className="category-tag">{staff.role}</span></td>
                      <td className="text-muted text-sm">
                        {staff.last_active ? new Date(staff.last_active + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </td>
                      <td>
                        {staff.status === 'Active' ? (
                          <span className="status-normal">Active</span>
                        ) : (
                          <span className={styles.statusInactive}>Inactive</span>
                        )}
                      </td>
                      <td className="actions-cell text-right">
                        <div className="actions-group" style={{ justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                          <button 
                            className={`icon-action-btn ${styles.editActionBtn}`}
                            title="Edit"
                            onClick={() => handleEdit(staff.id)}
                          >
                            <EditIcon />
                          </button>
                          <button 
                            className={`icon-action-btn ${styles.toggleActionBtn} ${staff.status !== 'Active' ? styles.activateBtn : ''}`}
                            title={staff.status === 'Active' ? 'Deactivate' : 'Activate'}
                            onClick={() => toggleStatus(staff.id)}
                          >
                            {staff.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                          {(() => {
                            const isSelf = staff.name === user?.username;
                            const isProtectedManager = staff.role === 'Manager' && !user?.is_super_admin;
                            const hasHistory = staff.has_transactions;
                            
                            const isDisabled = isSelf || isProtectedManager || hasHistory;
                            
                            let tooltip = "Delete Employee";
                            if (isSelf) tooltip = "Cannot delete yourself";
                            else if (isProtectedManager) tooltip = "Cannot delete active managers";
                            else if (hasHistory) tooltip = "Cannot delete staff with transaction history. Please deactivate instead.";

                            return (
                              <button 
                                className={`icon-action-btn ${styles.editActionBtn}`}
                                title={tooltip}
                                style={{ 
                                  color: isDisabled ? 'var(--color-text-tertiary)' : 'var(--color-error)',
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  opacity: isDisabled ? 0.5 : 1
                                }}
                                onClick={() => !isDisabled && confirmDelete(staff)}
                                disabled={isDisabled}
                              >
                                <TrashIcon />
                              </button>
                            );
                          })()}
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
      <StaffModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveStaff} 
        staff={selectedStaff} 
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Fire Employee"
        size="small"
      >
        <div style={{ padding: '0.5rem 1rem 1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '50%', 
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-error)',
              marginBottom: '0.5rem'
            }}>
              <TrashIcon />
            </div>
            <h3 style={{ margin: 0, color: 'var(--color-text)' }}>Fire Employee?</h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              Are you sure you want to fire <strong>{staffToDelete?.name}</strong>?<br/>
              This action cannot be undone and will permanently remove their access.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button 
              style={{ 
                backgroundColor: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)',
                padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem'
              }}
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              style={{ 
                backgroundColor: 'var(--color-error)', color: 'white', border: 'none',
                padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem'
              }}
              onClick={executeDelete}
            >
              Yes, Fire Employee
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

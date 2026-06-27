import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../core/store/authStore';
import '../../styles/inventory/InventoryTable.css';
import styles from '../../styles/manager/ManagerDashboard.module.css';
import { StaffModal } from './StaffModal';

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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

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
      if (selectedStaff) {
        await axios.put(`http://localhost:8000/manager/staff/${selectedStaff.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:8000/manager/staff', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      console.error('Error saving staff:', err);
      alert(err.response?.data?.detail || 'Failed to save staff data');
    }
  };

  return (
    <div className={`${styles.dashboardContainer} ${styles.dashboardContainerAuto}`}>
      <div className={styles.dashboardContent}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Staff Management</h1>
            <p className={styles.subtitle}>Manage employee roles and access</p>
          </div>
          
          <button className={styles.primaryBtn} onClick={handleAdd}>
            Add Staff Member
          </button>
        </header>

        <div className={`inventory-table-section ${styles.tableSection}`}>
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
                    <tr key={staff.id} className={staff.status === 'Inactive' ? styles.inactiveRow : ''}>
                      <td className="text-muted font-medium">EMP-{staff.id.substring(0, 6).toUpperCase()}</td>
                      <td className="font-medium">
                        {staff.name}
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
                            className={`icon-action-btn text-error ${styles.toggleActionBtn}`}
                            title={staff.status === 'Active' ? 'Deactivate' : 'Activate'}
                            onClick={() => toggleStatus(staff.id)}
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
      <StaffModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveStaff} 
        staff={selectedStaff} 
      />
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/inventory/InventoryTable.css';
import styles from '../../styles/manager/ManagerDashboard.module.css';
import { SupplierModal } from './SupplierModal';
import { capitalize, formatPhoneNumber } from '../../utils/formatters';
import { REGIONS } from '../../constants/regions';
import { generateSupplierId } from '../../utils/idGenerator';
import { InlineNotificationQueue } from '../../components/ui/InlineNotificationQueue';

export const SupplierDirectory = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [notifications, setNotifications] = useState([]);
  
  const addNotification = (message) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    setNotifications(prev => [...prev, { id, message }]);
  };
  
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const token = localStorage.getItem('token');

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/suppliers/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      } else {
        throw new Error('Failed to fetch suppliers');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchSuppliers();
    }
  }, [token, fetchSuppliers]);

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleEditSupplier = (supplier) => {
    const code = supplier.region || (supplier.id ? supplier.id.split('-')[1] : 'NAT');
    const coverage = code === 'NAT' ? 'National' : 'Regional';
    const regionCode = code === 'NAT' ? '' : code;

    setSelectedSupplier({
      ...supplier,
      coverage,
      regionCode
    });
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async (formData) => {
    try {
      const isEditing = !!selectedSupplier;
      
      let payload = { ...formData };
      if (payload.specialization) {
        payload.specialization = payload.specialization.toLowerCase();
      }
      
      if (payload.phone) {
        payload.phone = formatPhoneNumber(payload.phone, !!payload.contact_person?.trim());
      }
      
      if (!isEditing) {
        payload.id = generateSupplierId(payload.coverage, payload.regionCode, suppliers);
      }
      payload.region = payload.coverage === 'National' ? 'NAT' : payload.regionCode;
      
      const url = isEditing 
        ? `http://localhost:8000/suppliers/${selectedSupplier.id}` 
        : 'http://localhost:8000/suppliers/';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setIsModalOpen(false);
        addNotification(<span><strong>{payload.name}</strong> ({payload.id || selectedSupplier.id}) {isEditing ? 'updated' : 'added'}.</span>);
        fetchSuppliers();
      } else {
        console.error('Failed to save supplier');
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const handleToggleStatus = async (supplierId) => {
    try {
      const response = await fetch(`http://localhost:8000/suppliers/${supplierId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (supplier) {
          addNotification(<span><strong>{supplier.name}</strong> ({supplier.id}) {supplier.is_active ? 'deactivated' : 'activated'}.</span>);
        }
        fetchSuppliers();
      } else {
        console.error('Failed to toggle status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };
  return (
    <div className={styles.dashboardContainer} style={{ minHeight: 'auto' }}>
      <div className={styles.dashboardContent}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Supplier Directory</h1>
            <p className={styles.subtitle}>Manage your vendors and supply chain</p>
          </div>
          
          <div style={{ position: 'relative' }}>
            <InlineNotificationQueue notifications={notifications} onDismiss={removeNotification} />
            <button className="inventory-btn" style={{ 
              backgroundColor: 'var(--color-primary)', 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '8px', 
              fontWeight: '600',
              cursor: 'pointer'
            }} onClick={handleAddSupplier}>
              Add Supplier
            </button>
          </div>
        </header>

        <div className="inventory-table-section" style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
          <div className="inventory-table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Supplier ID</th>
                  <th>Company Name</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>Category Supplied</th>
                  <th>Region</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state-container">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="empty-state-icon">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <h3>No suppliers yet</h3>
                        <p>Get started by adding your first supplier.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr key={supplier.id} className={!supplier.is_active ? styles.inactiveRow : ''}>
                      <td className="text-muted font-medium" title={supplier.id}>
                        <div className="truncate-text" style={{ maxWidth: '120px' }}>{supplier.id}</div>
                      </td>
                      <td className="font-medium">
                        <div className="tooltip-container" style={{ display: 'block', maxWidth: '200px' }}>
                          <div className="truncate-text">{supplier.name}</div>
                          <div className="custom-tooltip">{supplier.name}</div>
                        </div>
                      </td>
                      <td>{supplier.contact_person || '-'}</td>
                      <td className="text-muted">{supplier.phone || '-'}</td>
                      <td><span className="category-tag">{capitalize(supplier.specialization) || 'General'}</span></td>
                      <td>
                        {(() => {
                          const code = supplier.region || (supplier.id && supplier.id.startsWith('SUP-') ? supplier.id.split('-')[1] : null);
                          if (!code) return '-';
                          if (code === 'NAT') return 'National (Multiple)';
                          const region = REGIONS.find(r => r.code === code);
                          return region ? region.label : code;
                        })()}
                      </td>
                      <td>
                        {supplier.is_active ? (
                          <span className="status-normal">Active</span>
                        ) : (
                          <span className={styles.statusInactive}>Inactive</span>
                        )}
                      </td>
                      <td className="actions-cell text-right">
                        <div className="actions-group" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                          <button 
                            className={`icon-action-btn ${styles.editActionBtn}`}
                            title="Edit"
                            onClick={() => handleEditSupplier(supplier)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button 
                            className={`icon-action-btn text-error ${styles.toggleActionBtn}`}
                            style={{ 
                              color: supplier.is_active ? 'var(--color-error)' : 'var(--color-success, #10b981)',
                              borderColor: supplier.is_active ? 'var(--color-error)' : 'var(--color-success, #10b981)'
                            }}
                            onClick={() => handleToggleStatus(supplier.id)}
                          >
                            {supplier.is_active ? 'Deactivate' : 'Activate'}
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
      
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSupplier}
        supplier={selectedSupplier}
      />
    </div>
  );
};

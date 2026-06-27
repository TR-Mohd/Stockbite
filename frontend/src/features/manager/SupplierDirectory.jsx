import React from 'react';
import '../../styles/inventory/InventoryTable.css';
import styles from './ManagerDashboard.module.css';

const mockSuppliers = [
  { id: 'SUP-001', company: 'Global Meats Inc.', contact: 'John Smith', phone: '+62 812-3456-7890', category: 'Meat', status: 'Active' },
  { id: 'SUP-002', company: 'Fresh Farms Produce', contact: 'Sarah Johnson', phone: '+62 813-9876-5432', category: 'Produce', status: 'Active' },
  { id: 'SUP-003', company: 'Sunrise Bakery Supplies', contact: 'Michael Chen', phone: '+62 811-2222-3333', category: 'Bakery', status: 'Inactive' },
  { id: 'SUP-004', company: 'Oceanic Beverages', contact: 'David Lee', phone: '+62 815-5555-6666', category: 'Beverages', status: 'Active' },
  { id: 'SUP-005', company: 'Premium Dairy Co.', contact: 'Emma Wilson', phone: '+62 818-7777-8888', category: 'Dairy', status: 'Active' },
];

export const SupplierDirectory = () => {
  return (
    <div className={styles.dashboardContainer} style={{ minHeight: 'auto' }}>
      <div className={styles.dashboardContent}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Supplier Directory</h1>
            <p className={styles.subtitle}>Manage your vendors and supply chain</p>
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
            Add Supplier
          </button>
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
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan="6">
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
                  mockSuppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td className="text-muted font-medium">{supplier.id}</td>
                      <td className="font-medium">{supplier.company}</td>
                      <td>{supplier.contact}</td>
                      <td className="text-muted">{supplier.phone}</td>
                      <td><span className="category-tag">{supplier.category}</span></td>
                      <td>
                        {supplier.status === 'Active' ? (
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

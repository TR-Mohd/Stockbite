import React, { useState } from 'react';
import { SupplierDirectory } from './SupplierDirectory';
import { PurchaseOrderHistory } from './PurchaseOrderHistory';
import { DraftPOCreator } from './DraftPOCreator';
import { useAuthStore } from '../../core/store/authStore';
import { GlobalHeader } from '../../components/layout/GlobalHeader';
import headerStyles from '../../components/layout/GlobalHeader.module.css';
import { NavLink } from 'react-router-dom';
import styles from './suppliers.module.css';

const TABS = [
  { id: 'directory', label: '🏢 Supplier Directory' },
  { id: 'orders', label: '📋 Purchase Orders' },
  { id: 'draft', label: '✏️ Draft PO' },
];

export const SuppliersDashboard = () => {
  const { user } = useAuthStore();
  const isWarehouse = user?.role === 'Warehouse';
  
  const [activeTab, setActiveTab] = useState(isWarehouse ? 'draft' : 'directory');

  const availableTabs = TABS.filter(tab => {
    if (isWarehouse) return tab.id === 'draft' || tab.id === 'orders';
    return true;
  });

  const handleOrderCreated = () => {
    // Switch to the purchase orders tab after creating a draft PO
    setActiveTab('orders');
  };

  return (
    <div className={styles.dashboardContainer}>
      <GlobalHeader title="Suppliers & Procurement">
        {user?.role === 'Warehouse' && (
          <>
            <NavLink 
              to="/inventory" 
              className={({ isActive }) => isActive ? `${headerStyles.navLink} ${headerStyles.activeLink}` : headerStyles.navLink}
            >
              Inventory
            </NavLink>
            <NavLink 
              to="/suppliers" 
              className={({ isActive }) => isActive ? `${headerStyles.navLink} ${headerStyles.activeLink}` : headerStyles.navLink}
            >
              Suppliers
            </NavLink>
          </>
        )}
      </GlobalHeader>

      {/* Header */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerInfo}>
          <h1>Suppliers & Procurement</h1>
          <p>Manage your vendor directory and purchase orders</p>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className={styles.dashboardContent}>
        {activeTab === 'directory' && <SupplierDirectory />}
        {activeTab === 'orders' && <PurchaseOrderHistory />}
        {activeTab === 'draft' && <DraftPOCreator onOrderCreated={handleOrderCreated} />}
      </div>
    </div>
  );
};

export default SuppliersDashboard;

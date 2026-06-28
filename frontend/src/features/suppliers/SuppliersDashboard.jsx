import React, { useState } from 'react';
import { SupplierDirectory } from './SupplierDirectory';
import { PurchaseOrderHistory } from './PurchaseOrderHistory';
import { DraftPOCreator } from './DraftPOCreator';
import styles from './suppliers.module.css';

const TABS = [
  { id: 'directory', label: '🏢 Supplier Directory' },
  { id: 'orders', label: '📋 Purchase Orders' },
  { id: 'draft', label: '✏️ Draft PO' },
];

export const SuppliersDashboard = () => {
  const [activeTab, setActiveTab] = useState('directory');

  const handleOrderCreated = () => {
    // Switch to the purchase orders tab after creating a draft PO
    setActiveTab('orders');
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerInfo}>
          <h1>Suppliers & Procurement</h1>
          <p>Manage your vendor directory and purchase orders</p>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          {TABS.map((tab) => (
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

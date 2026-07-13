import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SupplierDirectory } from './SupplierDirectory';
import { PurchaseOrderHistory } from '../suppliers/PurchaseOrderHistory';
import styles from '../suppliers/suppliers.module.css';

const TABS = [
  { id: 'directory', label: '🏢 Supplier Directory' },
  { id: 'orders', label: '📋 Purchase Orders' }
];

export const ManagerSuppliersDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Read initial tab from URL query param, default to directory
  const initialTab = searchParams.get('tab') || 'directory';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Keep state in sync with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  return (
    <div className={styles.dashboardContainer} style={{ background: 'var(--color-bg-base)' }}>
      {/* Unified Header */}
      <div className={styles.dashboardHeader} style={{ padding: 'var(--spacing-6)' }}>
        <div className={styles.headerInfo}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Suppliers & Procurement</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Manage your vendor directory and purchase orders</p>
        </div>

        {/* Tab Navigation (Pill Pattern) */}
        <div className={styles.pillTabsContainer}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.pillTab} ${activeTab === tab.id ? styles.activePillTab : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className={styles.dashboardContent} style={{ padding: '0', background: 'transparent' }}>
        {activeTab === 'directory' && <SupplierDirectory />}
        {activeTab === 'orders' && (
          <div style={{ padding: '0 var(--spacing-6)' }}>
            <PurchaseOrderHistory />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerSuppliersDashboard;

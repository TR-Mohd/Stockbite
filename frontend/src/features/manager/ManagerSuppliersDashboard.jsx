import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SupplierDirectory } from './SupplierDirectory';
import { PurchaseOrderHistory } from '../suppliers/PurchaseOrderHistory';
import styles from '../suppliers/suppliers.module.css';
import '../../styles/inventory/InventoryDashboard.css';

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
      <div className={styles.pillTabsContainer} style={{ marginTop: 'var(--spacing-6)', marginLeft: 'var(--spacing-8)' }}>
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

      {/* Content Area */}
      <div className={styles.dashboardContent} style={{ padding: 'var(--spacing-6) var(--spacing-8)', background: 'transparent' }}>
        {activeTab === 'directory' && <SupplierDirectory />}
        {activeTab === 'orders' && <PurchaseOrderHistory />}
      </div>
    </div>
  );
};

export default ManagerSuppliersDashboard;

import React from 'react';
import { PurchaseOrderHistory } from './PurchaseOrderHistory';
import { useAuthStore } from '../../core/store/authStore';
import { GlobalHeader } from '../../components/layout/GlobalHeader';
import headerStyles from '../../components/layout/GlobalHeader.module.css';
import { NavLink } from 'react-router-dom';
import styles from './suppliers.module.css';

export const SuppliersDashboard = () => {
  const { user } = useAuthStore();
  
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
          <h1>Purchase Orders</h1>
          <p>Track and manage supplier purchase orders</p>
        </div>
      </div>

      {/* Content Area */}
      <div className={styles.dashboardContent}>
        <PurchaseOrderHistory />
      </div>
    </div>
  );
};

export default SuppliersDashboard;

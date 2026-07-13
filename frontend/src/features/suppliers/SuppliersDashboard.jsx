import React from 'react';
import { PurchaseOrderHistory } from './PurchaseOrderHistory';
import { useAuthStore } from '../../core/store/authStore';
import { GlobalHeader } from '../../components/layout/GlobalHeader';
import headerStyles from '../../components/layout/GlobalHeader.module.css';
import { NavLink } from 'react-router-dom';
import styles from './suppliers.module.css';
import '../../styles/inventory/InventoryDashboard.css';

export const SuppliersDashboard = () => {
  const { user } = useAuthStore();
  
  return (
    <div className="inventory-dashboard">
      <GlobalHeader title="Purchase Orders">
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
              Purchase Orders
            </NavLink>
          </>
        )}
      </GlobalHeader>

      {/* Content Area */}
      <div className="inventory-main-container">
        <div className="inventory-table-section" style={{ background: 'transparent', border: 'none', padding: 0 }}>
          <PurchaseOrderHistory />
        </div>
      </div>
    </div>
  );
};

export default SuppliersDashboard;

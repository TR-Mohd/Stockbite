import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { GlobalHeader } from './GlobalHeader';
import headerStyles from './GlobalHeader.module.css';
import styles from './ManagerLayout.module.css';

// --- ICONS ---
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const ManagerLayout = () => {
  // TODO: role guard - add explicit role checking here if not fully covered by routing level guard

  return (
    <div className={styles.layoutContainer}>
      {/* Global Header / Top Navigation for Manager */}
      <GlobalHeader title="Stockbite BI">
        <NavLink 
          to="/manager/dashboard" 
          className={({ isActive }) => isActive ? `${headerStyles.navLink} ${headerStyles.activeLink}` : headerStyles.navLink}
        >
          Dashboard
        </NavLink>
        <NavLink 
          to="/manager/orders" 
          className={({ isActive }) => isActive ? `${headerStyles.navLink} ${headerStyles.activeLink}` : headerStyles.navLink}
        >
          Order History
        </NavLink>
        <NavLink 
          to="/manager/suppliers" 
          className={({ isActive }) => isActive ? `${headerStyles.navLink} ${headerStyles.activeLink}` : headerStyles.navLink}
        >
          Suppliers
        </NavLink>
        <NavLink 
          to="/manager/staff" 
          className={({ isActive }) => isActive ? `${headerStyles.navLink} ${headerStyles.activeLink}` : headerStyles.navLink}
        >
          Staff Management
        </NavLink>
        <NavLink 
          to="/manager/menu-engineering" 
          className={({ isActive }) => isActive ? `${headerStyles.navLink} ${headerStyles.activeLink}` : headerStyles.navLink}
        >
          Menu Engineering
        </NavLink>
        <NavLink 
          to="/manager/menu" 
          className={({ isActive }) => isActive ? `${headerStyles.navLink} ${headerStyles.activeLink}` : headerStyles.navLink}
        >
          Menu Management
        </NavLink>
      </GlobalHeader>

      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
};

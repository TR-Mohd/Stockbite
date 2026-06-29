import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../core/store/authStore';
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
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // TODO: role guard - add explicit role checking here if not fully covered by routing level guard

  return (
    <div className={styles.layoutContainer}>
      {/* Global Header / Top Navigation for Manager */}
      <header className={styles.topNav}>
        <div className={styles.navBrand}>Stockbite BI</div>
        
        <nav className={styles.navLinks}>
          <NavLink 
            to="/manager/dashboard" 
            className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/manager/suppliers" 
            className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
          >
            Suppliers
          </NavLink>
          <NavLink 
            to="/manager/staff" 
            className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
          >
            Staff Management
          </NavLink>
        </nav>

        <div className={styles.navUser}>
          <span className={styles.userName}>
            Hi, {user?.username || 'Manager'}
          </span>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
            <LogoutIcon />
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
};

import React from 'react';
import { useAuthStore } from '../../core/store/authStore';
import { useNavigate } from 'react-router-dom';
import styles from './GlobalHeader.module.css';

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const GlobalHeader = ({ children, title = 'Stockbite BI' }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={styles.globalHeader}>
      <div className={styles.headerBrand}>{title}</div>
      
      <nav className={styles.headerNav}>
        {children}
      </nav>

      <div className={styles.headerUser}>
        {user && (
          <span className={styles.userName}>
            Hi, {user.username || user.name || 'User'}
          </span>
        )}
        <button className={styles.logoutBtn} onClick={handleLogout} title="Logout" aria-label="Log out">
          <LogoutIcon />
        </button>
      </div>
    </header>
  );
};

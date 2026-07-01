import React, { useState } from 'react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const formatName = (name) => {
    if (!name) return 'User';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1]}`;
    }
    return parts[0];
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hasChildren = React.Children.count(children) > 0;

  return (
    <header className={styles.topNav}>
      <div className={styles.navLeft}>
        {hasChildren && (
          <button 
            className={styles.hamburgerBtn} 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
        )}
        <div className={styles.navBrand}>{title}</div>
      </div>
      
      <nav className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ''}`} onClick={() => setIsMenuOpen(false)}>
        {children}
      </nav>

      <div className={styles.navUser}>
        <span className={styles.userName} title={user?.username || 'User'}>
          Hi, {formatName(user?.username)}
        </span>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
          <LogoutIcon />
        </button>
      </div>
    </header>
  );
};

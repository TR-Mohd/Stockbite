import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../core/store/authStore';

export const InventoryDashboard = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '50px', height: '100vh', backgroundColor: '#f9fafb', color: '#1f2937' }}>
      <h1>Inventory Dashboard</h1>
      <p style={{ marginBottom: '20px' }}>Inventory Management Module - Coming Soon</p>
      <button 
        onClick={handleLogout}
        style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Logout
      </button>
    </div>
  );
};

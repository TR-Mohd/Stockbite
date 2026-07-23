import React, { useState, useEffect, useCallback } from 'react';
import api from '../../core/api/axios';
import '../../styles/inventory/InventoryTable.css';
import styles from '../../styles/manager/ManagerDashboard.module.css';
import { MenuModal } from './MenuModal';

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const MenuManagement = () => {
  const [menuList, setMenuList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/manager/menu');
      setMenuList(response.data);
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/manager/menu/${id}`);
      fetchMenu();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert(err.response?.data?.detail || 'Failed to delete menu item');
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await api.get(`/manager/menu/${id}`);
      setSelectedMenu(response.data);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching menu item details:', err);
      alert(err.response?.data?.detail || 'Failed to fetch menu item details');
    }
  };

  const handleAdd = () => {
    setSelectedMenu(null);
    setIsModalOpen(true);
  };

  const handleSaveMenu = async (formData) => {
    try {
      if (selectedMenu) {
        await api.put(`/manager/menu/${selectedMenu.id}`, formData);
      } else {
        await api.post('/manager/menu', formData);
      }
      setIsModalOpen(false);
      fetchMenu();
    } catch (err) {
      console.error('Error saving menu item:', err);
      alert(err.response?.data?.detail || 'Failed to save menu item');
    }
  };

  return (
    <div className={`${styles.dashboardContainer} ${styles.dashboardContainerAuto}`}>
      <div className={styles.dashboardContent}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Menu Management</h1>
            <p className={styles.subtitle}>Manage POS products, categories, and pricing</p>
          </div>
          
          <button className={styles.primaryBtn} onClick={handleAdd}>
            Add Menu Item
          </button>
        </header>

        <div className={`inventory-table-section ${styles.tableSection}`}>
          <div className="inventory-table-container">
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Loading menu items...</div>
            ) : (
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th className="text-right">Price (Rp)</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {menuList.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <div className="empty-state-container">
                          <h3>No menu items found</h3>
                          <p>Get started by adding your first product.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    menuList.map((item) => (
                      <tr key={item.id} className={!item.is_active ? styles.inactiveRow : ''}>
                        <td className="text-muted font-medium">{item.id.substring(0, 8)}</td>
                        <td className="font-medium">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {item.image && (
                              <img src={item.image} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                            )}
                            {item.name}
                          </div>
                        </td>
                        <td><span className="category-tag">{item.category}</span></td>
                        <td className="text-right">{item.price.toLocaleString('id-ID')}</td>
                        <td>
                          {item.is_active ? (
                            <span className="status-normal">Active</span>
                          ) : (
                            <span className={styles.statusInactive}>Inactive</span>
                          )}
                        </td>
                        <td className="actions-cell text-right">
                          <div className="actions-group" style={{ justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                            <button 
                              className={`icon-action-btn ${styles.editActionBtn}`}
                              title="Edit"
                              onClick={() => handleEdit(item.id)}
                            >
                              <EditIcon />
                            </button>
                            <button 
                              className={`icon-action-btn text-error ${styles.toggleActionBtn}`}
                              title="Delete"
                              onClick={() => handleDelete(item.id)}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      <MenuModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveMenu} 
        menuItem={selectedMenu} 
      />
    </div>
  );
};

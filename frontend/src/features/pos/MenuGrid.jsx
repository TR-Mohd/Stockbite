import React, { useState, useEffect } from 'react';
import MenuItemCard from './MenuItemCard';
import axiosInstance from '../../core/api/axios';
import '../../styles/pos/MenuGrid.css';

const MenuGrid = ({ onAddToCart }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axiosInstance.get('/menu'); 
        setMenuItems(response.data);
      } catch (error) {
        console.error("Failed to fetch menu data:", error);
        
        setMenuItems([
          { id: 1, name: 'Special Burger', price: 45000, stock: 10 },
          { id: 2, name: 'French Fries', price: 20000, stock: 5 },
          { id: 3, name: 'Iced Coffee', price: 18000, stock: 0 }, 
          { id: 4, name: 'Grilled Chicken', price: 35000, stock: 20 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  if (loading) {
    return <div className="menu-loading-state">Loading menu...</div>;
  }

  return (
    <div className="menu-grid-container">
      {menuItems.map((item) => (
        <MenuItemCard 
          key={item.id} 
          item={item} 
          onAddToCart={onAddToCart} 
        />
      ))}
    </div>
  );
};

export default MenuGrid;
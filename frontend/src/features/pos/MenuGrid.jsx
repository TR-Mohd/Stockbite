import React, { useState, useEffect, useMemo } from 'react';
import MenuItemCard from './MenuItemCard';
import axiosInstance from '../../core/api/axios';
import '../../styles/POS/MenuGrid.css';

const CATEGORY_MAP = {
  all: 'All Product',
  food: 'Foods',
  beverage: 'Beverage',
  other: 'Other',
};

const MenuGrid = ({ onAddToCart, onUpdateQuantity, searchQuery, cartItems }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axiosInstance.get('/pos/menu');
        setMenuItems(response.data);
      } catch (error) {
        console.error('Failed to fetch menu data:', error);
        // Fallback data for development
        setMenuItems([
          { id: 1, name: 'Special Burger', price: 45000, stock: 10, category: 'food', image: null },
          { id: 2, name: 'French Fries', price: 20000, stock: 5, category: 'food', image: null },
          { id: 3, name: 'Iced Coffee', price: 18000, stock: 0, category: 'beverage', image: null },
          { id: 4, name: 'Grilled Chicken', price: 35000, stock: 20, category: 'food', image: null },
          { id: 5, name: 'Mineral Water', price: 8000, stock: 50, category: 'beverage', image: null },
          { id: 6, name: 'Chocolate Cake', price: 28000, stock: 8, category: 'food', image: null },
          { id: 7, name: 'Orange Juice', price: 15000, stock: 12, category: 'beverage', image: null },
          { id: 8, name: 'Napkins Pack', price: 5000, stock: 100, category: 'other', image: null },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: menuItems.length, food: 0, beverage: 0, other: 0 };
    menuItems.forEach((item) => {
      const cat = (item.category || 'other').toLowerCase();
      if (cat === 'food' || cat === 'foods' || cat === 'main') {
        counts.food += 1;
      } else if (cat === 'beverage' || cat === 'beverages' || cat === 'drink' || cat === 'drinks') {
        counts.beverage += 1;
      } else {
        counts.other += 1;
      }
    });
    return counts;
  }, [menuItems]);

  // Normalize category for filtering
  const normalizeCategory = (cat) => {
    const lower = (cat || 'other').toLowerCase();
    if (['food', 'foods', 'main'].includes(lower)) return 'food';
    if (['beverage', 'beverages', 'drink', 'drinks'].includes(lower)) return 'beverage';
    return 'other';
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    let items = menuItems;

    // Category filter
    if (activeCategory !== 'all') {
      items = items.filter((item) => normalizeCategory(item.category) === activeCategory);
    }

    // Search filter
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter((item) => item.name.toLowerCase().includes(q));
    }

    return items;
  }, [menuItems, activeCategory, searchQuery]);

  // Check if item is in cart for the blue border highlight
  const isItemInCart = (itemId) => {
    return cartItems.some(cartItem => cartItem.id === itemId);
  };

  if (loading) {
    return <div className="menu-loading-state">Loading menu...</div>;
  }

  return (
    <>
      {/* Category Tabs */}
      <div className="menu-category-tabs" role="tablist" aria-label="Product categories">
        {Object.entries(CATEGORY_MAP).map(([key, label]) => (
          <button
            key={key}
            className={`menu-category-tab ${activeCategory === key ? 'active' : ''}`}
            onClick={() => setActiveCategory(key)}
            role="tab"
            aria-selected={activeCategory === key}
            id={`tab-${key}`}
          >
            {label}
            <span className="menu-category-count">({categoryCounts[key] || 0} items)</span>
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="menu-grid-container" role="tabpanel" aria-labelledby={`tab-${activeCategory}`}>
        {filteredItems.length === 0 ? (
          <div className="menu-empty-state">No items found.</div>
        ) : (
          filteredItems.map((item) => {
            const cartItem = cartItems.find((c) => c.id === item.id);
            const cartQty = cartItem ? cartItem.qty : 0;
            return (
              <MenuItemCard
                key={item.id}
                item={item}
                onAddToCart={onAddToCart}
                onUpdateQuantity={onUpdateQuantity}
                cartQty={cartQty}
                isSelected={cartQty > 0}
              />
            );
          })
        )}
      </div>
    </>
  );
};

export default MenuGrid;
import React from 'react';
import '../../styles/pos/MenuItemCard.css';

const MenuItemCard = ({ item, onAddToCart }) => {
  const isOutOfStock = item.stock <= 0;

  return (
    <div
      className={`menu-item-card ${isOutOfStock ? 'out-of-stock' : ''}`}
      onClick={() => !isOutOfStock && onAddToCart(item)}
    >
      <h3 className="menu-item-title">{item.name}</h3>
      <p className="menu-item-price">Rp {item.price?.toLocaleString('id-ID')}</p>
      
      {isOutOfStock && (
        <span className="menu-item-stock-out">Out of Stock</span>
      )}
    </div>
  );
};

export default MenuItemCard;
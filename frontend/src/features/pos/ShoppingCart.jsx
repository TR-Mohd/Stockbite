import React from 'react';
import '../../styles/POS/ShoppingCart.css';

const ShoppingCart = ({ cartItems, updateQuantity, removeItem, updateNote }) => {
  if (cartItems.length === 0) {
    return (
      <div className="cart-empty-state">
          <p>Cart is empty.</p>
      </div>
    );
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.qty), 0);
  };

  return (
    <div className="cart-container">
      <ul className="cart-item-list">
        {cartItems.map((item) => (
          <li key={item.id} className="cart-item">
            <div className="cart-item-header">
              <span className="cart-item-title">{item.name}</span>
              <span className="cart-item-price">Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
            </div>
            
            <div className="cart-item-controls">
              <div className="cart-qty-controls">
                <button onClick={() => updateQuantity(item.id, item.qty - 1)} className="btn-qty">-</button>
                <span className="cart-qty-value">{item.qty}</span>
                <button onClick={() => updateQuantity(item.id, item.qty + 1)} className="btn-qty">+</button>
              </div>

              <button onClick={() => removeItem(item.id)} className="btn-remove">
                Remove
              </button>
            </div>

            <input 
              type="text" 
              placeholder="Notes (optional)..." 
              value={item.notes || ''}
              onChange={(e) => updateNote(item.id, e.target.value)}
              className="input-note"
            />
          </li>
        ))}
      </ul>

      <div className="cart-summary">
        <h3>
          <span>Total:</span>
          <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
        </h3>
      </div>
    </div>
  );
};

export default ShoppingCart;
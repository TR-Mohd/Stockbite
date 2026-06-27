import React from 'react';
import '../../styles/POS/ShoppingCart.css';

const ShoppingCart = ({ cartItems, updateQuantity, removeItem }) => {
  const getPlaceholderImage = (category) => {
    const lower = (category || 'other').toLowerCase();
    if (['food', 'foods', 'main'].includes(lower)) return '/placeholder-food.png';
    if (['beverage', 'beverages', 'drink', 'drinks'].includes(lower)) return '/placeholder-beverage.png';
    return '/placeholder-other.png';
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty-state">
        <p>Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <ul className="cart-item-list">
        {cartItems.map((item) => {
          const formattedTotal = (item.price * item.qty).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          return (
            <li key={item.id} className="cart-item">
              {/* Thumbnail */}
              <div className="cart-item-thumb">
                <img
                  src={item.image || getPlaceholderImage(item.category)}
                  alt={item.name}
                  loading="lazy"
                />
              </div>

              {/* Details */}
              <div className="cart-item-details">
                <div className="cart-item-top">
                  <p className="cart-item-name">{item.name}</p>
                  <button
                    className="btn-remove-item"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name} from cart`}
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="cart-item-bottom">
                  <div className="cart-qty-controls">
                    <button
                      className="btn-qty btn-minus"
                      onClick={() => updateQuantity(item.id, item.qty - 1)}
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                    <span className="cart-qty-value">{item.qty}</span>
                    <button
                      className="btn-qty btn-plus"
                      onClick={() => updateQuantity(item.id, item.qty + 1)}
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                  </div>
                  <p className="cart-item-price">
                    Rp {formattedTotal}
                  </p>

              </div>
            </div>
          </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ShoppingCart;
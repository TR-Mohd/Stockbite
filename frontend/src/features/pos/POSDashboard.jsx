import React, { useState } from 'react';
import MenuGrid from './MenuGrid';
import ShoppingCart from './ShoppingCart';
import CheckoutModal from './CheckoutModal';
import '../../styles/pos/POSDashboard.css';

const POSDashboard = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddToCart = (item) => {
    setCartItems((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) => cartItem.id === item.id ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem);
      } else {
        return [...prevCart, { ...item, qty: 1, notes: '' }];
      }
    });
  };

  const handleUpdateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCartItems((prevCart) => prevCart.map((item) => item.id === id ? { ...item, qty: newQty } : item));
  };

  const handleRemoveItem = (id) => {
    setCartItems((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const handleUpdateNote = (id, note) => {
    setCartItems((prevCart) => prevCart.map((item) => item.id === id ? { ...item, notes: note } : item));
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.qty), 0);

  const handleCheckoutSuccess = () => {
    setIsModalOpen(false);
    setCartItems([]);
    alert("Payment Successful! Order has been processed.");
  };

  return (
    <div className="pos-layout">
      
      <section className="pos-menu-section">
        <header className="pos-header">
          <h1>Cashier POS</h1>
          <p>Select items to add to the current order.</p>
        </header>
        <MenuGrid onAddToCart={handleAddToCart} />
      </section>

      <aside className="pos-cart-section">
        <h2>Current Order</h2>
        
        <ShoppingCart 
          cartItems={cartItems} 
          updateQuantity={handleUpdateQuantity}
          removeItem={handleRemoveItem}
          updateNote={handleUpdateNote}
        />

        <button 
            onClick={() => setIsModalOpen(true)}
            disabled={cartItems.length === 0} 
            className={`btn-proceed-checkout ${cartItems.length === 0 ? 'disabled' : ''}`}
        >
            Proceed to Checkout
        </button>
      </aside>

      <CheckoutModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cartItems={cartItems}
        total={cartTotal}
        onCheckoutSuccess={handleCheckoutSuccess}
      />

    </div>
  );
};

export default POSDashboard;
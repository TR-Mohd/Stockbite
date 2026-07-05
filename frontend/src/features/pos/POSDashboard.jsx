import { useState } from 'react';
import MenuGrid from './MenuGrid';
import ShoppingCart from './ShoppingCart';
import CheckoutModal from './CheckoutModal';
import ConfirmModal from './ConfirmModal';
import ItemCustomizationModal from './ItemCustomizationModal';
import { useAuthStore } from '../../core/store/authStore';
import { usePosStore } from '../../core/store/posStore';
import '../../styles/POS/POSDashboard.css';

const SearchIcon = () => (
  <svg
    className="pos-nav-search-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="pos-logout-icon"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const POSDashboard = () => {
  const cartItems = usePosStore((state) => state.cartItems);
  const addToCart = usePosStore((state) => state.addToCart);
  const updateQuantity = usePosStore((state) => state.updateQuantity);
  const removeItem = usePosStore((state) => state.removeItem);
  const clearCart = usePosStore((state) => state.clearCart);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmClearModalOpen, setIsConfirmClearModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [customizingItem, setCustomizingItem] = useState(null);
  
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const handleAddToCart = (item) => {
    if (item.modifier_groups && item.modifier_groups.length > 0) {
      setCustomizingItem(item);
    } else {
      addToCart(item);
    }
  };

  const handleConfirmCustomization = (item, modifierIds, priceAdjustment) => {
    addToCart(item, modifierIds, priceAdjustment);
    setCustomizingItem(null);
  };

  const handleUpdateQuantity = (cartItemId, newQty) => {
    updateQuantity(cartItemId, newQty);
  };

  const handleGridRemoveOne = (baseItemId) => {
    const matchingItems = cartItems.filter(c => c.id === baseItemId);
    if (matchingItems.length > 0) {
      const lastItem = matchingItems[matchingItems.length - 1];
      updateQuantity(lastItem.cartItemId, lastItem.qty - 1);
    }
  };

  const handleRemoveItem = (cartItemId) => {
    removeItem(cartItemId);
  };

  const handleEmptyCart = () => {
    setIsConfirmClearModalOpen(true);
  };

  const confirmEmptyCart = () => {
    clearCart();
    setIsConfirmClearModalOpen(false);
  };

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.qty, 0);
  const tax = subtotal * 0.11;
  const cartTotal = subtotal + tax;
  const totalItemCount = cartItems.reduce((count, item) => count + item.qty, 0);

  const handleCheckoutSuccess = () => {
    setIsModalOpen(false);
    clearCart();
    alert('Payment Successful! Order has been processed.');
  };

  return (
    <div className="pos-layout-container">
      {/* Top Navigation Bar */}
      <header className="pos-header-nav">
        <div className="pos-header-container">
          <h1>Point of Sale</h1>
          <div className="pos-header-actions">
            <div className="pos-header-user-actions">
              {(user?.username || user?.name) && <span className="pos-user-greeting">Hi, {user.username || user.name}</span>}
              <button className="pos-logout-button" aria-label="Log out" onClick={logout} title="Logout">
                <LogoutIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="pos-main-content">
        {/* Left Panel — Product Menu (73%) */}
        <section className="pos-menu-section">
          <header className="pos-header">
            <div>
              <h2 className="pos-header-title">Menu</h2>
            </div>
            <div className="pos-nav-search">
              <SearchIcon />
              <input
                type="text"
                className="pos-nav-search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search menu items"
              />
            </div>
          </header>

          <MenuGrid 
            onAddToCart={handleAddToCart} 
            onUpdateQuantity={handleGridRemoveOne}
            searchQuery={searchQuery}
            cartItems={cartItems}
          />
        </section>

        {/* Right Panel — Order Details (27%) */}
        <aside className="pos-cart-section">
          <div className="pos-cart-header">
            <h2 className="pos-cart-title">Order Details</h2>
            {cartItems.length > 0 && (
              <button data-testid="btn-empty-cart" className="btn-empty-cart" onClick={handleEmptyCart} title="Empty Cart">
                <TrashIcon />
                <span>Empty Cart</span>
              </button>
            )}
          </div>

          <ShoppingCart
            cartItems={cartItems}
            updateQuantity={handleUpdateQuantity}
            removeItem={handleRemoveItem}
          />

          {/* Order Summary */}
          <div className="pos-order-summary">
            <div className="pos-summary-row">
              <span>Subtotal ({totalItemCount})</span>
              <span>Rp {subtotal.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
            <div className="pos-summary-row">
              <span>Tax (11%)</span>
              <span>Rp {tax.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
            <div className="pos-summary-row total">
              <span>Total Payment</span>
              <span className="pos-summary-value">Rp {cartTotal.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          {/* Make Order CTA */}
          <button
            data-testid="btn-make-order"
            className="btn-make-order"
            onClick={() => setIsModalOpen(true)}
            disabled={cartItems.length === 0}
          >
            Make Order
          </button>
        </aside>
      </div>

      {/* Checkout Confirmation Modal */}
      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cartItems={cartItems}
        total={subtotal}
        onCheckoutSuccess={handleCheckoutSuccess}
      />

      {/* Item Customization Modal */}
      <ItemCustomizationModal
        key={customizingItem ? customizingItem.id : 'empty'}
        isOpen={!!customizingItem}
        onClose={() => setCustomizingItem(null)}
        item={customizingItem}
        onConfirm={handleConfirmCustomization}
      />

      {/* Clear Cart Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmClearModalOpen}
        onClose={() => setIsConfirmClearModalOpen(false)}
        onConfirm={confirmEmptyCart}
        title="Clear Cart"
        message="Are you sure you want to clear the entire cart? This action cannot be undone."
        confirmText="Clear Cart"
      />
    </div>
  );
};

export default POSDashboard;
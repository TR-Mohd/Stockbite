import { useState } from 'react';
import axiosInstance from '../../core/api/axios';
import '../../styles/POS/CheckoutModal.css';
import qrisLogoLight from '../../assets/qris-logo-lightmode.svg';
import qrisLogoDark from '../../assets/qris-logo-darkmode.png';
import { formatPhoneNumber } from '../../utils/formatters';

const PhoneIcon = () => (
  <svg
    className="checkout-input-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const MailIcon = () => (
  <svg
    className="checkout-input-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const ErrorIcon = () => (
  <svg
    className="checkout-error-banner-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CheckoutModal = ({ isOpen, onClose, cartItems, total, onCheckoutSuccess }) => {
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [orderType, setOrderType] = useState('Takeaway');
  const [routingNumber, setRoutingNumber] = useState('');
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmail, setShowEmail] = useState(false);

  const subtotal = total;
  const tax = subtotal * 0.11;
  const finalTotal = subtotal + tax;

  const parsedTendered = parseInt(tenderedAmount.replace(/\D/g, ''), 10) || 0;
  const changeDue = parsedTendered - finalTotal;
  const isCashInvalid = paymentMethod === 'Cash' && parsedTendered < finalTotal;

  if (!isOpen) return null;
  const isDineIn = orderType === 'Dine-In';

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        items: cartItems.map((item) => ({
          menu_item_id: String(item.id),
          quantity: item.qty,
          notes: item.notes || '',
          modifier_ids: item.modifier_ids || []
        })),
        payment_method: paymentMethod,
        whatsapp: whatsapp || undefined,
        email: email || undefined,
        order_type: orderType,
        routing_number: routingNumber || undefined,
        amount_tendered: paymentMethod === 'Cash' ? parsedTendered : undefined,
        change_due: paymentMethod === 'Cash' ? changeDue : undefined
      };

      await axiosInstance.post('/pos/checkout', payload);
      setWhatsapp('');
      setEmail('');
      setShowEmail(false);
      setOrderType('Takeaway');
      setRoutingNumber('');
      setTenderedAmount('');
      onCheckoutSuccess();
    } catch (err) {
      console.error('Checkout failed', err);
      // Handle 409 Optimistic Locking conflict specifically
      if (err.response?.status === 409) {
        setError('Inventory was updated by another action. Your order is safe — please tap Confirm again to retry.');
      } else {
        let errorMsg = err.response?.data?.detail || 'System error occurred. Please try again.';
        if (Array.isArray(errorMsg)) {
          errorMsg = errorMsg.map((e) => `${e.loc.join('.')}: ${e.msg}`).join('\n');
        }
        setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-modal-overlay" onClick={onClose}>
      <div
        className="checkout-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
      >
        <h2 className="checkout-modal-title" id="checkout-modal-title">
          Confirm Order
        </h2>

        {/* Breakdown */}
        <div className="checkout-modal-breakdown">
          <div className="checkout-modal-breakdown-row">
            <span>Subtotal</span>
            <span>Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="checkout-modal-breakdown-row">
            <span>Tax (11%)</span>
            <span>Rp {tax.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Total Amount */}
        <div className="checkout-modal-amount">
          <span className="checkout-modal-amount-value">
            Rp {finalTotal.toLocaleString('id-ID')}
          </span>
        </div>

        {/* 409 Error Banner */}
        {error && (
          <div className="checkout-error-banner" role="alert">
            <ErrorIcon />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="checkout-modal-body">
          
          {/* Order Routing Options */}
          <div className="checkout-form-group">
            <label className="checkout-form-label">
              Order Type: <span className="required">*</span>
            </label>
            <div className="payment-cards-container">
              <div 
                data-testid="btn-takeaway"
                className={`order-type-card ${orderType === 'Takeaway' ? 'active' : ''}`}
                onClick={() => setOrderType('Takeaway')}
                role="button"
                tabIndex={0}
              >
                🛍️ Takeaway
              </div>
              <div 
                data-testid="btn-dine-in"
                className={`order-type-card ${orderType === 'Dine-In' ? 'active' : ''}`}
                onClick={() => setOrderType('Dine-In')}
                role="button"
                tabIndex={0}
              >
                🍽️ Dine-In
              </div>
            </div>
          </div>

          {/* Table Number / WhatsApp Row */}
          <div className={`checkout-row ${isDineIn ? 'has-gap' : ''}`}>
            
            {/* Table Number (Animated Col) */}
            <div className={`animated-col ${isDineIn ? 'expanded' : ''}`}>
              <div className="checkout-form-group" style={{ marginBottom: 0 }}>
                <label className="checkout-form-label" htmlFor="checkout-routing">
                  Table no. <span className="required">*</span>
                </label>
                <div className="checkout-input-wrapper">
                  <input
                    data-testid="input-table-number"
                    id="checkout-routing"
                    type="text"
                    className="checkout-form-input"
                    placeholder="Table no."
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    style={{ paddingLeft: '12px' }}
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp (Always visible) */}
            <div className="checkout-col">
              <div className="checkout-form-group" style={{ marginBottom: 0 }}>
                <label className="checkout-form-label" htmlFor="checkout-whatsapp">
                  WhatsApp {isDineIn ? 'no.' : 'Number'}
                </label>
                <div className="checkout-input-wrapper">
                  <PhoneIcon />
                  <input
                    id="checkout-whatsapp"
                    type="text"
                    className="checkout-form-input"
                    placeholder={isDineIn ? "WhatsApp no." : "Enter WhatsApp number..."}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhoneNumber(e.target.value, true).replace(/-/g, ''))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Email Input */}
          <div className="checkout-form-group">
            <button 
              type="button" 
              className={`btn-add-email ${showEmail ? 'hidden' : ''}`}
              onClick={() => setShowEmail(true)}
            >
              + Add Email
            </button>
            <div className={`animated-row ${showEmail ? 'expanded' : ''}`}>
              <div className="animated-row-content">
                <label className="checkout-form-label" htmlFor="checkout-email">
                  Email Address
                </label>
                <div className="checkout-input-wrapper">
                  <MailIcon />
                  <input
                    id="checkout-email"
                    type="email"
                    className="checkout-form-input"
                    placeholder="Enter email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Cards */}
          <div className="checkout-payment-group" style={{ marginBottom: paymentMethod === 'Cash' ? '0' : 'var(--spacing-3)' }}>
            <label className="checkout-form-label">
              Payment method: <span className="required">*</span>
            </label>
            <div className="payment-cards-container">
              <div 
                className={`payment-card ${paymentMethod === 'Cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('Cash')}
                role="button"
                tabIndex={0}
              >
                <span className="payment-card-icon" title="Cash">💵</span>
              </div>
              <div 
                className={`payment-card ${paymentMethod === 'QRIS' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('QRIS')}
                role="button"
                tabIndex={0}
              >
                <img src={qrisLogoLight} alt="QRIS" className="payment-card-img qris-light" />
                <img src={qrisLogoDark} alt="QRIS" className="payment-card-img qris-dark" />
              </div>
            </div>
          </div>

          {/* Cash Tendered Input (Animated Row) */}
          <div className={`animated-row ${paymentMethod === 'Cash' ? 'expanded' : ''}`}>
            <div className="animated-row-content">
              <div className={`checkout-row ${parsedTendered > 0 ? 'has-gap' : ''}`} style={{ marginTop: 'var(--spacing-3)', marginBottom: 0 }}>
                
                {/* Amount Tendered Input */}
                <div className="checkout-col">
                  <div className="checkout-form-group" style={{ display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
                    <label className="checkout-form-label" htmlFor="checkout-tendered">
                      Amount Tendered <span className="required">*</span>
                    </label>
                    <div className="checkout-input-wrapper">
                      <input
                        id="checkout-tendered"
                        type="text"
                        className="checkout-form-input"
                        placeholder="0"
                        value={tenderedAmount ? `Rp ${parseInt(tenderedAmount.replace(/\D/g, '') || 0, 10).toLocaleString('id-ID')}` : ''}
                        onChange={(e) => setTenderedAmount(e.target.value)}
                        style={{ paddingLeft: '12px', fontSize: 'var(--font-size-lg)', fontWeight: 'bold' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Change Due (Animated Col) */}
                <div className={`animated-col ${parsedTendered > 0 ? 'expanded' : ''}`}>
                  <div className="checkout-form-group" style={{ display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
                    <label className="checkout-form-label">
                      Change Due
                    </label>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span className="change-due-value" style={{ color: changeDue >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontSize: 'var(--font-size-lg)' }}>
                        Rp {changeDue.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="checkout-modal-actions">
          <button className="btn-modal-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            data-testid="btn-confirm-checkout"
            className="btn-modal-confirm"
            onClick={handleCheckout}
            disabled={loading || (orderType === 'Dine-In' && !routingNumber.trim()) || isCashInvalid}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
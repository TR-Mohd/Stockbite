import React, { useState } from 'react';
import axiosInstance from '../../core/api/axios';
import '../../styles/POS/CheckoutModal.css';

const CheckoutModal = ({ isOpen, onClose, cartItems, total, onCheckoutSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        items: cartItems.map(item => ({ 
          menu_item_id: String(item.id), 
          quantity: item.qty, 
          notes: item.notes || '' 
        })),
        payment_method: paymentMethod,
        customer_contact: [whatsapp, email].filter(Boolean).join(', ') || undefined
      };

      await axiosInstance.post('/pos/checkout', payload);
      onCheckoutSuccess(); 
    } catch (err) {
      console.error("Checkout failed", err);
      let errorMsg = err.response?.data?.detail || "System error occurred. Please try again.";
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg.map(e => `${e.loc.join('.')}: ${e.msg}`).join('\n');
      }
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-modal-overlay">
      <div className="checkout-modal-container">
        <h2 className="checkout-modal-title">Payment Process</h2>
        
        <p className="checkout-modal-total">
          Total Amount: <strong>Rp {total.toLocaleString('id-ID')}</strong>
        </p>

        {error && (
          <div className="checkout-modal-error">
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Payment Method</label>
          <select 
            value={paymentMethod} 
            onChange={(e) => setPaymentMethod(e.target.value)} 
            className="form-select"
          >
            <option value="Cash">Cash</option>
            <option value="QRIS">QRIS</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Customer WhatsApp (CRM - Optional)</label>
          <input 
            type="text" 
            placeholder="0812..." 
            value={whatsapp} 
            onChange={(e) => setWhatsapp(e.target.value)} 
            className="form-input" 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Customer Email (CRM - Optional)</label>
          <input 
            type="email" 
            placeholder="email@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="form-input" 
          />
        </div>

        <div className="checkout-modal-actions">
          <button onClick={onClose} disabled={loading} className="btn-cancel">
            Cancel
          </button>
          <button onClick={handleCheckout} disabled={loading} className="btn-confirm">
            {loading ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
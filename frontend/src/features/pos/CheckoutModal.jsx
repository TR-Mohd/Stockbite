import React, { useState } from 'react';
import axiosInstance from '../../core/api/axios';
import '../../styles/pos/CheckoutModal.css';

const CheckoutModal = ({ isOpen, onClose, cartItems, total, onCheckoutSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
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
          menu_item_id: item.id, 
          qty: item.qty, 
          notes: item.notes || '' 
        })),
        payment_method: paymentMethod,
        customer_contact: { whatsapp, email }
      };

      await axiosInstance.post('/pos/checkout', payload);
      onCheckoutSuccess(); 
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError("FAILED: Stock levels for some items changed during the transaction. Please verify inventory.");
      } else {
        setError("System error occurred. Please try again.");
      }
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
            <option value="CASH">Cash</option>
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
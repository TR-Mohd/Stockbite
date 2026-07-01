import { useState } from 'react';
import axiosInstance from '../../../core/api/axios';
import '../../../styles/POS/CheckoutModal.css';

const PinAuthModal = ({ isOpen, onClose, onSuccess, title = "Manager Authorization", message = "Please enter manager PIN to authorize this action." }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin) {
      setError('PIN is required.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axiosInstance.post('/auth/pin-auth', { pin });
      setPin('');
      onSuccess(response.data.access_token);
    } catch (err) {
      console.error('PIN Auth failed', err);
      setError(err.response?.data?.detail || 'Invalid Manager PIN.');
      setPin(''); // clear for retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-modal-overlay" onClick={onClose} data-testid="pin-auth-modal">
      <div
        className="checkout-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '400px' }}
      >
        <h2 className="checkout-modal-title">{title}</h2>
        
        <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
          {message}
        </p>

        {error && (
          <div className="checkout-error-banner" style={{ marginBottom: '20px' }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="checkout-form-group">
            <label className="checkout-form-label" htmlFor="manager-pin">
              Manager PIN
            </label>
            <input
              data-testid="input-manager-pin"
              id="manager-pin"
              type="password"
              className="checkout-form-input"
              placeholder="Enter PIN..."
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
              maxLength={6}
              autoComplete="off"
            />
          </div>

          <div className="checkout-modal-actions" style={{ marginTop: '24px' }}>
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={() => {
                setPin('');
                setError('');
                onClose();
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              data-testid="btn-authorize"
              type="submit"
              className="btn-modal-confirm"
              disabled={loading || !pin}
            >
              {loading ? 'Verifying...' : 'Authorize'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PinAuthModal;

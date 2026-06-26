import React from 'react';
import '../../styles/POS/CheckoutModal.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm' }) => {
  if (!isOpen) return null;

  return (
    <div className="checkout-modal-overlay" onClick={onClose}>
      <div 
        className="checkout-modal-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: '360px', textAlign: 'center' }}
      >
        <h2 className="checkout-modal-title" style={{ marginBottom: 'var(--spacing-3)' }}>{title}</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-6)', fontSize: 'var(--font-size-sm)' }}>
          {message}
        </p>
        
        <div className="checkout-modal-actions">
          <button className="btn-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-modal-danger" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

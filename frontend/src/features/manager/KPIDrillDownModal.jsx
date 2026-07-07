import React, { useEffect, useRef } from 'react';
import styles from '../../styles/manager/KPIDrillDownModal.module.css';
import { DrillDownContent } from './components/DrillDownContent';

const kpiNames = {
  gross_revenue: 'Gross Revenue',
  tax_collected: 'Tax Collected',
  cogs: 'COGS',
  net_revenue: 'Net Revenue',
  profit_margin_percent: 'Profit Margin',
  average_ticket_size: 'Average Ticket Size'
};

export const KPIDrillDownModal = ({ activeKpi, timeframe, timeframeParam, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    // Scroll lock on mount
    document.body.style.overflow = 'hidden';

    // Save previous focus
    const previousFocus = document.activeElement;

    // Focus the modal for accessibility
    if (modalRef.current) {
      modalRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // Restore scroll and cleanup listener on unmount
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    // Only close if the backdrop itself was clicked
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const title = kpiNames[activeKpi] || activeKpi;

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div 
        className={styles.modalContainer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drillDownModalTitle"
        tabIndex="-1"
        ref={modalRef}
      >
        <div className={styles.header}>
          <h2 id="drillDownModalTitle" className={styles.title}>
            {title} — {timeframe}
          </h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className={styles.body}>
          <DrillDownContent activeKpi={activeKpi} timeframeParam={timeframeParam} />
        </div>
      </div>
    </div>
  );
};

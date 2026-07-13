import React from 'react';
import './NumberInput.css';

export const NumberInput = ({ value, onChange, min, max, step, required, className, placeholder, unit, disabled }) => {
  const isPcs = unit && unit.toLowerCase() === 'pcs';
  const currentStep = step || (isPcs ? '1' : '0.01');
  
  const handleDecrement = (e) => {
    e.preventDefault();
    if (disabled) return;
    const current = Number(value) || 0;
    let next = current - Number(currentStep);
    next = Number(next.toFixed(3));
    if (min !== undefined && next < Number(min)) return;
    onChange({ target: { value: String(isPcs ? Math.floor(next) : next) } });
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    if (disabled) return;
    const current = Number(value) || 0;
    let next = current + Number(currentStep);
    next = Number(next.toFixed(3));
    if (max !== undefined && next > Number(max)) return;
    onChange({ target: { value: String(isPcs ? Math.floor(next) : next) } });
  };

  return (
    <div className={`number-input-wrapper ${className || ''} ${disabled ? 'disabled' : ''}`}>
      <button className="number-btn number-btn-minus" onClick={handleDecrement} tabIndex="-1" disabled={disabled}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      <input
        type="number"
        className="number-input-field"
        value={value}
        onChange={(e) => {
          // Additional validation for pcs to reject fractional inputs directly
          if (isPcs && e.target.value.includes('.')) return;
          onChange(e);
        }}
        min={min}
        max={max}
        step={currentStep}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button className="number-btn number-btn-plus" onClick={handleIncrement} tabIndex="-1" disabled={disabled}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
};

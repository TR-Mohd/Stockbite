import React, { forwardRef } from 'react';
import styles from './Input.module.css';

export const Input = forwardRef(({
  label,
  error,
  id,
  className = '',
  type = 'text',
  ...props
}, ref) => {
  const inputClassNames = [
    styles.input,
    error ? styles.inputError : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`${styles.inputWrapper} ${className}`}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <input
        ref={ref}
        id={id}
        type={type}
        className={inputClassNames}
        {...props}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

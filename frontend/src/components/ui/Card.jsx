import React from 'react';
import styles from './Card.module.css';

export const Card = ({ children, className = '', isInteractive = false, isGlass = false, onClick }) => {
  const classNames = [
    styles.card,
    isInteractive ? styles.interactive : '',
    isGlass ? styles.glass : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} onClick={onClick}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`${styles.header} ${className}`}>{children}</div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`${styles.content} ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`${styles.footer} ${className}`}>{children}</div>
);

import React from 'react';
import styles from './Table.module.css';

export const TableContainer = ({ children, className = '' }) => (
  <div className={`${styles.tableContainer} ${className}`}>
    {children}
  </div>
);

export const Table = ({ children, className = '' }) => (
  <table className={`${styles.table} ${className}`}>
    {children}
  </table>
);

export const Thead = ({ children, className = '' }) => (
  <thead className={className}>
    {children}
  </thead>
);

export const Tbody = ({ children, className = '' }) => (
  <tbody className={className}>
    {children}
  </tbody>
);

export const Tr = ({ children, className = '', variant = 'default', ...props }) => {
  const variantClass = variant === 'warning' ? styles.warning : '';
  return (
    <tr className={`${styles.tr} ${variantClass} ${className}`} {...props}>
      {children}
    </tr>
  );
};

export const Th = ({ children, className = '', align = 'left', ...props }) => {
  const alignClass = align === 'right' ? styles.alignRight : align === 'center' ? styles.alignCenter : '';
  return (
    <th className={`${styles.th} ${alignClass} ${className}`} {...props}>
      {children}
    </th>
  );
};

export const Td = ({ children, className = '', align = 'left', colSpan, ...props }) => {
  const alignClass = align === 'right' ? styles.alignRight : align === 'center' ? styles.alignCenter : '';
  return (
    <td className={`${styles.td} ${alignClass} ${className}`} colSpan={colSpan} {...props}>
      {children}
    </td>
  );
};

export const TableEmptyState = ({ colSpan, icon, title, description }) => (
  <Tr>
    <Td colSpan={colSpan} align="center">
      <div className={styles.emptyStateContainer}>
        {icon && <div className={styles.emptyStateIcon}>{icon}</div>}
        {title && <h3>{title}</h3>}
        {description && <p>{description}</p>}
      </div>
    </Td>
  </Tr>
);

import React from 'react';
import { GlobalHeader } from './GlobalHeader';
import styles from './AppLayout.module.css';

export const AppLayout = ({ title, headerActions, children }) => {
  return (
    <div className={styles.appLayoutContainer}>
      <GlobalHeader title={title}>
        {headerActions}
      </GlobalHeader>
      <main className={styles.appMainContent}>
        {children}
      </main>
    </div>
  );
};

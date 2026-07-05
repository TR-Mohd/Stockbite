import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import styles from '../../styles/manager/KPICard.module.css';

export const KPICard = ({ title, value, trend, trendUp, highlight, infoTooltip }) => {
  return (
    <Card className={`${styles.kpiCard} ${highlight ? styles.highlighted : ''}`}>
      <CardContent className={styles.content}>
        <div className={styles.titleContainer}>
          <h3 className={styles.title}>{title}</h3>
          {infoTooltip && (
            <div className={styles.infoIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <div className={styles.tooltip}>{infoTooltip}</div>
            </div>
          )}
        </div>
        <div className={styles.valueContainer}>
          <span className={styles.value}>{value}</span>
          {trend && (
            <span className={`${styles.trend} ${trendUp ? styles.trendUp : styles.trendDown}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

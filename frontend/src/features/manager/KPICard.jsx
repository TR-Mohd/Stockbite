import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import styles from '../../styles/manager/KPICard.module.css';

export const KPICard = ({ title, value, trend, trendUp, highlight }) => {
  return (
    <Card className={`${styles.kpiCard} ${highlight ? styles.highlighted : ''}`}>
      <CardContent className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
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

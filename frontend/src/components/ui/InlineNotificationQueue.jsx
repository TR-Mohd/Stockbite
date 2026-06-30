import React, { useEffect, useState } from 'react';
import styles from './InlineNotificationQueue.module.css';

const NotificationItem = ({ notif, onDismiss, index }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Small delay to allow the DOM to mount before triggering the transition
    const mountTimer = setTimeout(() => setIsMounted(true), 10);
    
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onDismiss(notif.id);
      }, 300);
    }, 3000);
    
    return () => {
      clearTimeout(mountTimer);
      clearTimeout(timer);
    };
  }, [notif.id, onDismiss]);

  const isHidden = index > 2;
  
  let zIndex = 100 - (index * 10);
  let scale = 1 - (index * 0.05);
  let translateY = index * -12;
  let translateX = "0px";
  let opacity = index === 0 ? 1 : (index === 1 ? 0.8 : (index === 2 ? 0.6 : 0));
  
  if (!isMounted) {
    opacity = 0;
    translateX = "50px";
  } else if (isExiting) {
    opacity = 0;
    translateX = "50px";
  } else if (isHidden) {
    opacity = 0;
  }

  return (
    <div 
      className={styles.notificationCard}
      style={{
        zIndex,
        transform: `translateX(${translateX}) translateY(${translateY}px) scale(${scale})`,
        opacity,
      }}
    >
      {notif.message}
    </div>
  );
};

export const InlineNotificationQueue = ({ notifications, onDismiss }) => {
  if (notifications.length === 0) return null;

  return (
    <div className={styles.queueContainer}>
      {notifications.map((notif, index) => {
        const visualIndex = notifications.length - 1 - index;
        return (
          <NotificationItem key={notif.id} index={visualIndex} notif={notif} onDismiss={onDismiss} />
        );
      })}
    </div>
  );
};

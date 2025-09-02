
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NotificationContextType {
  readNotifications: Set<string>;
  markAsRead: (notificationId: string) => void;
  isRead: (notificationId: string) => boolean;
  getUnreadCount: (notifications: any[]) => number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  // Load read notifications from localStorage on component mount
  useEffect(() => {
    const savedReadNotifications = localStorage.getItem('readNotifications');
    if (savedReadNotifications) {
      try {
        const parsedNotifications = JSON.parse(savedReadNotifications);
        setReadNotifications(new Set(parsedNotifications));
      } catch (error) {
        console.error('Error parsing read notifications from localStorage:', error);
      }
    }
  }, []);

  // Save read notifications to localStorage whenever the set changes
  useEffect(() => {
    localStorage.setItem('readNotifications', JSON.stringify([...readNotifications]));
  }, [readNotifications]);

  const markAsRead = (notificationId: string) => {
    setReadNotifications(prev => new Set([...prev, notificationId]));
  };

  const isRead = (notificationId: string) => {
    return readNotifications.has(notificationId);
  };

  const getUnreadCount = (notifications: any[]) => {
    return notifications.filter(notification => !readNotifications.has(`${notification.type}-${notification.id}`)).length;
  };

  const value = {
    readNotifications,
    markAsRead,
    isRead,
    getUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

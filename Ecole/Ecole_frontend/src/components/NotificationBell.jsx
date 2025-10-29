import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import '../styles/NotificationBell.css';

const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadNotifications = async () => {
    try {
      const result = await notificationService.getNotifications(userId);
      if (result.success) setNotifications(result.data);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const result = await notificationService.getUnreadCount(userId);
      if (result.success) setUnreadCount(result.count);
    } catch (error) {
      console.error('Erreur comptage notifications:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(userId);
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Erreur marquage tout lu:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  return (
    <div className="notification-bell-container">
      <button className="notification-bell" onClick={() => setShowPanel(!showPanel)}>
        <Bell size={20} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {showPanel && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="mark-all-btn">
                <Check size={16} /> Tout marquer lu
              </button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">Aucune notification</p>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className={`notification-item ${!notif.lu ? 'unread' : ''}`}>
                  <div className="notification-content" onClick={() => !notif.lu && handleMarkAsRead(notif.id)}>
                    <strong>{notif.titre}</strong>
                    <p>{notif.message}</p>
                    <span className="notification-time">{new Date(notif.created_at).toLocaleString()}</span>
                  </div>
                  <button className="delete-btn" onClick={() => handleDelete(notif.id)}>
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

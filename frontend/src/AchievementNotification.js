import React, { useEffect, useState } from 'react';
import './AchievementNotification.css';

function AchievementNotification() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleAchievementUnlocked = (event) => {
      const achievement = event.detail?.achievement;
      if (!achievement) return;

      const notification = {
        id: Date.now() + Math.random(),
        name: achievement.achievement_name || achievement.name,
        description: achievement.achievement_description || achievement.description,
        icon: achievement.icon || '🏆',
      };

      setNotifications((prev) => [...prev, notification]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, 5000);
    };

    window.addEventListener('achievement:unlocked', handleAchievementUnlocked);

    return () => {
      window.removeEventListener('achievement:unlocked', handleAchievementUnlocked);
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="achievement-notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="achievement-notification animate-slide-in"
        >
          <div className="achievement-notification-content">
            <div className="achievement-notification-icon">{notification.icon}</div>
            <div className="achievement-notification-text">
              <div className="achievement-notification-title">Achievement Unlocked!</div>
              <div className="achievement-notification-name">{notification.name}</div>
              <div className="achievement-notification-description">{notification.description}</div>
            </div>
            <button
              className="achievement-notification-close"
              onClick={() => removeNotification(notification.id)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AchievementNotification;

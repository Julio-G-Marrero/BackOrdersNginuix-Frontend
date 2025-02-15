import React, { useState } from "react";
import useNotifications from "../hooks/useNotifications";

const Notifications = ({ userId }) => {
  const { notifications, setNotifications } = useNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);

  const markAsRead = async (id) => {
    await axiosInstance.put(`/api/notifications/${id}/read`);
    setNotifications(notifications.map(n => (n._id === id ? { ...n, read: true } : n)));
  };

  return (
    <div className="notifications-container">
      <button className="notification-icon" onClick={() => setIsOpen(!isOpen)}>
        🔔 {notifications.filter(n => !n.read).length}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          {notifications.length === 0 ? <p>No hay notificaciones</p> : 
            notifications.map((n) => (
              <div key={n._id} className={`notification-item ${n.read ? "read" : "unread"}`}>
                <p>{n.message}</p>
                <button onClick={() => markAsRead(n._id)}>✔</button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

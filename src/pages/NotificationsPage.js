import React, { useState, useEffect } from "react";
import axiosInstance from "../services/axiosInstance";
import { Link } from "react-router-dom";
import "./NotificationsPage.css";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Obtener usuario del localStorage
  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;

  useEffect(() => {
    if (user && user._id) {
      fetchNotifications(user._id);
    } else {
      setLoading(false);
      setError("Usuario no autenticado");
    }
  }, [user]);

  // 🔥 Obtener notificaciones del backend
  const fetchNotifications = async (userId) => {
    try {
      const response = await axiosInstance.get(`/notifications/${userId}`);
      setNotifications(response.data);
    } catch (error) {
      console.error("Error al obtener notificaciones:", error.response?.data || error.message);
      setError("No se pudieron obtener las notificaciones");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Marcar todas las notificaciones como leídas
  const markAllAsRead = async () => {
    try {
      await axiosInstance.put(`/notifications/mark-all-read/${user._id}`);
      setNotifications(notifications.map((notif) => ({ ...notif, read: true })));
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
      setError("Error al actualizar notificaciones");
    }
  };

  return (
    <div className="notifications-container">
      <h2>Mis Notificaciones</h2>

      {loading && <p>Cargando notificaciones...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          {notifications.length === 0 ? (
            <p>No tienes notificaciones.</p>
          ) : (
            <>
              <button className="mark-all-btn" onClick={markAllAsRead}>
                Marcar todas como leídas
              </button>
              <ul className="notifications-list">
                {notifications.map((notif) => (
                  <li key={notif._id} className={notif.read ? "read" : "unread"}>
                    <Link to={notif.link || "#"}>{notif.message}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default NotificationsPage;

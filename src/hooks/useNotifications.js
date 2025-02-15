import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axiosInstance from "../services/axiosInstance";

const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await axiosInstance.get("/api/notifications");
      setNotifications(data);
    };

    fetchNotifications();

    const socket = io("http://localhost:3000");
    socket.emit("joinRoom", userId);

    socket.on("newNotification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => socket.disconnect();
  }, [userId]);

  return { notifications, setNotifications };
};

export default useNotifications;

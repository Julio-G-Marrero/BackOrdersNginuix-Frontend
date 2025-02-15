import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api/v1", // Asegúrate de que esta URL sea la correcta
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔥 Interceptor para agregar el token de autenticación automáticamente
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Obtiene el token del localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔥 Interceptor para manejar respuestas y errores globales
axiosInstance.interceptors.response.use(
  (response) => response, // Si la respuesta es exitosa, la retorna sin cambios
  (error) => {
    console.error("Error en la API:", error.response?.data || error.message);

    if (error.response) {
      const { status, message } = error.response.data || {};

      // ✅ Si el usuario está restringido, cerrar sesión automáticamente
      if (status === 403 && message === "Tu acceso ha sido restringido. Contacta al administrador.") {
        alert("⚠️ Tu acceso ha sido restringido. Contacta al administrador.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login"; // Redirige al login
      }

      // ✅ Si el error es de autenticación (401), cerrar sesión automáticamente
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login"; 
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

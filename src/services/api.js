import axios from 'axios';

const token = localStorage.getItem('token'); // Recuperar el token almacenado en localStorage

const api = axios.create({
  baseURL: 'https://backordersnginuix-backend-production.up.railway.app/api/v1', // URL base del backend
  headers: {
    Authorization: `Bearer ${token}`, // Agregar el token en el encabezado Authorization
  },
});

export default api;

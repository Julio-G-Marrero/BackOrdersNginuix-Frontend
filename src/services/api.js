import axios from 'axios';

const token = localStorage.getItem('token'); // Recuperar el token almacenado en localStorage

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1', // URL base del backend
  headers: {
    Authorization: `Bearer ${token}`, // Agregar el token en el encabezado Authorization
  },
});

export default api;

import api from './api';
import axiosInstance from './axiosInstance';

export const getCustomers = (page = 1, limit = 10, search = '') => {
  return axiosInstance.get('/customers', {
    params: { page, limit, search },
  });
};

export const createCustomer = async (customerData) => {
  const response = await api.post('/customers', customerData);
  return response.data;
};

export const updateCustomer = async (id, customerData) => {
  const response = await api.put(`/customers/${id}`, customerData);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await api.delete(`/customers/${id}`);
  return response.data;
};

export const importCustomers = (formData) => {
  return axiosInstance.post('customers/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // Asegúrate de usar multipart/form-data
    },
  });
};
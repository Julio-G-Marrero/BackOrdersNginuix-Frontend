import axiosInstance from './api';

export const getProducts = async (page = 1, limit = 50, search = '') => {
  const response = await axiosInstance.get('/products', {
    params: { page, limit, search }, // Agregar parámetros de consulta
  });
  return response.data; // Devolver datos del backend
};

export const createProduct = async (productData) => {
  const response = await axiosInstance.post('/products', productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await axiosInstance.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await axiosInstance.delete(`/products/${id}`);
  return response.data;
};

export const importProducts = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosInstance.post('/products/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

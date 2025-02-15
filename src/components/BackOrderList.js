import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';

const BackOrderList = () => {
  const [backOrders, setBackOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({ client: '', status: '', startDate: '', endDate: '' });
  const [sort, setSort] = useState('');

  // Obtener Back Orders con Filtros
  useEffect(() => {
    const fetchBackOrders = async () => {
      try {
        const response = await axiosInstance.get('/backorders', {
          params: { ...filters, sort },
        });
        setBackOrders(response.data);
      } catch (error) {
        console.error('Error al obtener Back Orders:', error);
      }
    };

    fetchBackOrders();
  }, [filters, sort]);

  // Manejar cambios en filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar edición de Back Orders
  const handleEdit = (order) => {
    setSelectedOrder(order);
  };

  // Manejar eliminación de Back Orders
  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este Back Order?')) {
      try {
        await axiosInstance.delete(`/backorders/${id}`);
        alert('Back Order eliminado con éxito');
        setBackOrders(backOrders.filter((order) => order._id !== id));
      } catch (error) {
        console.error('Error al eliminar Back Order:', error);
        alert('Error al eliminar el Back Order.');
      }
    }
  };

  // Descargar estadísticas
  const downloadStatistics = async () => {
    try {
      const response = await axiosInstance.get('/backorders/statistics', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'statistics.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar estadísticas:', error);
      alert('Error al descargar estadísticas.');
    }
  };

  return (
    <div>
      <h1>Listado de Back Orders</h1>

      {/* Filtros */}
      <div>
        <label>Cliente:</label>
        <input name="client" value={filters.client} onChange={handleFilterChange} />

        <label>Estado:</label>
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">Todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Surtido Parcial">Surtido Parcial</option>
          <option value="Completado">Completado</option>
          <option value="Denegado">Denegado</option>
        </select>

        <label>Fecha Inicio:</label>
        <input name="startDate" type="date" value={filters.startDate} onChange={handleFilterChange} />

        <label>Fecha Fin:</label>
        <input name="endDate" type="date" value={filters.endDate} onChange={handleFilterChange} />

        <label>Ordenar Por:</label>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Fecha de Creación (Desc)</option>
          <option value="createdAt">Fecha de Creación (Asc)</option>
          <option value="estado_general">Estado General</option>
        </select>
      </div>

      {/* Tabla de Back Orders */}
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {backOrders.map((order) => (
            <tr key={order._id}>
              <td>{order.client ? order.client.name : 'Cliente no asignado'}</td>
              <td>{order.estado_general}</td>
              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleEdit(order)}>Editar</button>
                <button onClick={() => handleDelete(order._id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Botón para descargar estadísticas */}
      <button onClick={downloadStatistics}>Descargar Estadísticas</button>

      {/* Modal para Editar Back Orders */}
      {selectedOrder && (
        <form>
          <h2>Editar Back Order</h2>
          <label>Cliente</label>
          <input type="text" value={selectedOrder.client?.name || ''} disabled />

          <label>Estado General</label>
          <input
            type="text"
            value={selectedOrder.estado_general}
            onChange={(e) =>
              setSelectedOrder({ ...selectedOrder, estado_general: e.target.value })
            }
          />

          <button
            onClick={async (e) => {
              e.preventDefault();
              try {
                await axiosInstance.put(`/backorders/${selectedOrder._id}`, selectedOrder);
                alert('Back Order actualizado con éxito');
                setSelectedOrder(null);
              } catch (error) {
                console.error('Error al actualizar Back Order:', error);
                alert('Error al actualizar el Back Order.');
              }
            }}
          >
            Guardar Cambios
          </button>
        </form>
      )}
    </div>
  );
};

export default BackOrderList;

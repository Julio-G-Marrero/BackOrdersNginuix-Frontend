import React, { useState, useEffect } from "react";
import axiosInstance from "../services/axiosInstance";
import BackOrderDetailsModal from "../components/BackOrderDetailsModal";
import "./PurchaseManagerBackOrders.css"; // ✅ Nueva hoja de estilos

const PurchaseManagerBackOrders = () => {
  const [backOrders, setBackOrders] = useState([]);
  const [filteredBackOrders, setFilteredBackOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const userRole = JSON.parse(localStorage.getItem("user"))?.role || "vendedor";

  useEffect(() => {
    fetchBackOrders();
  }, []);
  const fetchBackOrders = async () => {
    setLoading(true);  // Activar estado de carga
  
    try {
      const response = await axiosInstance.get("/backorders");
      setBackOrders(response.data);
      setFilteredBackOrders(response.data);
    } catch (error) {
      console.error("Error al obtener Back Orders:", error);
    } finally {
      setLoading(false);  // Desactivar estado de carga al finalizar
    }
  };
  useEffect(() => {
    let filtered = [...backOrders];

    if (filterStatus) {
      filtered = filtered.filter((order) =>
        order.products.some((product) =>
          Array.isArray(filterStatus)
            ? filterStatus.includes(product.status)
            : product.status === filterStatus
        )
      );
    }

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((order) =>
        order.client?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBackOrders(filtered);
  }, [filterStatus, searchQuery, backOrders]);

  const handleOpenOrder = (order) => {
    setSelectedOrder(order);
    setSelectedOrderId(order._id);
  };

  const handleCloseModal = async () => {
    try {
      const response = await axiosInstance.get("/backorders");
      setBackOrders(response.data);
      setFilteredBackOrders(response.data);
    } catch (error) {
      console.error("Error al actualizar Back Orders:", error);
    }

    setSelectedOrder(null);
    setSelectedOrderId(null);
  };

  const statusLabels = {
    pending: "Pendiente",
    in_process: "En Proceso",
    pending_approval: "Pendiente de Aprobación",
    shipped: "Enviado por Proveedor",
    in_delivery_process: "En Proceso de Surtimiento",
    partial: "Surtido Parcial",
    fulfilled: "Articulo Finiquitado",
    denied: "Denegado",
    delayed: "Retrasado",
  };

  const filterOptions = [
    { label: "Todos", value: "" },
    { label: "Pendientes", value: "pending" },
    { label: "En Proceso", value: "in_process" },
    { label: "Pendiente Aprobación", value: "pending_approval" },
    { label: "Esperando Confirmación de Envío", value: "shipped" },
    { label: "En Proceso de Surtimiento", value: "in_delivery_process" },
    { label: "Surtido Parcial", value: "partial" },
    { label: "Historial", value: ["fulfilled", "denied"] },
  ];

  return (
    <div className="backorders-container">
      <h1 className="title">Gestión de Back Orders - Gerente de Compras</h1>
      <div className="refresh-container">
        <button
          className="refresh-button"
          onClick={fetchBackOrders}
          disabled={loading}
        >
          🔄 {loading ? "Actualizando..." : "Refrescar"}
        </button>
      </div>

      {/* 🔹 Contenedor de Filtros como Pestañas */}
      <div className="filters-wrapper">
        {/* 🔍 Barra de búsqueda arriba */}
        <div className="backorders-search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 📌 Filtros con scroll horizontal si es necesario */}
        <div className="tabs-container">
          {filterOptions.map((option) => (
            <button
              key={option.value || "todos"}
              className={`tab-button ${
                JSON.stringify(filterStatus) === JSON.stringify(option.value) ? "active" : ""
              }`}
              onClick={() => setFilterStatus(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>


      {/* 🔹 Tabla de Back Orders */}
      <div className="table-wrapper">
        <table className="backorders-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredBackOrders.map((order) => (
              <tr
                key={order._id}
                onClick={() => handleOpenOrder(order)}
                className={selectedOrderId === order._id ? "highlighted-row" : ""}
              >
                <td>{order.client ? order.client.name : "Cliente no asignado"}</td>
                <td>{statusLabels[order.statusGeneral] || "Desconocido"}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleOpenOrder(order)} className="details-button">
                    Ver Detalles
                  </button>
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <BackOrderDetailsModal
          order={selectedOrder}
          setOrder={setSelectedOrder}
          onClose={handleCloseModal}
          userRole={userRole}
          statusLabels={statusLabels}
        />
      )}
    </div>
  );
};

export default PurchaseManagerBackOrders;

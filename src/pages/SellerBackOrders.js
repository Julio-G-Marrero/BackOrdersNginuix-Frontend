import React, { useState, useEffect } from "react";
import axiosInstance from "../services/axiosInstance";
import "./SellerBackOrders.css";
import Swal from "sweetalert2";

const SellerBackOrders = () => {
  const [backOrders, setBackOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedReceiveProduct, setSelectedReceiveProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  const openReceiveModal = (product) => {
    setSelectedReceiveProduct(product);
    setShowReceiveModal(true);
  };
  
  useEffect(() => {
    fetchBackOrders();
  }, []);

  useEffect(() => {
    let filtered = [...backOrders];
  
    if (selectedStatus !== "Todos") {
      filtered = filtered.filter(order =>
        order.products.some(product =>
          selectedStatus === "historial"
            ? ["denied", "fulfilled"].includes(product.status)
            : selectedStatus === "surtimiento"
            ? ["in_delivery_process", "delayed"].includes(product.status)
            : product.status === selectedStatus
        )
      );
    }
  
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(order =>
        order.client?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  
    // Ordenar los resultados antes de mostrarlos
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
    setFilteredOrders(filtered);
  }, [backOrders, selectedStatus, searchQuery]);
  
  const deleteBackOrder = async (orderId) => {
    if (!window.confirm("¿Seguro que deseas eliminar este Back Order? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await axiosInstance.delete(`/backorders/${orderId}`);
      setBackOrders((prevOrders) => prevOrders.filter(order => order._id !== orderId));
      setFilteredOrders((prevOrders) => prevOrders.filter(order => order._id !== orderId));
      setShowDetailsModal(false); // Cerrar el modal después de eliminar
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        }
      });
      Toast.fire({
        icon: "success",
        title: "Back Order eliminado correctamente",
      });
    } catch (error) {
      console.error("❌ Error al eliminar el Back Order:", error);
      alert("⚠️ No se pudo eliminar el Back Order. Inténtalo de nuevo.");
    }
  };

  const fetchBackOrders = async () => {
    try {
      const response = await axiosInstance.get("/backorders/my");
      setBackOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      console.error("Error al obtener los Back Orders:", error);
    }
  };

  const statusLabels = {
    pending: "Pendiente",
    in_process: "En Proceso",
    pending_approval: "Pendiente de Aprobación",
    in_delivery_process: "En Proceso de Surtimiento",
    shipped: "Esperando Confirmación de Envío",
    partial: "Surtido Parcial",
    fulfilled: "Surtido Completo",
    denied: "Denegado",
    delayed: "Retrasado",
  };

  const filterOptions = [
    { label: "Todos", value: "Todos" },
    { label: "Pendientes", value: "pending" },
    { label: "En Proceso", value: "in_process" },
    { label: "Pendiente Aprobación", value: "pending_approval" },
    { label: "Esperando Confirmación de Envío", value: "shipped" },
    { label: "Surtimiento", value: "surtimiento" }, // 🔹 Nueva opción combinada (En Proceso de Surtimiento + Retrasado)
    { label: "Historial", value: "historial" }, // 🔹 Nueva opción combinada (Denegado + Surtido Parcial)
  ];

  const handleFilterChange = (status) => {
    setSelectedStatus(status);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const openDetailsModal = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const openApproveModal = (product) => {
    setSelectedProduct(product);
    setShowApproveModal(true);
  };


  const updateProductStatus = (orderId, productId, newStatus) => {
    setBackOrders(prevOrders =>
      prevOrders.map(order =>
        order._id === orderId
          ? {
              ...order,
              products: order.products.map(p =>
                p._id === productId ? { ...p, status: newStatus } : p
              ),
            }
          : order
      )
    );
  
    if (selectedOrder && selectedOrder._id === orderId) {
      setSelectedOrder(prevOrder => ({
        ...prevOrder,
        products: prevOrder.products.map(p =>
          p._id === productId ? { ...p, status: newStatus } : p
        ),
      }));
    }
  };
  

  return (
    <div className="seller-backorders-container">
      <h1 className="title">Mis Backorders</h1>
      <div className="refresh-container">
        <button
          className="refresh-button"
          onClick={fetchBackOrders}
          disabled={loading}
        >
          🔄 {loading ? "Actualizando..." : "Refrescar"}
        </button>
      </div>

      {/* 🔍 Campo de Búsqueda */}
      <div className="backorders-search-container">
        <input
          type="text"
          placeholder="Buscar por cliente..."
          className="search-input mb-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 🏷️ Pestañas de Filtrado */}
      <div className="filter-tabs">
        {filterOptions.map(({ label, value }) => (
          <button
            key={value}
            className={`tab-button ${selectedStatus === value ? "active" : ""}`}
            onClick={() => setSelectedStatus(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="table-responsive">
      <table className="seller-backorders-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order) => (
            <tr key={order._id} className="tr-hover" onClick={() => openDetailsModal(order)}>
              <td>{order.client ? order.client.name : "Sin Cliente"}</td>
              <td>{statusLabels[order.statusGeneral] || "Desconocido"}</td>
              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              <td>
                <button className="details-button" onClick={() => openDetailsModal(order)}>
                  Ver Detalles
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {showDetailsModal && selectedOrder && (
        <BackOrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowDetailsModal(false)}
          openApproveModal={openApproveModal}
          openReceiveModal={openReceiveModal} // ✅ PASAR LA FUNCIÓN AQUÍ
          statusLabels={statusLabels}
          deleteBackOrder={deleteBackOrder}
        />
      )}

      {showApproveModal && selectedProduct && (
        <ApproveProductModal
          product={selectedProduct}
          orderId={selectedOrder._id}
          onClose={() => setShowApproveModal(false)}
          updateProductStatus={updateProductStatus}
        />
      )}

      {showReceiveModal && selectedReceiveProduct && (
        <ReceiveProductModal
          product={selectedReceiveProduct}
          orderId={selectedOrder._id}
          onClose={() => setShowReceiveModal(false)}
          updateProductStatus={updateProductStatus}
        />
      )}

    </div>
  );
};

const BackOrderDetailsModal = ({ order, onClose, openApproveModal, openReceiveModal, statusLabels, deleteBackOrder }) => {
  const [showDenialReasonModal, setShowDenialReasonModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const handleDelete = () => {
    deleteBackOrder(order._id);
  };
  const openDenialReasonModal = (product) => {
    setSelectedProduct(product);
    setShowDenialReasonModal(true);
  };

  const closeDenialReasonModal = () => {
    setShowDenialReasonModal(false);
    setSelectedProduct(null);
  };
  return (
    <div className="modal-overlay">
      <div className="modal-box modal-box-seller">
        <h2>Detalles del Back Order</h2>
        <p className="cliente-tamaño"><strong>Cliente:</strong> {order.client?.name || "Cliente no asignado"}</p>

        {/* 🔹 Tabla responsiva con scroll */}
        <div className="table-container">
          <table className="backorder-product-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {order.products.map((product) => (
                <tr key={product._id}>
                  <td>{product.product?.description || "Sin descripción"}</td>
                  <td>{product.quantity}</td>
                  <td>{statusLabels[product.status] || "Desconocido"}</td>
                  <td>
                    {/* 🔹 Opciones de acción según el estado del producto */}
                    {product.status === "pending_approval" ? (
                      <button className="action-button approve" onClick={() => openApproveModal(product)}>
                        Revisar solicitud
                      </button>
                    ) : product.status === "in_delivery_process" ? (
                      <p>En Espera de Recepción</p>
                    ) : product.status === "fulfilled" ? (
                      <span className="status-label">Completado</span>
                    ) : product.status === "denied" ? (
                      <button className="view-reason-button" onClick={() => openDenialReasonModal(product)}>
                        Ver Motivo
                      </button>
                    ) : product.status === "partial" ? (
                      <span className="status-label">Parcialmente Surtido</span>
                    ) : (
                      <span className="status-label">Sin acciones</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔹 Botones de acción */}
        <div className="modal-buttons">
          <button className="delete-button" onClick={handleDelete}> Eliminar Back Order</button>
          <button className="close-button" onClick={onClose}>Cerrar</button>
        </div>
      </div>
      {showDenialReasonModal && selectedProduct && (
        <DenialReasonModal
          product={selectedProduct}
          onClose={closeDenialReasonModal}
        />
      )}
    </div>
  );
};

const DenialReasonModal = ({ product, onClose }) => {
  // 🔹 Obtener el último historial de denegación
  const denialHistory = product.history?.find(entry => entry.newStatus === "denied");

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2 className="modal-title"> Motivo de la Denegación</h2>

        <div className="product-info">
          <p><strong>Producto:</strong> {product.description}</p>
          <p><strong>Proveedor:</strong> {product.provider || "No asignado"}</p>
        </div>
        <div className="product-info">
          {denialHistory && (
            <div className="denial-meta">
              <p><strong>Denegado por:</strong> {denialHistory.updatedBy}</p>
              <p><strong>Fecha de denegación:</strong> {new Date(denialHistory.updatedAt).toLocaleDateString()}</p>
              <p><strong>Estado anterior:</strong> {denialHistory.previousStatus}</p>
              <p><strong>Cantidad Surtida:</strong> {denialHistory.fulfilledQuantity}</p>
              <p><strong>Cantidad Denegada:</strong> {denialHistory.deniedQuantity}</p>
            </div>
          )}
        </div>
        <div className="denial-reason">
          <label><strong>Motivo:</strong></label>
          <p className="reason-text">{denialHistory?.reason || denialHistory?.comments || product.comments || "No se especificó un motivo."}</p>
        </div>

   

        <div className="modal-buttons">
          <button className="close-button" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};



const ApproveProductModal = ({ product, orderId, onClose, updateProductStatus }) => {
  const [createNewBackOrder, setCreateNewBackOrder] = useState(false);
  const [remainingQuantity, setRemainingQuantity] = useState(product.quantity - product.fulfilledQuantity);
  const [comments, setComments] = useState("");

  const formatPromiseDate = (dateString) => {
    if (!dateString) return "No disponible";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  };

  const handleDecision = async (decision) => {
    console.log("📤 Enviando solicitud a:", `/backorders/${orderId}/products/${product._id}/approve`);
    console.log("📝 Datos enviados:", { decision, remainingQuantity, createNewBackOrder });

    try {
      const response = await axiosInstance.put(
        `/backorders/${orderId}/products/${product._id}/approve`,
        { 
          decision, 
          createNewBackOrder, 
          remainingQuantity, 
          comments 
        }
      );
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        }
      });
      if (response.status === 200) {
        Toast.fire({
          icon: "success",
          title: "Decisión registrada correctamente.",
        });
      }

      let newStatus = "denied";  
      if (decision === "approve") {
        newStatus = "shipped"; 
      }

      const newGeneralStatus = response.data.backOrder.statusGeneral;

      updateProductStatus(orderId, product._id, newStatus, newGeneralStatus);
      onClose();
    } catch (error) {
      console.error("❌ Error al procesar la decisión:", error.response?.data || error);
      alert(`Hubo un error al registrar la decisión. ${error.response?.data?.message || ""}`);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2 className="modal-title">Aprobar o Rechazar Producto</h2>
        {console.log(product)}
        <div className="product-info">
          <p><strong>Producto:</strong> {product.product?.description}</p>
          <p><strong>Precio:</strong> ${product.price?.toFixed(2)}</p>
          <p><strong>Cantidad Solicitada:</strong> {product.quantity}</p>
          <p><strong>Cantidad Surtida:</strong> {product.fulfilledQuantity}</p>
          <p><strong>Fecha Promesa:</strong> {formatPromiseDate(product.promiseDate)}</p>
          <p><strong>Provedor:</strong> {product.provider}</p>
        </div>

        {product.fulfilledQuantity < product.quantity && (
          <div className="alert-box">
            <p className="font-bold">El proveedor ha enviado menos productos de los solicitados.</p>
            <div className="checkbox-grid">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={createNewBackOrder}
                  onChange={() => setCreateNewBackOrder(!createNewBackOrder)}
                />
              </label>
              <p>
                Crear un nuevo Back Order con la cantidad faltante
              </p>
            </div>

            {createNewBackOrder && (
              <div className="input-group-aprobar">
                <label>Cantidad para el nuevo Back Order:</label>
                <div className="quantity-control">
                  <button type="button" onClick={() => setRemainingQuantity(prev => Math.max(prev - 1, 1))}>−</button>
                  <input
                    type="number"
                    className="input-field"
                    value={remainingQuantity}
                    min="1"
                    max={product.quantity - product.fulfilledQuantity}
                    readOnly
                  />
                  <button type="button" onClick={() => setRemainingQuantity(prev => Math.min(prev + 1, product.quantity - product.fulfilledQuantity))}>+</button>
                </div>
              </div>
          )}
          </div>
        )}

        <textarea
          className="input-textarea"
          placeholder="Comentarios opcionales"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />

        <div className="button-group">
          <button className="cancel-button" onClick={onClose}>Cancelar</button>
          <button className="reject-button" onClick={() => handleDecision("reject")}>Rechazar</button>
          <button className="approve-button" onClick={() => handleDecision("approve")}>Aprobar</button>
        </div>
      </div>
    </div>
  );
};




export default SellerBackOrders;

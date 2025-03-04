import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../services/axiosInstance";
import "./BackOrderDetailsModal.css"; // ✅ Hoja de estilos mejorada
import HistoryModal from "./HistoryModal";
import Swal from "sweetalert2";


const BackOrderDetailsModal = ({ order, setOrder, onClose }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAssignProviderModal, setShowAssignProviderModal] = useState(false);
  const [showConfirmSupplierModal, setShowConfirmSupplierModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showConfirmShipmentModal, setShowConfirmShipmentModal] = useState(false);
  const [showFulfillProductModal, setShowFulfillProductModal] = useState(false);
  const [creatorName, setCreatorName] = useState("Cargando...");
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedRevertStatus, setSelectedRevertStatus] = useState("");
  const [selectedReceiveProduct, setSelectedReceiveProduct] = useState(null);
  const [openOptionsMenu, setOpenOptionsMenu] = useState(null);
  const menuRef = useRef(null); 

  useEffect(() => {
    if (!order.createdBy) {
      setCreatorName("Usuario no asignado");
      return;
    }

    // 🔹 Si createdBy ya tiene el nombre, úsalo directamente
    if (typeof order.createdBy === "object" && order.createdBy.name) {
      setCreatorName(order.createdBy.name);
    } else {
      // 🔹 Si solo es un ID, hacer la petición para obtener el usuario
      fetchBackOrderCreator(order.createdBy);
    }
  }, [order.createdBy]);
  
  const toggleOptionsMenu = (productId) => {
    setOpenOptionsMenu(openOptionsMenu === productId ? null : productId);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenOptionsMenu(null);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const openReceiveModal = (product) => {
    setSelectedReceiveProduct(product);
    setShowReceiveModal(true);
  };
  
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  const handleDeleteBackOrder = async () => {
    if (!order._id) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontró el ID del Back Order.",
      });
      return;
    }
  
    const result = await Swal.fire({
      title: "¿Eliminar Back Order?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
  
    if (!result.isConfirmed) return;
  
    try {
      await axiosInstance.delete(`/backorders/${order._id}`);
  
      Swal.fire({
        icon: "success",
        title: "Back Order eliminado",
        text: "Se ha eliminado correctamente.",
        showConfirmButton: false,
        timer: 2500,
      }).then(() => {
        // window.location.reload(); // 🔄 Recargar la página después de eliminar
      });
  
      onClose(); // Cierra el modal antes de la recarga
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al eliminar",
        text: "Hubo un problema al eliminar el Back Order.",
      });
      console.error("❌ Error al eliminar el Back Order:", error.response?.data || error);
    }
  };

  const handleCancelProduct = (product) => {
    if (window.confirm("¿Estás seguro de cancelar este producto? Esta acción no se puede deshacer.")) {
      // Lógica para cancelar el producto
      alert(`Producto ${product.product.description} cancelado.`);
    }
  };

  // 🔹 Abrir modal de denegación
  const openRejectModal = (product) => {
    setSelectedProduct(product);
    setShowRejectModal(true);
  };

  const openRevertModal = (product, targetStatus) => {
    if (!targetStatus) {
      alert("❌ Estado no válido para revertir.");
      return;
    }
  
    setSelectedProduct(product);
    setSelectedRevertStatus(targetStatus); // Estado al que se revertirá
    setShowRevertModal(true);
  };

  // 🔹 Abrir modal de asignación de proveedor
  const openAssignProviderModal = (product) => {
    setSelectedProduct(product);
    setShowAssignProviderModal(true);
  };

  const openConfirmSupplierModal = (product) => {
    setSelectedProduct(product);
    setShowConfirmSupplierModal(true);
  };
  
  // 🔹 Abrir modal de historial
  const openHistoryModal = () => {
    setShowHistoryModal(true);
  };

  const openFulfillProductModal = (product) => {
    setSelectedProduct(product);
    setShowFulfillProductModal(true);
  };

  const openConfirmShipmentModal = (product) => {
    setSelectedProduct(product);
    setShowConfirmShipmentModal(true);
  };

  const getAvailableActions = (product) => {
    const validReversions = {
      denied: [{ label: "Revertir a Pendiente", revertTo: "pending", icon: "🔄" }],
      in_process: [
        { label: "Revertir a Pendiente", revertTo: "pending", icon: "🔄" },
        { label: "Denegar Producto", revertTo: "denied", icon: "❌" }
      ],
      pending_approval: [
        { label: "Revertir a En Proceso", revertTo: "in_process", icon: "🔄" },
        { label: "Revertir a Pendiente", revertTo: "pending", icon: "🔙" }
      ],
      shipped: [{ label: "Revertir a En Proceso", revertTo: "in_process", icon: "📦" }],
      fulfilled: [{ label: "Revertir a Parcialmente Surtido", revertTo: "partial", icon: "📌" }],
      delayed: [{ label: "Revertir a En Proceso de Surtimiento", revertTo: "in_delivery_process", icon: "🚛" }]
    };
  
    return validReversions[product.status] || [];
  };

  const fetchBackOrderCreator = async (userId) => {
    try {
      const response = await axiosInstance.get(`/users/${userId}`);
      console.log("Usuario creador del Back Order:", response.data);
      setCreatorName(response.data.name || "Usuario desconocido");
    } catch (error) {
      console.error("❌ Error al obtener el creador del Back Order:", error);
      setCreatorName("Usuario no encontrado");
    }
  };

  const updateProductStatus = (orderId, productId, newStatus) => {
    setOrder((prevOrder) => ({
      ...prevOrder,
      products: prevOrder.products.map((p) =>
        p._id === productId ? { ...p, status: newStatus } : p
      ),
    }));
  };

  const statusMap = {
    pending: "Pendiente",
    denied: "Denegado",
    in_process: "En Proceso",
    pending_approval: "Esperando Aprobación",
    in_delivery_process: "En Envío",
    partial: "Parcialmente Surtido",
    fulfilled: "Completado",
    delayed: "Retrasado",
  };

  // Mensaje informativo si no hay acciones que ejecutar
  const getActionMessage = (status) => {
    switch (status) {
      case "pending_approval":
        return "Esperando aprobación del vendedor.";
      case "fulfilled":
        return "Surtimiento completado.";
      case "denied":
        return "Articulo denegado.";
      default:
        return "";
    }
  };

  const ConfirmShipmentModal = ({ product, orderId, onClose, updateProductStatus }) => {
    const [shipmentDate, setShipmentDate] = useState("");
  
    // ✅ Precargar la fecha promesa si existe
    useEffect(() => {
      if (product.promiseDate) {
        setShipmentDate(new Date(product.promiseDate).toISOString().split("T")[0]); // ✅ Formato YYYY-MM-DD
      }
    }, [product]);
  
    const handleConfirmShipment = async () => {
      if (!shipmentDate) {
        alert("Debe seleccionar una fecha de envío.");
        return;
      }
  
      try {
        const response = await axiosInstance.put(`/backorders/${orderId}/products/${product._id}/confirm-shipment`, {
          shipmentDate,
        });
  
        Toast.fire({
          icon: "success",
          title: "Envío confirmado correctamente.",
        });
        
        // ✅ Actualizar estado local del producto a "shipped"
        updateProductStatus(orderId, product._id, "shipped");
  
        // ✅ Mostrar la fecha confirmada en la UI
        updateProductStatus(orderId, product._id, { status: "shipped", promiseDate: shipmentDate });
  
        onClose();
      } catch (error) {
        console.error("❌ Error al confirmar envío:", error.response?.data || error);
        alert("Hubo un error al registrar la confirmación de envío.");
      }
    };
  
    return (
      <div className="modal-overlay">
        <div className="modal-box">
          <h2 className="modal-title">📦 Confirmar Envío del Proveedor</h2>
  
          {/* 🔹 Sección de información del producto */}
          <div className="product-info">
            <p><strong>Producto:</strong> {product.product?.description}</p>
            <p><strong>Proveedor:</strong> {product.provider || "No asignado"}</p>
          </div>
  
          {/* 🔹 Sección de selección de fecha */}
          <div className="date-section">
            <label>Fecha de Envío Real:</label>
            <input
              type="date"
              value={shipmentDate}
              onChange={(e) => setShipmentDate(e.target.value)}
            />
          </div>
  
          {/* 🔹 Botones con mejor organización */}
          <div className="modal-buttons">
            <button className="approve-button" onClick={handleConfirmShipment}>Confirmar Envío</button>
            <button className="close-button" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    );
  };

  const FulfillProductModal = ({ product, orderId, onClose, updateProductStatus }) => {
    const [fulfilledQuantity, setFulfilledQuantity] = useState(product.fulfilledQuantity || product.quantity);
    const [comments, setComments] = useState("");
    const [isLoading, setIsLoading] = useState(false);
  
    const handleFulfillProduct = async () => {
      if (fulfilledQuantity < 0 || fulfilledQuantity > product.quantity) {
        alert("La cantidad surtida debe estar entre 0 y la cantidad solicitada.");
        return;
      }
  
      setIsLoading(true);
      try {
        console.log(`📤 Enviando confirmación de surtimiento a: /backorders/${orderId}/products/${product._id}/fulfillment`);
  
        const response = await axiosInstance.put(
          `/backorders/${orderId}/products/${product._id}/fulfillment`,
          { fulfilledQuantity, comments }
        );
  
        Toast.fire({
          icon: "success",
          title: "Surtimiento confirmado correctamente.",
        });
        
        // Actualizar el estado del producto en la UI
        const newStatus = fulfilledQuantity === 0 ? "denied" : fulfilledQuantity < product.quantity ? "partial" : "fulfilled";
        updateProductStatus(orderId, product._id, newStatus);
  
        onClose();
      } catch (error) {
        console.error("❌ Error al confirmar surtimiento:", error.response?.data || error);
        alert("Hubo un error al confirmar el surtimiento.");
      } finally {
        setIsLoading(false);
      }
    };
  
    return (
      <div className="modal-overlay">
        <div className="modal-box">
          <h2>Confirmar Surtimiento</h2>
          <p><strong>Producto:</strong> {product.product?.description}</p>
          <p><strong>Cantidad Solicitada:</strong> {product.quantity}</p>
  
          <label>Cantidad Surtida:</label>
          <input 
            type="number" 
            value={fulfilledQuantity} 
            min="0" 
            max={product.quantity} 
            onChange={(e) => setFulfilledQuantity(Number(e.target.value))} 
          />
  
          <label>Comentarios (opcional):</label>
          <textarea 
            value={comments} 
            onChange={(e) => setComments(e.target.value)} 
            placeholder="Observaciones sobre el surtimiento..."
          />
  
          <div className="modal-buttons">
            <button className="approve-button" onClick={handleFulfillProduct} disabled={isLoading}>
              ✅ Confirmar
            </button>
            <button className="cancel-button" onClick={onClose} disabled={isLoading}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // 🔹 Modal de Confirmación de Surtimiento
  const ConfirmSupplierResponseModal = ({ product, orderId, onClose, setOrder }) => {
    const [fulfilledQuantity, setFulfilledQuantity] = useState(product.quantity);
    const [deniedQuantity, setDeniedQuantity] = useState(0);
    const [promiseDate, setPromiseDate] = useState("");
    const [price, setPrice] = useState(product.price || 0);
    const [isLoading, setIsLoading] = useState(false);
    const today = new Date().toISOString().split("T")[0]; // 🔹 Obtiene la fecha de hoy en formato YYYY-MM-DD
    const handleDateChange = (e) => {
      const selectedDate = e.target.value;
      if (selectedDate < today) {
        alert("⚠️ La fecha promesa no puede ser anterior a hoy.");
        setPromiseDate(today);
      } else {
        setPromiseDate(selectedDate);
      }
    };
  
    useEffect(() => {
      setDeniedQuantity(product.quantity - fulfilledQuantity);
    }, [fulfilledQuantity, product.quantity]);
  
    const handleIncrease = () => {
      setFulfilledQuantity(prev => (prev < product.quantity ? prev + 1 : prev));
    };
  
    const handleDecrease = () => {
      setFulfilledQuantity(prev => (prev > 0 ? prev - 1 : prev));
    };
    const handleConfirmSupplierResponse = async () => {
      if (!product || !product._id) {
        alert("❌ Error: No se encontró el producto seleccionado.");
        return;
      }
  
      if (!orderId) {
        alert("❌ Error: No se encontró el ID del Back Order.");
        return;
      }
  
      if (fulfilledQuantity <= 0) {
        alert("⚠️ La cantidad a surtir debe ser mayor a 0.");
        return;
      }
  
      if (!promiseDate) {
        alert("⚠️ Debe seleccionar una fecha promesa.");
        return;
      }
  
      if (price <= 0) {
        alert("⚠️ El precio debe ser mayor a 0.");
        return;
      }
  
      setIsLoading(true);
      try {
        console.log(`✅ Enviando solicitud a: /backorders/${orderId}/products/${product._id}/supplier-confirmation`);
  
        const response = await axiosInstance.put(
          `/backorders/${orderId}/products/${product._id}/supplier-confirmation`,
          {
            fulfilledQuantity,
            deniedQuantity: product.quantity - fulfilledQuantity,
            promiseDate,
            price,
          }
        );
  
        console.log("✅ Respuesta del servidor:", response.data);
        Toast.fire({
          icon: "success",
          title: "Cantidad, precio y fecha promesa registradas correctamente.",
        });

        setOrder((prevOrder) => ({
          ...prevOrder,
          products: prevOrder.products.map((p) =>
            p._id === product._id
              ? { 
                  ...p, 
                  ...response.data.product, // 🔹 Mantiene los datos existentes y actualiza los nuevos
                  description: response.data.product.description || p.description, // ✅ Asegura que la descripción se mantenga
                  product: p.product || response.data.product.product, // ✅ Asegura que el ID del producto no se pierda
                }
              : p
          ),
        }));
        
        onClose();
      } catch (error) {
        console.error("❌ Error al confirmar surtimiento:", error);
        alert("❌ Hubo un error al registrar la información.");
      } finally {
        setIsLoading(false);
      }
    };
  
    return (
      <div className="modal-overlay">
        <div className="modal-box">
          <h2>Confirmar Surtimiento</h2>
  
          <p><strong>Proveedor:</strong> {product.provider || "No asignado"}</p>
          <p><strong>Cantidad Solicitada:</strong> {product.quantity}</p>
  
          {/* Input de cantidad con botones */}
          <label>Cantidad a Surtir:</label>
          <div className="input-group">
            <button type="button" onClick={handleDecrease}>−</button>
            <input 
              type="number" 
              value={fulfilledQuantity} 
              min="0" 
              max={product.quantity} 
              onChange={(e) => setFulfilledQuantity(Number(e.target.value))} 
            />
            <button type="button" onClick={handleIncrease}>+</button>
          </div>
  
          <p><strong>Cantidad Denegada:</strong> {deniedQuantity}</p>
  
          <label>Fecha Promesa:</label>
          <input 
            type="date"
            className="input-fecha-promesa"
            value={promiseDate}
            min={today}  // 🔹 Evita seleccionar fechas pasadas
            onChange={handleDateChange}
          />
  
          {/* Input de precio mejorado */}
          <label>Precio del Producto:</label>
          <input
            type="number"
            className="price-input"
            value={price}
            min="0"
            step="0.01"
            onChange={(e) => setPrice(Number(e.target.value))}
          />
  
          <div className="modal-buttons">
            <button className="approve-button" onClick={handleConfirmSupplierResponse} disabled={isLoading}>
              Confirmar
            </button>
            <button className="cancel-button" onClick={onClose} disabled={isLoading}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="backorder-modal-overlay" onClick={onClose}>
      <div className="backorder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex-titulos">
          <h2 className="backorder-modal-title">Detalles del Back Order</h2>
          <div className="history-button_details-button__container">
            <button className="history-button details-button" onClick={openHistoryModal}>
              Ver Historial
            </button>
            <button className="delete-button" onClick={handleDeleteBackOrder}>
              <svg class="delete-button-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path fill-rule="evenodd" d="M8.586 2.586A2 2 0 0 1 10 2h4a2 2 0 0 1 2 2v2h3a1 1 0 1 1 0 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a1 1 0 0 1 0-2h3V4a2 2 0 0 1 .586-1.414ZM10 6h4V4h-4v2Zm1 4a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Zm4 0a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="backorder-client-info">
          <strong>Cliente:</strong> {order.client?.name || "Cliente no asignado"}
        </div>  
        <div className="backorder-client-info">
          <p><strong>Creado por:</strong> {creatorName}</p>
        </div>

        {/* 🔹 Tabla de productos */}
        <div className="table-responsive">        
        <table className="backorder-product-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Cantidad</th>
              <th>Comentarios</th> {/* ✅ Nueva columna de comentarios */}
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {order.products?.map((product) => (
              <tr key={product._id}>
                <td>{product.product?.description || "Producto sin descripción"}</td>
                <td>{product.internalCode}</td>
                <td>{product.quantity}</td>
                <td>{product.comments || "Sin comentarios"}</td> {/* ✅ Muestra los comentarios */}
                <td>{statusMap[product.status] || "Desconocido"}</td>
                <td className="actions-buttons">
                  {product.status === "pending" ? (
                    <>
                      <button className="action-button deny" onClick={() => openRejectModal(product)}>
                        Denegar Producto
                      </button>
                      <button className="action-button approve" onClick={() => openAssignProviderModal(product)}>
                        Asignar Proveedor
                      </button>
                    </>
                  ) : product.status === "in_process" ? (
                    <button className="action-button process" onClick={() => openConfirmSupplierModal(product)}>
                      📦 Confirmar Surtimiento
                    </button>
                  ) : (
                    <span className="status-label">{getActionMessage(product.status)}</span>
                  )}
                  {product.status === "shipped" ? (
                    <button className="action-button process" onClick={() => openConfirmShipmentModal(product)}>
                      🚛 Confirmar Envío
                    </button>
                  ) : (
                    <span className="status-label"></span>
                  )}
                  {product.status === "in_delivery_process" ? (
                  <button className="action-button receive" onClick={() => openReceiveModal(product)}>📦 Registrar Recepción
                  </button>
                  ) : (
                    <span className="status-label"></span>
                  )}
                </td>
                <td className="options-menu-td">
                  <div className="options-menu">
                    {/* Botón para abrir el menú de opciones */}
                    <button
                      className="options-button"
                      onClick={() => toggleOptionsMenu(product._id)}
                    >
                      ⋮
                    </button>

                    {/* Menú desplegable con acciones disponibles */}
                    {openOptionsMenu === product._id && getAvailableActions(product).length > 0 && (
                      <div ref={menuRef} className="options-dropdown">
                        {getAvailableActions(product).map((action) => (
                          <button
                            key={action.label}
                            onClick={() => openRevertModal(product, action.revertTo)}
                          >
                            {action.icon} {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        
        {showConfirmSupplierModal && (
          <ConfirmSupplierResponseModal 
            product={selectedProduct} 
            orderId={order._id} 
            onClose={() => setShowConfirmSupplierModal(false)} 
            setOrder={setOrder} 
          />
        )}

        {/* 🔹 Renderiza los modales solo si están activos */}
        {showRejectModal && (
          <RejectProductModal 
            product={selectedProduct} 
            orderId={order._id} // ✅ Pasar el ID del Back Order correctamente
            onClose={() => setShowRejectModal(false)} 
            setOrder={setOrder} 
          />
        )}

        {showAssignProviderModal && (
          <AssignProviderModal 
            product={selectedProduct} 
            orderId={order._id} // ✅ Pasar el ID del Back Order correctamente
            onClose={() => setShowAssignProviderModal(false)} 
            setOrder={setOrder} 
          />
        )}

        {showConfirmShipmentModal && selectedProduct && (
          <ConfirmShipmentModal
            product={selectedProduct}
            orderId={order._id}
            onClose={() => setShowConfirmShipmentModal(false)}
            updateProductStatus={updateProductStatus} // ✅ Se pasa la función como prop
          />
        )}

        {showRevertModal && selectedProduct && (
          <RevertStatusModal
            product={selectedProduct}
            orderId={order._id}
            revertStatus={selectedRevertStatus}
            onClose={() => setShowRevertModal(false)}
            updateProductStatus={updateProductStatus}
          />
        )}

        {showReceiveModal && selectedReceiveProduct && (
          <ReceiveProductModal
            product={selectedReceiveProduct}
            orderId={order._id}
            onClose={() => setShowReceiveModal(false)}
            updateProductStatus={updateProductStatus}
          />
        )}

        {showFulfillProductModal && selectedProduct && (
          <FulfillProductModal
            product={selectedProduct}
            orderId={order._id}
            onClose={() => setShowFulfillProductModal(false)}
            updateProductStatus={updateProductStatus}
          />
        )}

        {showHistoryModal && <HistoryModal history={order.products.flatMap(p => p.history || [])} onClose={() => setShowHistoryModal(false)} />}

        <button className="backorder-close-button" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};


// 🔹 Modal de Denegación de Producto
const RejectProductModal = ({ product, orderId, onClose, setOrder }) => {
  const [comments, setComments] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Obtener el usuario desde localStorage de forma segura
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user?.name || "Usuario desconocido";

  // ✅ Verificar que `product` y `orderId` estén definidos antes de ejecutar la acción
  const handleRejectProduct = async () => {
    if (!product || !product._id) {
      alert("Error: No se encontró el producto seleccionado.");
      return;
    }
  
    if (!orderId) {
      alert("Error: No se encontró el ID del Back Order.");
      return;
    }
  
    if (!comments.trim()) {
      alert("Debe proporcionar un motivo de denegación.");
      return;
    }
  
    // ✅ Obtener usuario de localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userName = user?.name || "Usuario desconocido";
  
    setIsLoading(true);
    try {
      console.log("🟢 Enviando solicitud de rechazo a:", `/backorders/${orderId}/products/${product._id}/reject`);
  
      const response = await axiosInstance.put(`/backorders/${orderId}/products/${product._id}/reject`, {
        comments,
        user: userName, // ✅ Asegurar que se envía el nombre del usuario
      });
  
      console.log("✅ Respuesta del servidor:", response.data);

      Toast.fire({
        icon: "success",
        title: "Producto denegado correctamente."
      });
  
      // ✅ Actualizar estado local
      setOrder((prevOrder) => ({
        ...prevOrder,
        products: prevOrder.products.map((p) =>
          p._id === product._id
            ? { 
                ...p, 
                ...response.data.product, // 🔹 Mantiene los datos existentes y actualiza los nuevos
                description: response.data.product.description || p.description, // ✅ Asegura que la descripción se mantenga
                product: p.product || response.data.product.product, // ✅ Asegura que el ID del producto no se pierda
              }
            : p
        ),
      }));
  
      onClose();
    } catch (error) {
      console.error("❌ Error al denegar el producto:", error);
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
        icon: "error",
        title: "Hubo un error al denegar el producto.."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Denegar Producto</h2>
        <label>Motivo de Denegación:</label>
        <textarea className="motivo-input" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Escribe el motivo..." />
        <div className="modal-buttons">
          <button className="deny-button" onClick={handleRejectProduct} disabled={isLoading}>
            Confirmar
          </button>
          <button className="cancel-button cancel-button-denegar" onClick={onClose} disabled={isLoading}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const AssignProviderModal = ({ product, orderId, onClose, setOrder }) => {
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [providerSearch, setProviderSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [comments, setComments] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const suggestionsRef = useRef([]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await axiosInstance.get("/providers");
        setProviders(response.data.providers);
      } catch (error) {
        console.error("Error al obtener proveedores:", error);
      }
    };

    fetchProviders();
  }, []);

  useEffect(() => {
    if (providerSearch.trim() === "" || selectedProvider) {
      setFilteredProviders([]);
      return;
    }

    const fetchFilteredProviders = async () => {
      try {
        const response = await axiosInstance.get("/providers", { params: { search: providerSearch } });
        setFilteredProviders(response.data.providers || []);
      } catch (error) {
        console.error("Error al buscar proveedores:", error);
        setFilteredProviders([]);
      }
    };

    const debounceTimeout = setTimeout(fetchFilteredProviders, 300);
    return () => clearTimeout(debounceTimeout);
  }, [providerSearch]);

  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionsRef.current[highlightedIndex]) {
      suggestionsRef.current[highlightedIndex].scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightedIndex]);

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    setProviderSearch(provider.name);
    setFilteredProviders([]);
    setHighlightedIndex(-1);
  };

  const handleProviderKeyDown = (e) => {
    if (filteredProviders.length === 0) return;
    
    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) => (prev < filteredProviders.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredProviders.length - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      handleProviderSelect(filteredProviders[highlightedIndex]);
    }
  };

  const handleChangeProvider = () => {
    setSelectedProvider(null);
    setProviderSearch("");
  };

  const handleAssignProvider = async () => {
    if (!selectedProvider) {
      alert("Debe seleccionar un proveedor.");
      return;
    }

    setIsLoading(true);
    try {
      console.log("✅ Enviando solicitud a backend...");
      const response = await axiosInstance.put(
        `/backorders/${orderId}/products/${product._id}/provider-confirmation`,
        { provider: selectedProvider._id, comments }
      );

      console.log("✅ Respuesta del servidor:", response.data);

      setOrder((prevOrder) => ({
        ...prevOrder,
        products: prevOrder.products.map((p) =>
          p._id === product._id
            ? { 
                ...p, 
                ...response.data.product, // 🔹 Mantiene los datos existentes y actualiza los nuevos
                description: response.data.product.description || p.description, // ✅ Asegura que la descripción se mantenga
                product: p.product || response.data.product.product, // ✅ Asegura que el ID del producto no se pierda
              }
            : p
        ),
      }));

      Toast.fire({
        icon: "success",
        title: "Proveedor asignado correctamente.",
      });
      onClose();
    } catch (error) {
      console.error("❌ Error al asignar proveedor:", error);
      alert("Hubo un error al asignar proveedor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Asignar Proveedor</h2>
        <label>Buscar Proveedor:</label>
        <input
          type="text"
          placeholder="Escriba para buscar un proveedor..."
          value={providerSearch}
          className="input-busqueda-provaider"
          onChange={(e) => setProviderSearch(e.target.value)}
          onKeyDown={handleProviderKeyDown}
          disabled={selectedProvider !== null} // Deshabilita el input si ya se seleccionó un proveedor
        />
        
        {filteredProviders.length > 0 && !selectedProvider && (
          <ul className="suggestions-provaider">
            {filteredProviders.map((provider, index) => (
              <li
                key={provider._id}
                ref={(el) => (suggestionsRef.current[index] = el)}
                onClick={() => handleProviderSelect(provider)}
                className={`suggestion-item ${highlightedIndex === index ? "highlighted" : ""}`}
              >
                {provider.name} - {provider.contact || "Sin contacto"}
              </li>
            ))}
          </ul>
        )}

        {/* Mostrar la información del proveedor seleccionado */}
        {selectedProvider && (
          <div className="provider-info">
            <h3>Proveedor Seleccionado</h3>
            <p><strong>Nombre:</strong> {selectedProvider.name}</p>
            <p><strong>Contacto:</strong> {selectedProvider.contactInfo?.contact || "No disponible"}</p>
            <p><strong>Email:</strong> {selectedProvider.contactInfo?.email || "No disponible"}</p>
            <p><strong>Teléfono:</strong> {selectedProvider.contactInfo?.phone || "No disponible"}</p>

            <button className="change-provider-btn" onClick={handleChangeProvider}>
              Cambiar Proveedor
            </button>
          </div>
        )}

        <div className="modal-buttons">
          <button className="approve-button" onClick={handleAssignProvider} disabled={isLoading}>
            Confirmar
          </button>
          <button className="cancel-button" onClick={onClose} disabled={isLoading}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

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

const RevertStatusModal = ({ product, orderId, revertStatus, onClose, updateProductStatus }) => {
  const [loading, setLoading] = useState(false);

  const handleRevert = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.put(
        `/backorders/${orderId}/products/${product._id}/revert-status`,
        { previousStatus: revertStatus, updatedBy: JSON.parse(localStorage.getItem("user")).name }
      );

      console.log("✅ Respuesta del servidor:", response.data);

      if (response.status === 200) {
        Toast.fire({
          icon: "success",
          title: `Estado revertido a ${revertStatus} con éxito.`,
        });

        updateProductStatus(orderId, product._id, revertStatus);
        onClose();
      } else {
        throw new Error("No se pudo revertir el estado.");
      }
    } catch (error) {
      console.error("❌ Error al revertir estado:", error);
      Toast.fire({
        icon: "error",
        title: error.response?.data?.message || "⚠️ No se pudo revertir el estado.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Revertir Estado del Producto</h2>
        <p>¿Estás seguro de que deseas revertir el producto <strong>{product.product?.description}</strong> al estado <strong>{revertStatus}</strong>?</p>

        <div className="modal-buttons">
          <button onClick={handleRevert} disabled={loading} className="confirm-btn">
            {loading ? "Procesando..." : "Confirmar"}
          </button>
          <button onClick={onClose} className="cancel-btn">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const ReceiveProductModal = ({ product, orderId, onClose, updateProductStatus }) => {
  const [receivedQuantity, setReceivedQuantity] = useState(product.fulfilledQuantity || 0);
  const [isLoading, setIsLoading] = useState(false);

  const handleReceiveProduct = async () => {
    if (receivedQuantity < 0) {
      alert("La cantidad recibida no puede ser negativa.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.put(
        `/backorders/${orderId}/products/${product._id}/receive`,
        { receivedQuantity }
      );

      Toast.fire({
        icon: "success",
        title: "Recepción registrada correctamente.",
      });
      
      const newStatus = receivedQuantity === 0 ? "denied" : "fulfilled";
      updateProductStatus(orderId, product._id, newStatus);
      onClose();
    } catch (error) {
      console.error("❌ Error al registrar la recepción:", error.response?.data || error);
      alert("Hubo un error al registrar la recepción.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2 className="modal-title">Registrar Recepción del Producto</h2>
        
        <div className="">
          <p><strong>Producto:</strong> {product.product?.description}</p>
          <p><strong>Cantidad Esperada:</strong> {product.fulfilledQuantity}</p>

          <label className="input-label">Cantidad Recibida:</label>
          <input
            type="number"
            min="0"
            max={product.fulfilledQuantity}
            value={receivedQuantity}
            onChange={(e) => setReceivedQuantity(Number(e.target.value))}
            className="input-field"
          />
        </div>

        <div className="modal-buttons">
          <button className="approve-button" onClick={handleReceiveProduct} disabled={isLoading}>
            Confirmar
          </button>
          <button className="close-button" onClick={onClose} disabled={isLoading}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};


export default BackOrderDetailsModal;

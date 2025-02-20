import React, { useState, useEffect } from "react";
import axiosInstance from "../services/axiosInstance";
import BackOrderDetailsModal from "../components/BackOrderDetailsModal";
import "./PurchaseManagerBackOrders.css"; // ✅ Nueva hoja de estilos
import jsPDF from "jspdf";
import "jspdf-autotable";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

const PurchaseManagerBackOrders = () => {
  const [backOrders, setBackOrders] = useState([]);
  const [filteredBackOrders, setFilteredBackOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [aggregatedView, setAggregatedView] = useState(false);
  const [aggregatedBackOrders, setAggregatedBackOrders] = useState({});
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedProvider, setSelectedProvider] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [searchClient, setSearchClient] = useState("");
  const [filteredAggregatedBackOrders, setFilteredAggregatedBackOrders] = useState(aggregatedBackOrders);
  const userRole = JSON.parse(localStorage.getItem("user"))?.role || "vendedor";

  useEffect(() => {
    fetchBackOrders();
  }, []);
  useEffect(() => {
    setFilteredAggregatedBackOrders(aggregatedBackOrders);
  }, [aggregatedBackOrders]);
  
  useEffect(() => {
    if (aggregatedView) {
      fetchAggregatedBackOrders();
    }
  }, [aggregatedView]);

  const toggleRowExpansion = (provider, productName) => {
    setExpandedRows((prevExpandedRows) => ({
      ...prevExpandedRows,
      [`${provider}-${productName}`]: !prevExpandedRows[`${provider}-${productName}`],
    }));
  };
 
  const applyFilters = () => {
    if (!aggregatedBackOrders || Object.keys(aggregatedBackOrders).length === 0) {
      console.log("❌ No hay datos para filtrar.");
      return;
    }
  
    let filteredData = JSON.parse(JSON.stringify(aggregatedBackOrders)); // Clonamos para evitar modificar el original
    // ✅ Si no hay filtros aplicados, mostrar todos los datos
    if (!selectedProvider && !searchProduct && !selectedStatus && !searchClient && !startDate && !endDate) {
      setFilteredAggregatedBackOrders(aggregatedBackOrders);
      return;
    }
  
    // 🔹 1️⃣ Filtro por Proveedor
    if (selectedProvider) {
      filteredData = Object.fromEntries(
        Object.entries(filteredData).filter(([provider]) =>
          provider.toLowerCase().includes(selectedProvider.toLowerCase())
        )
      );
    }
  
    // 🔹 2️⃣ Filtro por Producto
    if (searchProduct.trim()) {
      filteredData = Object.fromEntries(
        Object.entries(filteredData).map(([provider, products]) => [
          provider,
          Object.fromEntries(
            Object.entries(products).filter(([productName]) =>
              productName.toLowerCase().includes(searchProduct.toLowerCase())
            )
          ),
        ]).filter(([_, products]) => Object.keys(products).length > 0)
      );
    }
  
    // 🔹 3️⃣ Filtro por Estado de Producto
    if (selectedStatus) {
      filteredData = Object.fromEntries(
        Object.entries(filteredData).map(([provider, products]) => [
          provider,
          Object.fromEntries(
            Object.entries(products).map(([productName, productData]) => [
              productName,
              {
                ...productData,
                details: productData.details.filter((detail) => 
                  detail.status.toLowerCase() === selectedStatus.toLowerCase()
                ),
              },
            ]).filter(([_, productData]) => productData.details.length > 0),
          ),
        ]).filter(([_, products]) => Object.keys(products).length > 0)
      );
    }
  
    // 🔹 4️⃣ Filtro por Cliente
    if (searchClient.trim()) {
      filteredData = Object.fromEntries(
        Object.entries(filteredData).map(([provider, products]) => [
          provider,
          Object.fromEntries(
            Object.entries(products).map(([productName, productData]) => [
              productName,
              {
                ...productData,
                details: productData.details.filter((detail) =>
                  detail.client.toLowerCase().includes(searchClient.toLowerCase())
                ),
              },
            ]).filter(([_, productData]) => productData.details.length > 0),
          ),
        ]).filter(([_, products]) => Object.keys(products).length > 0)
      );
    }
  
    // 🔹 5️⃣ Filtro por Rango de Fechas
    if (startDate || endDate) {
      filteredData = Object.fromEntries(
        Object.entries(filteredData).map(([provider, products]) => [
          provider,
          Object.fromEntries(
            Object.entries(products).map(([productName, productData]) => [
              productName,
              {
                ...productData,
                details: productData.details.filter((detail) => {
                  const orderDate = new Date(detail.createdAt);
                  return (!startDate || orderDate >= new Date(startDate)) &&
                         (!endDate || orderDate <= new Date(endDate));
                }),
              },
            ]).filter(([_, productData]) => productData.details.length > 0),
          ),
        ]).filter(([_, products]) => Object.keys(products).length > 0)
      );
    }
  
    // ✅ 6️⃣ Verificar si hay datos después del filtrado
    if (Object.keys(filteredData).length === 0) {
      console.log("⚠️ No hay resultados después del filtrado.");
    }
  
    // ✅ 7️⃣ Aplicar los datos filtrados al estado
    console.log("🔍 Filtros aplicados correctamente:", filteredData);
    setFilteredAggregatedBackOrders(filteredData);
  };

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

  const aggregateProductsByProvider = () => {
    const aggregated = {};
    backOrders.forEach(order => {
      order.products.forEach(product => {
        if (!aggregated[product.provider]) {
          aggregated[product.provider] = {};
        }
        if (!aggregated[product.provider][product.name]) {
          aggregated[product.provider][product.name] = { total: 0, orders: [] };
        }
        aggregated[product.provider][product.name].total += product.quantity;
        aggregated[product.provider][product.name].orders.push(order);
      });
    });
    return aggregated;
  };

  const exportToCSV = () => {
    let csvContent = "Proveedor,Producto,Cantidad Total\n";
    const aggregated = aggregateProductsByProvider();
    Object.keys(aggregated).forEach(provider => {
      Object.keys(aggregated[provider]).forEach(product => {
        csvContent += `${provider},${product},${aggregated[provider][product].total}\n`;
      });
    });
    const blob = new Blob([csvContent], { type: "text/csv" });
    saveAs(blob, "productos_backorders.csv");
  };

  // 🔹 Exportar a PDF
  const exportToPDF = () => {
    let dataToExport = aggregatedView ? filteredAggregatedBackOrders : filteredBackOrders;

    if (!dataToExport || Object.keys(dataToExport).length === 0) {
      alert("⚠️ No hay datos para exportar.");
      return;
    }

    const doc = new jsPDF();
    doc.text("Reporte de Back Orders", 14, 15);

    let tableColumn = [];
    let tableRows = [];

    if (aggregatedView) {
      // Configuración de columnas para la vista de Producto/Proveedor
      tableColumn = ["Proveedor", "Producto", "Cantidad Total", "Cliente", "Cantidad", "Estado", "Vendedor"];
    
      Object.entries(dataToExport).forEach(([provider, products]) => {
        Object.entries(products).forEach(([productName, productData]) => {
          productData.details.forEach(detail => {
            tableRows.push([
              provider,
              productName,
              productData.totalQuantity,
              detail.client,
              detail.quantity,
              statusLabels[detail.status] || detail.status,
              detail.createdBy || "Usuario no asignado", // 🔹 Agregar el usuario
            ]);
          });
        });
      });
    } else {
      // Configuración de columnas para la vista de Back Orders
      tableColumn = ["Cliente", "Producto", "Cantidad", "Proveedor", "Estado", "Fecha", "Vendedor"];
    
      dataToExport.forEach(order => {
        order.products.forEach(product => {
          tableRows.push([
            order.client ? order.client.name : "Cliente no asignado",
            product.description,
            product.quantity,
            product.provider,
            statusLabels[product.status] || product.status,
            new Date(order.createdAt).toLocaleDateString(),
            order.createdBy?.name || "Usuario no asignado", // 🔹 Agregar el usuario
          ]);
        });
      });
    }

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 10 },
    });

    doc.save("BackOrders.pdf");
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

  const exportToExcel = () => {
    let dataToExport = aggregatedView ? filteredAggregatedBackOrders : filteredBackOrders;
  
    if (!dataToExport || Object.keys(dataToExport).length === 0) {
      alert("⚠️ No hay datos para exportar.");
      return;
    }
  
    let data = [];
  
    if (aggregatedView) {
      // Exportación desde vista de Proveedor y Producto
      Object.entries(dataToExport).forEach(([provider, products]) => {
        Object.entries(products).forEach(([productName, productData]) => {
          productData.details.forEach(detail => {
            data.push({
              Proveedor: provider,
              Producto: productName,
              "Cantidad Total": productData.totalQuantity,
              Cliente: detail.client,
              Cantidad: detail.quantity,
              Estado: statusLabels[detail.status] || detail.status,
              Vendedor: detail.createdBy || "Usuario no asignado", // 🔹 Agregar usuario
            });
          });
        });
      });
    } else {
      // Exportación desde vista de Back Orders
      dataToExport.forEach(order => {
        order.products.forEach(product => {
          data.push({
            Cliente: order.client ? order.client.name : "Cliente no asignado",
            Producto: product.description,
            Cantidad: product.quantity,
            Proveedor: product.provider,
            Estado: statusLabels[product.status] || product.status,
            "Fecha de Creación": new Date(order.createdAt).toLocaleDateString(),
            Vendedor: order.createdBy?.name || "Usuario no asignado", // 🔹 Agregar usuario
          });
        });
      });
    }
  
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BackOrders");
  
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const excelFile = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
    saveAs(excelFile, "BackOrders.xlsx");
  };

  const fetchAggregatedBackOrders = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/backorders/aggregated");
      setAggregatedBackOrders(response.data);
    } catch (error) {
      console.error("Error obteniendo los datos agregados:", error);
    } finally {
      setLoading(false);
    }
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
    fulfilled: "Surtido Completo",
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
      <div className="container-buttons-top">
        <div>
        <button onClick={exportToExcel} className="export-button-excel details-button">
          <div className="button-export-data">
            <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2 2 2 0 0 0 2 2h12a2 2 0 0 0 2-2 2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2V4a2 2 0 0 0-2-2h-7Zm1.018 8.828a2.34 2.34 0 0 0-2.373 2.13v.008a2.32 2.32 0 0 0 2.06 2.497l.535.059a.993.993 0 0 0 .136.006.272.272 0 0 1 .263.367l-.008.02a.377.377 0 0 1-.018.044.49.49 0 0 1-.078.02 1.689 1.689 0 0 1-.297.021h-1.13a1 1 0 1 0 0 2h1.13c.417 0 .892-.05 1.324-.279.47-.248.78-.648.953-1.134a2.272 2.272 0 0 0-2.115-3.06l-.478-.052a.32.32 0 0 1-.285-.341.34.34 0 0 1 .344-.306l.94.02a1 1 0 1 0 .043-2l-.943-.02h-.003Zm7.933 1.482a1 1 0 1 0-1.902-.62l-.57 1.747-.522-1.726a1 1 0 0 0-1.914.578l1.443 4.773a1 1 0 0 0 1.908.021l1.557-4.773Zm-13.762.88a.647.647 0 0 1 .458-.19h1.018a1 1 0 1 0 0-2H6.647A2.647 2.647 0 0 0 4 13.647v1.706A2.647 2.647 0 0 0 6.647 18h1.018a1 1 0 1 0 0-2H6.647A.647.647 0 0 1 6 15.353v-1.706c0-.172.068-.336.19-.457Z" clip-rule="evenodd"/>
            </svg>
            Exportar a Excel
          </div>
          </button>
        <button onClick={exportToPDF} className="export-button-pdf details-button">
          <div className="button-export-data">
            <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2 2 2 0 0 0 2 2h12a2 2 0 0 0 2-2 2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2V4a2 2 0 0 0-2-2h-7Zm-6 9a1 1 0 0 0-1 1v5a1 1 0 1 0 2 0v-1h.5a2.5 2.5 0 0 0 0-5H5Zm1.5 3H6v-1h.5a.5.5 0 0 1 0 1Zm4.5-3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1.376A2.626 2.626 0 0 0 15 15.375v-1.75A2.626 2.626 0 0 0 12.375 11H11Zm1 5v-3h.375a.626.626 0 0 1 .625.626v1.748a.625.625 0 0 1-.626.626H12Zm5-5a1 1 0 0 0-1 1v5a1 1 0 1 0 2 0v-1h1a1 1 0 1 0 0-2h-1v-1h1a1 1 0 1 0 0-2h-2Z" clip-rule="evenodd"/>
            </svg>
            Exportar a PDF
          </div>
          </button>
        </div>
        <div className="refresh-container">
          <button onClick={() => setAggregatedView(!aggregatedView)} className="vista-toggle-bttn details-button">
          <div className="button-export-data">
            <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M8 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1h2a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2Zm6 1h-4v2H9a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2h-1V4Zm-3 8a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1Zm-2-1a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2H9Zm2 5a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1Zm-2-1a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2H9Z" clip-rule="evenodd"/>
            </svg>
            {aggregatedView ? "Ver por Back Orders" : "Ver por Producto y Proveedor"}
          </div>
          </button>
          <button
            className="refresh-button details-button"
            onClick={fetchBackOrders}
            disabled={loading}
          >
            🔄 {loading ? "Actualizando..." : "Refrescar"}
          </button>
        </div>
      </div>

      {/* 🔹 Contenedor de Filtros como Pestañas */}
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
      <div className="filters-wrapper" >
        {/* 🔹 Controles de Filtros */}
        <div className={aggregatedView ?"filters-container" : "hidden"} >
          <select onChange={(e) => setSelectedProvider(e.target.value)}>
            <option value="">Todos los Proveedores</option>
            {Object.keys(aggregatedBackOrders).map((provider) => (
              <option key={provider} value={provider}>{provider}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Buscar Producto..."
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
          />

          <input
            type="text"
            placeholder="Buscar Cliente..."
            value={searchClient}
            onChange={(e) => setSearchClient(e.target.value)}
          />

          <select onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="">Todos los Estados</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <button className="apply-filters-button" onClick={applyFilters}>
            Aplicar Filtros
          </button>
        </div>
        {/* 📌 Filtros con scroll horizontal si es necesario */}
        <div className={aggregatedView ?"hidden" : "tabs-container"} >
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
      {aggregatedView ? (
          <div className="table-wrapper">
            <table className="backorders-table">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Producto</th>
                  <th>Cantidad Total</th>
                  <th>Vendedor</th> {/* 🔹 Nueva columna */}
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(filteredAggregatedBackOrders || {}).length > 0 ? (
                  Object.entries(filteredAggregatedBackOrders).map(([provider, products]) =>
                    Object.entries(products).map(([productName, productData]) => (
                      <React.Fragment key={`${provider}-${productName}`}>
                        <tr>
                          <td>{provider}</td>
                          <td>{productName}</td>
                          <td>{productData.totalQuantity}</td>
                          <td>
                            {productData.details.length > 0
                              ? productData.details[0]?.createdBy?.name || "Usuario no asignado"
                              : "Usuario no asignado"}
                          </td> {/* 🔹 Mostrar vendedor */}
                          <td>
                            <button className="details-button" onClick={() => toggleRowExpansion(provider, productName)}>
                              {expandedRows[`${provider}-${productName}`] ? "🔼 Ocultar Detalles" : "🔽 Ver Detalles"}
                            </button>
                          </td>
                        </tr>

                        {expandedRows[`${provider}-${productName}`] &&
                          productData.details.map((detail, index) => (
                            <tr key={`${provider}-${productName}-detail-${index}`} className="details-row">
                              <td colSpan="2" className="sub-row">👤 Cliente: {detail.client}</td>
                              <td>{detail.quantity} unidades</td>
                              <td>Estado: {statusLabels[detail.status] || detail.status}</td>
                              <td>Vendedor: {detail.createdBy?.name || "Usuario no asignado"}</td> {/* 🔹 Mostrar vendedor en los detalles */}
                            </tr>
                          ))}
                      </React.Fragment>
                    ))
                  )
                ) : (
                  <tr>
                    <td colSpan="5" className="no-results">⚠️ No hay resultados para los filtros seleccionados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="backorders-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Vendedor</th> {/* 🔹 Nueva columna */}
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredBackOrders.length > 0 ? (
                  filteredBackOrders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => handleOpenOrder(order)}
                      className={selectedOrderId === order._id ? "highlighted-row" : ""}
                    >
                      <td>{order.client ? order.client.name : "Cliente no asignado"}</td>
                      <td>{statusLabels[order.statusGeneral] || "Desconocido"}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>{order.createdBy ? order.createdBy.name : "Usuario no asignado"}</td> {/* 🔹 Mostrar vendedor */}
                      <td>
                        <button onClick={() => handleOpenOrder(order)} className="details-button">
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-results">⚠️ No hay resultados para los filtros seleccionados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

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

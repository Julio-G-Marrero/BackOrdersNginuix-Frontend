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
      tableColumn = ["Proveedor", "Producto", "Cantidad Total", "Cliente", "Cantidad", "Estado"];

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
            ]);
          });
        });
      });
    } else {
      // Configuración de columnas para la vista de Back Orders
      tableColumn = ["Cliente", "Producto", "Cantidad", "Proveedor", "Estado", "Fecha"];

      dataToExport.forEach(order => {
        order.products.forEach(product => {
          tableRows.push([
            order.client ? order.client.name : "Cliente no asignado",
            product.description,
            product.quantity,
            product.provider,
            statusLabels[product.status] || product.status,
            new Date(order.createdAt).toLocaleDateString(),
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
      <div className="container-buttons-top">
        <div>
        <button onClick={exportToExcel} className="export-button">📊 Exportar a Excel</button>
        <button onClick={exportToPDF} className="export-button">📄 Exportar a PDF</button>
        </div>
        <div className="refresh-container">
          <button className="details-button" onClick={() => setAggregatedView(!aggregatedView)}>
            {aggregatedView ? "Ver por Back Orders" : "Ver por Producto y Proveedor"}
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
                            <td>Estado: {detail.status}</td>
                          </tr>
                        ))}
                    </React.Fragment>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan="4" className="no-results">⚠️ No hay resultados para los filtros seleccionados.</td>
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
                    <td>
                      <button onClick={() => handleOpenOrder(order)} className="details-button">
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-results">⚠️ No hay resultados para los filtros seleccionados.</td>
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

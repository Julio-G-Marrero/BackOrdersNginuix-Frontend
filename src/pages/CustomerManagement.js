import React, { useState, useEffect } from "react";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, importCustomers } from "../services/customerService";
import "./CustomerManagement.css"; // Estilos mejorados
import axiosInstance from "../services/axiosInstance"; 

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [csvFile, setCsvFile] = useState(null); // Estado para el archivo CSV
  const [form, setForm] = useState({ name: "", address: "", phone: "", customerNumber: "" });
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // Modal de confirmación
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false); // Modal de edición
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // Modal de creación
  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState('');

  backendError
  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  const fetchCustomers = async () => {
    try {
      const response = await getCustomers(page, 10, search);
      setCustomers(response.data.customers);
      setTotalCustomers(response.data.total);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
    }
  };

  const validateForm = () => {
    let errors = {};
    let isValid = true;
  
    if (!form.name.trim()) {
      errors.name = "El nombre es obligatorio";
      isValid = false;
    } else if (form.name.length < 3) {
      errors.name = "El nombre debe tener al menos 3 caracteres";
      isValid = false;
    }
  
    if (!form.address.trim()) {
      errors.address = "La dirección es obligatoria";
      isValid = false;
    } else if (form.address.length < 5) {
      errors.address = "La dirección debe tener al menos 5 caracteres";
      isValid = false;
    }
  
    if (!form.phone.trim()) {
      errors.phone = "El teléfono es obligatorio";
      isValid = false;
    } else if (!/^\d{7,15}$/.test(form.phone)) {
      errors.phone = "El teléfono debe contener entre 7 y 15 dígitos numéricos";
      isValid = false;
    }
  
    if (!form.customerNumber.trim()) {
      errors.customerNumber = "El número de cliente es obligatorio";
      isValid = false;
    } else if (!/^\d+$/.test(form.customerNumber) || form.customerNumber.length < 4) {
      errors.customerNumber = "Debe ser un número de al menos 4 dígitos";
      isValid = false;
    }
  
    setErrors(errors);
    return isValid;
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!csvFile) {
      alert("Selecciona un archivo CSV");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      await importCustomers(formData);
      alert("Clientes importados con éxito!");
      fetchCustomers(); // Refrescar la lista después de la importación
      setCsvFile(null);
    } catch (error) {
      console.error("Error al importar clientes:", error);
      alert("Error al importar clientes.");
      setBackendError(error.message);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateForm()) return;
  
    try {
      if (editing) {
        // 🔹 Si estamos editando, enviamos una solicitud PUT
        await axiosInstance.put(`/customers/${selectedId}`, form);
      } else {
        // 🔹 Si estamos creando un nuevo cliente
        const response = await axiosInstance.post("/customers", form);
        setCustomers((prevCustomers) => [response.data, ...prevCustomers]);
      }
  
      // 🔹 Resetear el formulario y cerrar el modal
      setIsCreateModalOpen(false);
      setIsEditingModalOpen(false);
      setForm({ name: "", address: "", phone: "", customerNumber: "" });
      setErrors({});
      setEditing(false);
      fetchCustomers(); // 🔹 Refrescar la lista de clientes
    } catch (error) {
      console.error("Error al guardar cliente:", error);
  
      if (error.response?.data?.error?.includes("E11000 duplicate key error")) {
        setErrors({ customerNumber: "El número de cliente ya está registrado. Usa otro." });
      } else {
        setErrors({ general: error.response?.data?.error || "Error al guardar el cliente. Intenta nuevamente." });
      }
    }
  };

  const handleEdit = (customer) => {
    setForm({
      name: customer.name || "",
      address: customer.address || "",
      phone: customer.phone || "",
      customerNumber: customer.customerNumber || "",
    });
  
    setEditing(true);
    setSelectedId(customer._id); // 🔹 Guardamos el ID del cliente
    setIsEditingModalOpen(true);
  };

  const handleDelete = async (id) => {
    await deleteCustomer(id);
    fetchCustomers();  // Refresca la lista de clientes
    setConfirmAction(null);  // Cierra el modal de confirmación
  };

  const totalPages = Math.ceil(totalCustomers / 10);

  return (
    <div className="customer-container">
      <div className="customer-header">
        <h1>Gestión de Clientes</h1>
        <div className="customer-actions">
          <button className="add-customer-btn" onClick={() => setIsCreateModalOpen(true)}>➕ Nuevo Cliente</button>
        </div>
      </div>
      <div className="import-section">
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <button className="import-btn" onClick={handleImport}>📥 Importar CSV</button>
      </div>

      {/* 🔍 Campo de Búsqueda */}
      <div className="customer-search-container">
        <input type="text" placeholder="Buscar clientes..." value={search} onChange={handleSearchChange} />
      </div>

      {/* 📜 Tabla de Clientes */}
      <div className="customer-table-container">
        <table className="customer-table">
          <thead>
            <tr>
              <th>No. Cliente</th>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              customers.map((customer) => (
                <tr key={customer._id}>
                  <td>{customer.customerNumber}</td>
                  <td>{customer.name}</td>
                  <td>{customer.address}</td>
                  <td>{customer.phone}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(customer)}>✏️ Editar</button>
                    <button className="delete-btn" onClick={() => setConfirmAction({ id: customer._id, name: customer.name })}>🗑️ Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "20px", fontStyle: "italic" }}>
                  No se encontraron clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Modal de Confirmación de Eliminación */}
      {confirmAction && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setConfirmAction(null)}>✖</button>
            <h2>¿Eliminar Cliente?</h2>
            <p>¿Estás seguro de eliminar al cliente <strong>{confirmAction.name}</strong>?</p>
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={() => handleDelete(confirmAction.id)}>Eliminar</button>
              <button className="cancel-btn" onClick={() => setConfirmAction(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {isEditingModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Editar Cliente</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Nombre del Cliente"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="error-text">{errors.name}</p>}
      
              <input
                type="text"
                name="address"
                placeholder="Dirección"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              {errors.address && <p className="error-text">{errors.address}</p>}
      
              <input
                type="text"
                name="phone"
                placeholder="Teléfono"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              {errors.phone && <p className="error-text">{errors.phone}</p>}
      
              <input
                type="text"
                name="customerNumber"
                placeholder="Número de Cliente"
                value={form.customerNumber}
                onChange={(e) => setForm({ ...form, customerNumber: e.target.value })}
              />
              {errors.customerNumber && <p className="error-text">{errors.customerNumber}</p>}
      
              <div className="modal-buttons">
                <button type="submit" className="confirm-btn">Guardar Cambios</button>
                <button type="button" className="cancel-btn" onClick={() => setIsEditingModalOpen(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Creación */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>✖</button>
            <h2>Nuevo Cliente</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Nombre"
                value={form.name}
                onChange={handleChange}
                className={errors.name ? "error" : ""}
              />
              {errors.name && <p className="error-text">{errors.name}</p>}

              <input
                type="text"
                name="address"
                placeholder="Dirección"
                value={form.address}
                onChange={handleChange}
                className={errors.address ? "error" : ""}
              />
              {errors.address && <p className="error-text">{errors.address}</p>}

              <input
                type="text"
                name="phone"
                placeholder="Teléfono"
                value={form.phone}
                onChange={handleChange}
                className={errors.phone ? "error" : ""}
              />
              {errors.phone && <p className="error-text">{errors.phone}</p>}

              <input
                type="text"
                name="customerNumber"
                placeholder="Número de Cliente"
                value={form.customerNumber}
                onChange={handleChange}
                className={errors.customerNumber ? "error" : ""}
              />
              {errors.customerNumber && <p className="error-text">{errors.customerNumber}</p>}

              {/* Mostrar error general del backend si lo hay */}
              {errors.general && <p className="error-text">{errors.general}</p>}

              <div className="modal-buttons">
                <button type="submit" className="confirm-btn">Crear Cliente</button>
                <button type="button" className="cancel-btn" onClick={() => setIsEditingModalOpen(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📌 Paginación */}
      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>Anterior</button>
        <span>Página {page} de {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage((prev) => prev + 1)}>Siguiente</button>
      </div>
    </div>
  );
};

export default CustomerManagement;

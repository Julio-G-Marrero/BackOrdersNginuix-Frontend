import React, { useState, useEffect } from "react";
import axiosInstance from "../services/axiosInstance"; // Usar axiosInstance para las peticiones
import "./ProductManagement.css"; // Estilos mejorados

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [form, setForm] = useState({
    barcode: "",
    internalCode: "",
    description: "",
    price: "",
    family: "",
    subFamily: "",
  });
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Página actual
  const [totalPages, setTotalPages] = useState(1); // Total de páginas
  
  useEffect(() => {
    fetchProducts();
  }, [search, currentPage]); // Se ejecuta cuando cambia la búsqueda o la página

  useEffect(() => {
    handleSearch();
  }, [search, products]); // Se ejecutará cada vez que `search` o `products` cambien

  const handleSearch = () => {
    if (!search.trim()) {
      setFilteredProducts(products);
      return;
    }
  
    const filtered = products.filter((product) =>
      product.description.toLowerCase().includes(search.toLowerCase()) ||
      product.internalCode.toLowerCase().includes(search.toLowerCase()) ||
      product.barcode.toString().includes(search)
    );
  
    setFilteredProducts(filtered);
  };

  const handleDeleteClick = (product) => {
    setConfirmDelete({ id: product._id, name: product.description });
  };
  
  const fetchProducts = async () => {
    try {
      const params = search
        ? { search } // 🔍 Si hay búsqueda, no aplicar paginación
        : { limit: 50, page: currentPage }; // 📄 Si no hay búsqueda, usar paginación
  
      const response = await axiosInstance.get(`/products`, { params });
  
      setProducts(response.data.products);
      setTotalPages(response.data.totalPages); // Actualizar total de páginas
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setProducts([]);
    }
  };
  
  const validateForm = () => {
    let errors = {};
    let isValid = true;
  
    if (!form.barcode.trim()) {
      errors.barcode = "El código de barras es obligatorio";
      isValid = false;
    } else if (!/^\d+$/.test(form.barcode)) {
      errors.barcode = "El código de barras debe ser numérico";
      isValid = false;
    }
  
    if (!form.internalCode.trim()) {
      errors.internalCode = "El código interno es obligatorio";
      isValid = false;
    }
  
    if (!form.description.trim()) {
      errors.description = "La descripción es obligatoria";
      isValid = false;
    } else if (form.description.length < 5) {
      errors.description = "Debe tener al menos 5 caracteres";
      isValid = false;
    }
  
    if (form.price === "" || form.price === null || isNaN(form.price)) {
      errors.price = "El precio es obligatorio y debe ser un número válido";
      isValid = false;
    } else if (parseFloat(form.price) <= 0) {
      errors.price = "Debe ser un número mayor a 0";
      isValid = false;
    }
  
    if (!form.family.trim()) {
      errors.family = "La familia es obligatoria";
      isValid = false;
    }
  
    if (!form.subFamily.trim()) {
      errors.subFamily = "La sub-familia es obligatoria";
      isValid = false;
    }
  
    setErrors(errors);
    return isValid;
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    try {
      if (editing) {
        await axiosInstance.put(`/products/${selectedId}`, form);
        setIsEditModalOpen(false);
      } else {
        await axiosInstance.post("/products", form);
        setIsCreateModalOpen(false);
      }
  
      setForm({
        barcode: "",
        internalCode: "",
        description: "",
        price: "",
        family: "",
        subFamily: "",
      });
  
      setErrors({});
      setEditing(false);
      fetchProducts();
    } catch (error) {
      console.error("Error al guardar producto:", error);
      if (error.response?.data?.error?.includes("E11000 duplicate key error")) {
        setErrors({ barcode: "El código de barras ya está registrado" });
      } else {
        setErrors({ general: "Error al guardar el producto" });
      }
    }
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditing(true);
    setSelectedId(product._id);
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/products/${confirmDelete.id}`);
      setConfirmDelete(null);
      fetchProducts(); // Refrescar la lista después de eliminar
    } catch (error) {
      console.error("Error al eliminar producto:", error);
    }
  };

  const handleImport = async () => {
    if (!csvFile) {
      alert("Selecciona un archivo CSV");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      await axiosInstance.post("/products/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Productos importados con éxito!");
      fetchProducts();
      setCsvFile(null);
    } catch (error) {
      console.error("Error al importar productos:", error);
      alert("Error al importar productos.");
    }
  };

  return (
    <div className="product-container">
      <div className="product-header">
        <h1>Gestión de Productos</h1>
        <button className="add-product-btn" onClick={() => setIsCreateModalOpen(true)}>➕ Nuevo Producto</button>
      </div>

      <div className="import-section">
        <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
        <button className="import-btn" onClick={handleImport}>📥 Importar CSV</button>
      </div>

      <div className="product-search-container">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="product-table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th>Código de Barras</th>
              <th>Código Interno</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Familia</th>
              <th>Sub-Familia</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td>{product.barcode}</td>
                  <td>{product.internalCode}</td>
                  <td className="truncate">{product.description}</td>
                  <td>{product.price}</td>
                  <td>{product.family}</td>
                  <td>{product.subFamily}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(product)}>✏️ Editar</button>
                    <button className="delete-btn" onClick={() => handleDeleteClick(product)}>🗑️ Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px", fontStyle: "italic" }}>
                  No se encontraron productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Crear / Editar */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>✖</button>
            <h2>{editing ? "Editar Producto" : "Nuevo Producto"}</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="barcode"
                placeholder="Código de Barras"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              />
              {errors.barcode && <p className="error-text">{errors.barcode}</p>}

              <input
                type="text"
                name="internalCode"
                placeholder="Código Interno"
                value={form.internalCode}
                onChange={(e) => setForm({ ...form, internalCode: e.target.value })}
              />
              {errors.internalCode && <p className="error-text">{errors.internalCode}</p>}

              <input
                type="text"
                name="description"
                placeholder="Descripción"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              {errors.description && <p className="error-text">{errors.description}</p>}

              <input
                type="number"
                name="price"
                placeholder="Precio"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              {errors.price && <p className="error-text">{errors.price}</p>}

              <input
                type="text"
                name="family"
                placeholder="Familia"
                value={form.family}
                onChange={(e) => setForm({ ...form, family: e.target.value })}
              />

              <input
                type="text"
                name="subFamily"
                placeholder="Sub-Familia"
                value={form.subFamily}
                onChange={(e) => setForm({ ...form, subFamily: e.target.value })}
              />

              <div className="modal-buttons">
                <button type="submit" className="confirm-btn">Guardar Cambios</button>
                <button type="button" className="cancel-btn" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          ⬅ Anterior
        </button>

        <span>Página {currentPage} de {totalPages}</span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Siguiente ➡
        </button>
      </div>
      {/* Modal de Confirmación de Eliminación */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setConfirmDelete(null)}>✖</button>
            <h2>¿Eliminar el producto <strong>{confirmDelete.name}</strong>?</h2>
            <p>Esta acción no se puede deshacer.</p>
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={handleDelete}>Eliminar</button>
              <button className="cancel-btn" onClick={() => setConfirmDelete(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductManagement;

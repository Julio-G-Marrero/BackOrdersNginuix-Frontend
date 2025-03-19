import React, { useState, useEffect, useRef } from "react";
import "./BackOrderCreate.css";
import axiosInstance from "../services/axiosInstance";
import QuantityInput from "../components/QuantityInput";
import Swal from "sweetalert2";

const BackOrderCreate = ({ user }) => {
  if (!user) {
    console.error("❌ No se encontró el usuario.");
    return <p>Error: Debes iniciar sesión</p>;
  }
  const userId = user.id; // ✅ Ahora `user` siempre estará definido
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [highlightedClientIndex, setHighlightedClientIndex] = useState(-1);
  
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(-1);
  const [backOrderProducts, setBackOrderProducts] = useState([]);
  const clientSuggestionsRef = useRef([]);
  const productSuggestionsRef = useRef([]);
  const clientSuggestionsContainerRef = useRef(null);
  const productSuggestionsContainerRef = useRef(null);

  useEffect(() => {
    const fetchClients = async () => {
      if (search.trim() === "") {
        setFilteredClients([]);
        return;
      }
      try {
        const response = await axiosInstance.get("/customers", { params: { search, limit: 10 } });
        setFilteredClients(response.data.customers || []);
      } catch (error) {
        console.error("Error al cargar clientes:", error);
      }
    };
    fetchClients();
  }, [search]);
  
  useEffect(() => {
    // Cargar borrador al iniciar
    const loadDraft = async () => {
      try {
        const response = await axiosInstance.get(`/backorder-drafts/${userId}`);
        if (response.data) {
          setSelectedClient(response.data.client);
          setBackOrderProducts(response.data.products);
        }
      } catch (error) {
        console.log("No hay borrador guardado.");
      }
    };
    loadDraft();
  }, [userId]);

  useEffect(() => {
    // Guardar borrador automáticamente cuando cambian datos
    const saveDraft = async () => {
      if (selectedClient || backOrderProducts.length > 0) {
        await axiosInstance.post("/backorder-drafts", {
          userId,
          client: selectedClient,
          products: backOrderProducts,
        });
      }
    };
    saveDraft();
  }, [selectedClient, backOrderProducts, userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        clientSuggestionsContainerRef.current &&
        !clientSuggestionsContainerRef.current.contains(event.target)
      ) {
        setFilteredClients([]);
      }
      if (
        productSuggestionsContainerRef.current &&
        !productSuggestionsContainerRef.current.contains(event.target)
      ) {
        setFilteredProducts([]);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (highlightedClientIndex >= 0 && clientSuggestionsRef.current[highlightedClientIndex]) {
      clientSuggestionsRef.current[highlightedClientIndex].scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightedClientIndex]);
  
  useEffect(() => {
    if (highlightedProductIndex >= 0 && productSuggestionsRef.current[highlightedProductIndex]) {
      productSuggestionsRef.current[highlightedProductIndex].scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightedProductIndex]);
  

  useEffect(() => {
    const fetchProducts = async () => {
      if (productSearch.trim() === "") {
        setFilteredProducts([]);
        return;
      }
      try {
        const response = await axiosInstance.get("/products", { params: { search: productSearch } });
        setFilteredProducts(response.data.products || []);
      } catch (error) {
        console.error("Error al buscar productos:", error);
        setFilteredProducts([]);
      }
    };
    const debounceTimeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounceTimeout);
  }, [productSearch]);

  const handleRemoveProduct = (index, event) => {
    event.preventDefault(); // 🔹 Evita el envío del formulario
    event.stopPropagation(); // 🔹 Detiene la propagación del evento
    
    setBackOrderProducts((prev) => prev.filter((_, i) => i !== index));
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

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setSearch("");
    setFilteredClients([]);
    setHighlightedClientIndex(-1);
  };

  const handleClientKeyDown = (e) => {
    preventFormSubmitOnEnter(e); // ✅ Evita envío del formulario
    if (filteredClients.length === 0) return;
    if (e.key === "ArrowDown") {
      setHighlightedClientIndex((prev) => (prev < filteredClients.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      setHighlightedClientIndex((prev) => (prev > 0 ? prev - 1 : filteredClients.length - 1));
    } else if (e.key === "Enter" && highlightedClientIndex >= 0) {
      handleClientSelect(filteredClients[highlightedClientIndex]);
    }
  };

  const handleProductSelect = (product) => {
    const alreadyAdded = backOrderProducts.some((item) => item.product === product._id);
    if (alreadyAdded) {
      alert("Este producto ya ha sido agregado.");
      return;
    }
  
    setBackOrderProducts((prev) => [
      ...prev,
      {
        product: product._id,  // ✅ ID del producto
        description: product.description,  // ✅ Descripción
        quantity: 1,  // ✅ Cantidad inicial
        comments: "",  // ✅ Campo de comentarios vacío
        price: product.price || 0,  // ✅ Precio del producto
        family: product.family || "No especificado",  // ✅ Familia
        subFamily: product.subFamily || "No especificado",  // ✅ Subfamilia
        barcode: product.barcode || "No disponible",  // ✅ Código de barras
        internalCode: product.internalCode || "No disponible",  // ✅ Código interno
      },
    ]);
  
    setProductSearch("");
    setFilteredProducts([]);
    setHighlightedProductIndex(-1);
  };
  
  const handleProductKeyDown = (e) => {
    preventFormSubmitOnEnter(e); // ✅ Evita envío del formulario
    if (filteredProducts.length === 0) return;
  
    if (e.key === "ArrowDown") {
      setHighlightedProductIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      setHighlightedProductIndex((prev) => (prev > 0 ? prev - 1 : filteredProducts.length - 1));
    } else if (e.key === "Enter" && highlightedProductIndex >= 0) {
      handleProductSelect(filteredProducts[highlightedProductIndex]);
    }
  };

  const preventFormSubmitOnEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!selectedClient) {
      alert("Por favor, seleccione un cliente.");
      return;
    }
  
    if (backOrderProducts.length === 0) {
      alert("Debe agregar al menos un producto.");
      return;
    }
  
    try {
      const backOrderData = {
        client: selectedClient._id,
        products: backOrderProducts.map((product) => ({
          product: product.product,  // ✅ ID del producto
          description: product.description,  // ✅ Descripción
          quantity: product.quantity,  // ✅ Cantidad seleccionada
          comments: product.comments || "",  // ✅ Comentarios opcionales
          price: product.price !== undefined ? product.price : 0,  // ✅ Asegurar que el precio se envía
          family: product.family || "No especificado",  // ✅ Asegurar familia
          subFamily: product.subFamily || "No especificado",  // ✅ Asegurar subfamilia
          barcode: product.barcode || "No disponible",  // ✅ Código de barras
          internalCode: product.internalCode || "No disponible",  // ✅ Código interno
        })),
      };
  
      console.log("📤 Enviando Back Order:", JSON.stringify(backOrderData, null, 2));
  
      await axiosInstance.post("/backorders", backOrderData);
  
      // 🔹 Mostrar alerta de éxito
      Toast.fire({
        icon: "success",
        title: "Backorder Creado Correctamente",
      });  

      // Reiniciar el formulario después de enviar
      setSelectedClient(null);
      setBackOrderProducts([]);
      await axiosInstance.delete(`/backorder-drafts/${userId}`);
    } catch (error) {
      console.error("❌ Error al crear Back Order:", error);
      alert("⚠️ Hubo un error al crear el Back Order.");
    }
  };

  return (
    <div className="container container--registrarBackorder">
      <h1 className="title">Registrar Back Order</h1>
      <form onSubmit={handleSubmit} className="form">
      <div className="form-group input-container" ref={clientSuggestionsContainerRef}>
        <label>Buscar Cliente</label>
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleClientKeyDown}
          onFocus={() => {
            if (search.trim() !== "") {
              // Ejecutar búsqueda al enfocar si hay texto en el input
              axiosInstance
                .get("/customers", { params: { search, limit: 10 } })
                .then((response) => setFilteredClients(response.data.customers || []))
                .catch((error) => console.error("Error al cargar clientes:", error));
            }
          }}
        />
        {filteredClients.length > 0 && (
          <ul className="suggestions">
            {filteredClients.map((client, index) => (
              <li
                key={client._id}
                ref={(el) => (clientSuggestionsRef.current[index] = el)}
                onClick={() => handleClientSelect(client)}
                className={`suggestion-item ${highlightedClientIndex === index ? "highlighted" : ""}`}
              >
                {client.name} - {client.customerNumber}
              </li>
            ))}
          </ul>
        )}
      </div>

        {selectedClient && (
          <p><strong>Cliente Seleccionado:</strong> {selectedClient.name}</p>
        )}

        {/* Campo de búsqueda de productos */}
        <div className="form-group input-container" ref={productSuggestionsContainerRef}>
          <label>Buscar Productos</label>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            onKeyDown={handleProductKeyDown}
            onFocus={() => {
              if (productSearch.trim() !== "") {
                // Ejecutar búsqueda al enfocar si hay texto en el input
                axiosInstance
                  .get("/products", { params: { search: productSearch } })
                  .then((response) => setFilteredProducts(response.data.products || []))
                  .catch((error) => console.error("Error al buscar productos:", error));
              }
            }}
          />
          {filteredProducts.length > 0 && (
            <ul className="suggestions">
              {filteredProducts.map((product, index) => (
                <li
                  key={product._id}
                  ref={(el) => (productSuggestionsRef.current[index] = el)}
                  onClick={() => handleProductSelect(product)}
                  className={`suggestion-item ${highlightedProductIndex === index ? "highlighted" : ""}`}
                >
                  {product.description}
                </li>
              ))}
            </ul>
          )}
        </div>

        {backOrderProducts.length > 0 && (
          <div className="selected-products">
            <h3>Productos Seleccionados</h3>
            {backOrderProducts.map((item, index) => (
              <div key={index} className="product-row">
                <p><strong></strong> {item.description}</p>
                <div className="buttons-producto-edit">
                  <QuantityInput
                    value={item.quantity}
                    onChange={(newQuantity) =>
                      setBackOrderProducts((prev) => {
                        const updated = [...prev];
                        updated[index].quantity = newQuantity;
                        return updated;
                      })
                    }
                  />
                  
                  {/* Botón para eliminar el producto */}
                  <button 
                    className="delete-btn" 
                    onClick={(event) => handleRemoveProduct(index, event)}
                  >
                    X
                  </button>
                </div>
                
                <textarea
                  className="comments-input"
                  value={item.comments}
                  onChange={(e) =>
                    setBackOrderProducts((prev) => {
                      const updated = [...prev];
                      updated[index].comments = e.target.value;
                      return updated;
                    })
                  }
                  placeholder="Comentarios del producto"
                />
              </div>
            ))}
          </div>
        )}
        <button type="submit" className="submit-btn">
          Crear Back Order
        </button>
      </form>
    </div>
  );
};

export default BackOrderCreate;

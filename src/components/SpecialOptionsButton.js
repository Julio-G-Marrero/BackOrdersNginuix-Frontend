import React, { useState } from "react";
import axiosInstance from "../services/axiosInstance";

const SpecialOptionsButton = ({ product, orderId, updateProductStatus }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [comments, setComments] = useState("");

  const stateReversions = {
    pending: [],
    in_process: ["pending"],
    pending_approval: ["in_process", "pending"],
    in_delivery_process: ["pending_approval", "in_process"],
    shipped: ["in_delivery_process"],
    partial: ["in_delivery_process", "pending_approval"],
    fulfilled: ["in_delivery_process", "shipped"],
    denied: ["pending_approval", "in_process"],
    delayed: ["in_delivery_process", "pending_approval"],
  };

  const availableReversions = stateReversions[product.status] || [];

  const handleRevertStatus = async () => {
    if (!selectedState) {
      alert("Selecciona un estado al que deseas regresar.");
      return;
    }

    try {
      const response = await axiosInstance.put(
        `/backorders/${orderId}/products/${product._id}/revert-status`,
        { newStatus: selectedState, comments }
      );

      alert("Estado revertido correctamente.");
      updateProductStatus(orderId, product._id, selectedState);
      setShowOptions(false);
    } catch (error) {
      console.error("❌ Error al revertir estado:", error);
      alert("Error al revertir el estado.");
    }
  };

  return (
    <div className="special-options">
      <button onClick={() => setShowOptions(!showOptions)} className="special-options-btn">
        ⚙️ Opciones Especiales
      </button>

      {showOptions && (
        <div className="options-dropdown">
          <h4>Revertir Estado</h4>
          <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
            <option value="">Seleccionar estado</option>
            {availableReversions.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Motivo de reversión (opcional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          ></textarea>
          <button onClick={handleRevertStatus} className="confirm-btn">
            Confirmar Reversión
          </button>
        </div>
      )}
    </div>
  );
};

export default SpecialOptionsButton;

import React from "react";
import "./HistoryModal.css";

const HistoryModal = ({ history, onClose }) => {
  // Ordenar el historial por fecha (del más reciente al más antiguo)
  const sortedHistory = [...history].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Historial de Back Order</h2>

        {/* 🔹 Contenedor Scrollable para evitar desbordamiento */}
        <div className="timeline-container">
          {sortedHistory.length > 0 ? (
            <div className="timeline-scrollable">
              {sortedHistory.map((entry, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <p className="timeline-action">{entry.action}</p>
                    <p className="timeline-user">Usuario: {entry.updatedBy || "Desconocido"}</p>
                    <p className="timeline-comments">{entry.comments || "Sin comentarios"}</p>
                    <p className="timeline-date">
                      📅 {new Date(entry.updatedAt).toLocaleDateString()} - ⏰ {new Date(entry.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No hay historial disponible para este Back Order.</p>
          )}
        </div>

        <button className="close-button" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default HistoryModal;

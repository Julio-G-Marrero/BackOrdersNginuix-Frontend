import { useState } from "react";

const GlobalActionsButton = ({ selectedOrders, executeGlobalAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded"
      >
        ⚙️ Acciones Globales
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border shadow-lg rounded-lg z-10">
          <button
            onClick={() => executeGlobalAction("reorder")}
            className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
          >
            🔄 Reordenar Productos Faltantes
          </button>
          <button
            onClick={() => executeGlobalAction("cancel")}
            className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
          >
            🛑 Cancelar Back Orders Seleccionados
          </button>
          <button
            onClick={() => executeGlobalAction("approve_all")}
            className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
          >
            ✅ Aprobar Todos los Productos
          </button>
          <button
            onClick={() => executeGlobalAction("export")}
            className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
          >
            📤 Exportar a CSV/PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default GlobalActionsButton;

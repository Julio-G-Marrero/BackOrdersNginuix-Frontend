import React, { useEffect, useState } from "react";
import axios from "axios";

const ResetPasswords = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    try {
      const response = await axios.post("/api/auth/forgot-password", { email });
      setMessage(response.data.message);
    } catch (error) {
      setMessage("Error al enviar el correo.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Restablecer Contraseña</h2>
      <div className="mb-4">
        <input
          type="email"
          placeholder="Correo del usuario"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <button onClick={handleReset} className="bg-blue-500 text-white px-4 py-2 rounded">
        Enviar Enlace de Restablecimiento
      </button>
      {message && <p className="mt-2 text-green-600">{message}</p>}
    </div>
  );
};

export default ResetPasswords;

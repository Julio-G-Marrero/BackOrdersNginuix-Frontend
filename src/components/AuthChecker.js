import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000; // 1 día en milisegundos

const AuthChecker = () => {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkTokenValidity = () => {
      const user = JSON.parse(localStorage.getItem("user"));

      // 🚨 Si no hay usuario, NO hacer nada hasta que inicie sesión
      if (!user || !user.token) {
        setChecked(true); // ✅ Permitir que la app se cargue sin redirigir
        return;
      }

      try {
        const payload = JSON.parse(atob(user.token.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        if (payload.exp < currentTime) {
          localStorage.removeItem("user");
          navigate("/login");
        }
      } catch (error) {
        localStorage.removeItem("user");
        navigate("/login");
      }

      setChecked(true); // ✅ Solo después de verificar, marcar como comprobado
    };

    checkTokenValidity(); // Verificar en el primer render
    const interval = setInterval(checkTokenValidity, ONE_DAY_IN_MS); // Verificar cada día

    return () => clearInterval(interval);
  }, [navigate]);

  return checked ? null : <div>Cargando...</div>; // Opcional: pantalla de carga
};

export default AuthChecker;

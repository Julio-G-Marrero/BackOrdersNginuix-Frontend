import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000; // 1 día en milisegundos

const AuthChecker = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkTokenValidity = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.token) {
        localStorage.removeItem("user");
        navigate("/login");
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
    };

    // Ejecutar la verificación al cargar la app
    checkTokenValidity();

    // Configurar la verificación cada 24 horas
    const interval = setInterval(checkTokenValidity, ONE_DAY_IN_MS);

    return () => clearInterval(interval);
  }, [navigate]);

  return null; // No renderiza nada, solo ejecuta la verificación en segundo plano
};

export default AuthChecker;

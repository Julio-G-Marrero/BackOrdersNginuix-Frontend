import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import CustomerManagement from "./pages/CustomerManagement";
import ProductManagement from "./pages/ProductManagement";
import BackOrderCreate from "./pages/BackOrderCreate";
import PurchaseManagerBackOrders from "./pages/PurchaseManagerBackOrders";
import SellerBackOrders from "./pages/SellerBackOrders";
import ProviderManagement from "./pages/ProviderManagement";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import ResetPasswords from "./pages/admin/ResetPasswords";
import Navbar from "./components/Navbar"; // ✅ Navbar siempre se renderiza
import "./App.css"; // ✅ Estilos globales
import { useNavigate } from "react-router-dom";

const isTokenValid = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.token) return false;

  try {
    const payload = JSON.parse(atob(user.token.split(".")[1])); // Decodificar el payload del token JWT
    const currentTime = Math.floor(Date.now() / 1000); // Tiempo actual en segundos

    if (payload.exp < currentTime) {
      localStorage.removeItem("user"); // Eliminar sesión si el token ha expirado
      return false;
    }
    return true;
  } catch (error) {
    localStorage.removeItem("user"); // Eliminar sesión si el token es inválido
    return false;
  }
};

// 🔹 Componente para PROTEGER rutas privadas
const PrivateRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || !isTokenValid()) {
    localStorage.removeItem("user"); // ✅ Eliminar sesión si el token es inválido
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};


// 🔹 Componente que gestiona la estructura de la app
const AppLayout = ({ children }) => {
  const location = useLocation();
  const hideNavbarRoutes = ["/login", "/register"];
  const isNavbarHidden = hideNavbarRoutes.includes(location.pathname);

  return (
    <div className="app-container">
      {/* ✅ Navbar SIEMPRE visible, excepto en Login/Register */}
      {!isNavbarHidden && <Navbar />}
      <div className={`main-content ${isNavbarHidden ? "no-padding" : ""}`}>
        {children}
      </div>
    </div>
  );
};
/**zoom celular */
document.addEventListener("gesturestart", function (e) {
  e.preventDefault();
});

const App = () => {
  const navigate = useNavigate();
  const THREE_DAYS_IN_MS = 3 * 24 * 60 * 60 * 1000; // 3 días en milisegundos

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

    // Ejecutar la verificación cada 3 días
    const interval = setInterval(checkTokenValidity, THREE_DAYS_IN_MS);

    // Ejecutar la verificación una vez al montar la app
    checkTokenValidity();

    return () => clearInterval(interval);
  }, [navigate]);
  
  return (
    <Router>
      <AppLayout>
        <Routes>
          {/* 🔹 Rutas públicas */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* 🔹 Rutas protegidas para TODOS los usuarios autenticados */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/customers" element={<PrivateRoute><CustomerManagement /></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><ProductManagement /></PrivateRoute>} />
          <Route path="/backorders/new" element={<PrivateRoute><BackOrderCreate /></PrivateRoute>} />
          <Route path="/vendedor/backorders" element={<PrivateRoute><SellerBackOrders /></PrivateRoute>} />
          <Route path="/backorders/purchase" element={<PrivateRoute><PurchaseManagerBackOrders /></PrivateRoute>} />
          <Route path="/providers" element={<PrivateRoute><ProviderManagement /></PrivateRoute>} />

          {/* 🔹 Rutas protegidas para ADMINISTRADOR */}
          <Route path="/admin" element={<PrivateRoute allowedRoles={["admin"]}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute allowedRoles={["admin"]}><ManageUsers /></PrivateRoute>} />
          <Route path="/admin/reset-passwords" element={<PrivateRoute allowedRoles={["admin"]}><ResetPasswords /></PrivateRoute>} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

export default App;

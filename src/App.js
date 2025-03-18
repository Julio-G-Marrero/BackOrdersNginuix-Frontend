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
import Navbar from "./components/Navbar";
import AuthChecker from "./components/AuthChecker"; // ✅ Importar el validador de token
import "./App.css"; // ✅ Estilos globales

const isTokenValid = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.token) return false;

  try {
    const payload = JSON.parse(atob(user.token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);

    if (payload.exp < currentTime) {
      localStorage.removeItem("user");
      return false;
    }
    return true;
  } catch (error) {
    localStorage.removeItem("user");
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
  return (
    <Router>
      <AuthChecker /> {/* ✅ Comprobación del token en segundo plano */}
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

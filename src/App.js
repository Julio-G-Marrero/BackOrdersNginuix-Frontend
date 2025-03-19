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

// 🔹 Componente para PROTEGER rutas privadas
const PrivateRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem("user")); // ✅ Obtener usuario del localStorage

  if (!user) {
    return <Navigate to="/login" />; // Redirigir si no está autenticado
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />; // Redirigir si no tiene permisos
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

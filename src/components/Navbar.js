import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <>
      {/* 🔹 Botón de menú hamburguesa para dispositivos móviles */}
      <button className="hamburger" onClick={toggleMenu}>
        ☰
      </button>

      {/* 🔹 Sidebar con clase dinámica según estado del menú */}
      <div className={`sidebar ${isMenuOpen ? "open" : ""}`}>
        <h1 className="logo">BackOrdersApp</h1>

        {/* 🔹 Si el usuario NO está logueado, mostrar solo el mensaje */}
        {!user ? (
          <div>
            <p className="not-logged-message">⚠️ Inicia sesión para acceder</p>
            <Link to="/login">Inicia Sesión aqui</Link>
          </div>
        ) : (
          <>
            <p className="user-info">Bienvenido, {user.name}</p>

            <ul className="sidebar-links">

              {/* 🔹 Opciones para ADMINISTRADOR */}
              {user.role === "admin" && (
                <>
                  {/* <li>
                    <Link to="/admin" onClick={toggleMenu}>Dashboard</Link>
                  </li> */}
                  <li>
                    <Link to="/" onClick={toggleMenu}>Inicio</Link>
                  </li>
                  <li>
                    <Link to="/admin/users" onClick={toggleMenu}>Gestión de Usuarios</Link>
                  </li>
                  {/* <li>
                    <Link to="/admin/reset-passwords" onClick={toggleMenu}>Restablecer Contraseñas</Link>
                  </li> */}
                </>
              )}

              {/* 🔹 Opciones para GERENTE */}
              {user.role === "gerente" && (
                <>
                  <li>
                    <Link to="/" onClick={toggleMenu}>Inicio</Link>
                  </li>
                  <li>
                    <Link to="/backorders/purchase" onClick={toggleMenu}>Gestionar Back Orders</Link>
                  </li>
                  <li>
                    <Link to="/customers" onClick={toggleMenu}>Clientes</Link>
                  </li>
                  <li>
                    <Link to="/products" onClick={toggleMenu}>Productos</Link>
                  </li>
                  <li>
                    <Link to="/providers" onClick={toggleMenu}>Proveedores</Link>
                  </li>
                </>
              )}

              {/* 🔹 Opciones para VENDEDOR */}
              {user.role === "vendedor" && (
                <>
                  <li>
                    <Link to="/backorders/new" onClick={toggleMenu}>Crear Back Order</Link>
                  </li>
                  <li>
                    <Link to="/vendedor/backorders" onClick={toggleMenu}>Mis Back Orders</Link>
                  </li>
                </>
              )}

              {/* 🔹 Cerrar sesión */}
              <li>
                <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
              </li>
            </ul>
          </>
        )}
      </div>
    </>
  );
};

export default Navbar;

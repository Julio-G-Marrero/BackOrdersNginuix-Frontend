import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosInstance";
import Swal from "sweetalert2";
import "./Login.css"; // 🔹 Archivo CSS para mejorar el diseño

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // 🔹 Hook para redireccionar

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post("/auth/login", form);
      const { token, user } = response.data;

      // 🚨 **Verificaciones de estado del usuario** 🚨
      if (user.status === "restricted") {
        Swal.fire({
          icon: "error",
          title: "Acceso Restringido",
          text: "Tu cuenta ha sido restringida. Contacta al administrador.",
        });
        setLoading(false);
        return;
      }

      if (user.status === "pending_approval") {
        Swal.fire({
          icon: "info",
          title: "Cuenta en Revisión",
          text: "Tu cuenta está pendiente de aprobación. Espera la confirmación del administrador.",
        });
        setLoading(false);
        return;
      }

      if (user.status === "rejected") {
        Swal.fire({
          icon: "error",
          title: "Acceso Denegado",
          text: "Tu solicitud de acceso ha sido rechazada. Contacta al administrador si crees que es un error.",
        });
        setLoading(false);
        return;
      }

      // ✅ Guardar sesión y redirigir al usuario
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      Toast.fire({
        icon: "success",
        title: "Inicio de sesión exitoso",
      });

      // 🔹 **Redirigir según el rol del usuario**
      if (user.role === "vendedor") {
        navigate("/backorders/new");
      } else {
        navigate("/"); // ✅ Otro rol → Dashboard
      }

    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al iniciar sesión",
        text: error.response?.data?.message || "Credenciales incorrectas.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Iniciar Sesión</h2>

        <input
          name="email"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          className="login-input"
        />

        <input
          name="password"
          placeholder="Contraseña"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          className="login-input"
        />

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Cargando..." : "Iniciar Sesión"}
        </button>
        <div className="enlace-pagina">
          <Link to="/register">¿No estás registrado? Regístrate.</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;

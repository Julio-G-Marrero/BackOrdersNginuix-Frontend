import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";
import Swal from "sweetalert2";
import "./Register.css"; // ✅ Importa el archivo de estilos

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "vendedor",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // ✅ Hook para redireccionar

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔹 Validación de contraseña mínima de 6 caracteres
    if (form.password.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Contraseña demasiado corta",
        text: "La contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }

    // 🔹 Validar que ambas contraseñas coincidan
    if (form.password !== form.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Las contraseñas no coinciden",
        text: "Verifica que ambas contraseñas sean iguales.",
      });
      return;
    }

    setLoading(true);
    try {
      await register(form);
      Swal.fire({
        icon: "success",
        title: "Registro Exitoso",
        text: "El usuario ha sido registrado correctamente.",
        timer: 2000,
        showConfirmButton: false,
      });

      // ✅ Redirigir al usuario a la página de login después del registro
      setTimeout(() => navigate("/login"), 2000);

    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al registrar",
        text: error.response?.data?.message || "No se pudo registrar el usuario.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">Registro de Usuario</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <label className="register-label">Nombre</label>
        <input
          name="name"
          placeholder="Ingresa tu nombre"
          onChange={handleChange}
          value={form.name}
          required
          className="register-input"
        />

        <label className="register-label">Correo Electrónico</label>
        <input
          name="email"
          placeholder="Ingresa tu correo electrónico"
          type="email"
          onChange={handleChange}
          value={form.email}
          required
          className="register-input"
        />

        <label className="register-label">Contraseña</label>
        <input
          name="password"
          placeholder="Ingresa tu contraseña"
          type="password"
          onChange={handleChange}
          value={form.password}
          required
          className="register-input"
        />

        <label className="register-label">Confirmar Contraseña</label>
        <input
          name="confirmPassword"
          placeholder="Repite tu contraseña"
          type="password"
          onChange={handleChange}
          value={form.confirmPassword}
          required
          className="register-input"
        />

        <button type="submit" className="register-button" disabled={loading}>
          {loading ? "Registrando..." : "Registrar"}
        </button>
      </form>
      <div className="enlace-pagina">
        <Link to="/login">¿Ya estas registrado? Inicia Sesión.</Link>
      </div>
    </div>
  );
};

export default Register;

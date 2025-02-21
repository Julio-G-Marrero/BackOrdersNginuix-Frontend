import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";
import Swal from "sweetalert2";
import "./Register.css";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "+52", // ✅ El campo inicia con +52
    password: "",
    confirmPassword: "",
    role: "vendedor",
  });

  const [phoneValid, setPhoneValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // 🔹 Solo números
    if (!value.startsWith("52")) {
      value = "52"; // 🔹 Previene la eliminación del +52
    }
    if (value.length > 12) {
      value = value.slice(0, 12); // 🔹 Máximo 12 caracteres (+52 + 10 dígitos)
    }
    setForm({ ...form, phone: `+${value}` });
    validatePhone(`+${value}`);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\+52\d{10}$/; // 🔹 Debe ser +52 seguido de 10 dígitos
    setPhoneValid(phoneRegex.test(phone));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phoneValid) {
      Swal.fire({
        icon: "error",
        title: "Número de teléfono inválido",
        text: "Debe tener el formato +52XXXXXXXXXX con 10 dígitos.",
      });
      return;
    }

    if (form.password.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Contraseña demasiado corta",
        text: "Debe tener al menos 6 caracteres.",
      });
      return;
    }

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
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          value={form.name}
          required
          className="register-input"
        />

        <label className="register-label">Correo Electrónico</label>
        <input
          name="email"
          placeholder="Ingresa tu correo electrónico"
          type="email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          value={form.email}
          required
          className="register-input"
        />

        <label className="register-label">Teléfono</label>
        <input
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handlePhoneChange}
          required
          className={`register-input ${phoneValid ? "valid" : "invalid"}`}
        />
        {!phoneValid && <small className="error-text">Formato inválido</small>}

        <label className="register-label">Contraseña</label>
        <input
          name="password"
          placeholder="Ingresa tu contraseña"
          type="password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          value={form.password}
          required
          className="register-input"
        />

        <label className="register-label">Confirmar Contraseña</label>
        <input
          name="confirmPassword"
          placeholder="Repite tu contraseña"
          type="password"
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          value={form.confirmPassword}
          required
          className="register-input"
        />

        <button type="submit" className="register-button" disabled={loading}>
          {loading ? "Registrando..." : "Registrar"}
        </button>
      </form>
      <div className="enlace-pagina">
        <Link to="/login">¿Ya estás registrado? Inicia Sesión.</Link>
      </div>
    </div>
  );
};

export default Register;

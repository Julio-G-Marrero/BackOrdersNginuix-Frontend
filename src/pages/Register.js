import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";
import Swal from "sweetalert2";
import "./Register.css";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "vendedor",
  });

  const [phoneValid, setPhoneValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Autoformato del teléfono
    if (name === "phone") {
      let formattedPhone = value.replace(/\D/g, ""); // Remueve caracteres no numéricos

      if (formattedPhone.startsWith("52")) {
        formattedPhone = `+${formattedPhone}`;
      } else if (formattedPhone.length >= 10) {
        formattedPhone = `+52${formattedPhone}`;
      }

      setForm({ ...form, phone: formattedPhone });
      validatePhone(formattedPhone);
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\+52\d{10}$/; // Solo acepta formato "+52" seguido de 10 dígitos
    setPhoneValid(phoneRegex.test(phone));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phoneValid) {
      Swal.fire({
        icon: "error",
        title: "Número de teléfono inválido",
        text: "El número debe estar en formato +52XXXXXXXXXX con 10 dígitos.",
      });
      return;
    }

    if (form.password.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Contraseña demasiado corta",
        text: "La contraseña debe tener al menos 6 caracteres.",
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

        <label className="register-label">Teléfono</label>
        <input
          name="phone"
          placeholder="+52XXXXXXXXXX"
          type="tel"
          onChange={handleChange}
          value={form.phone}
          required
          className={`register-input ${phoneValid ? "valid" : "invalid"}`}
        />
        {!phoneValid && <small className="error-text">Formato inválido. Ejemplo: +528445379269</small>}

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
        <Link to="/login">¿Ya estás registrado? Inicia Sesión.</Link>
      </div>
    </div>
  );
};

export default Register;

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    approvedUsers: 0,
  });

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await axios.get("/api/users/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Panel de Administración</h2>

      {/* 🔹 Resumen de Usuarios */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-500 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Usuarios Totales</h3>
          <p className="text-2xl">{stats.totalUsers}</p>
        </div>
        <div className="bg-yellow-500 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Pendientes de Aprobación</h3>
          <p className="text-2xl">{stats.pendingUsers}</p>
        </div>
        <div className="bg-green-500 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Usuarios Aprobados</h3>
          <p className="text-2xl">{stats.approvedUsers}</p>
        </div>
      </div>

      {/* 🔹 Acciones Rápidas */}
      <div className="bg-gray-100 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 gap-4">
          <Link to="/admin/users" className="bg-blue-600 text-white p-3 rounded-lg text-center">
            Gestionar Usuarios
          </Link>
          <Link to="/admin/reset-passwords" className="bg-red-500 text-white p-3 rounded-lg text-center">
            Restablecer Contraseñas
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

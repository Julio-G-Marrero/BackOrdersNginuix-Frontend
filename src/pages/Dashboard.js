import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosInstance";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import "./Dashboard.css"; // ✅ Importar estilos

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get("/stats");
        setStats(response.data);
      } catch (error) {
        console.error("❌ Error obteniendo estadísticas:", error);
        setError("Hubo un error al cargar los datos.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <p className="loading-message">⏳ Cargando estadísticas...</p>;
  if (error) return <p className="error-message">❌ {error}</p>;

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28DFF"];

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">📊 Dashboard de Back Orders</h1>

      {/* 🔹 Layout de Tarjetas */}
      <div className="dashboard-grid">
        {/* 📦 Estados de Back Orders */}
        <div className="dashboard-card">
          <h2>📦 Estados de los Back Orders</h2>
          <div className="chart-container">
            <PieChart width={300} height={300}>
              <Pie
                data={stats.statusCounts}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {stats.statusCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
        </div>

        {/* ⏳ Tiempo Promedio de Procesamiento */}
        <div className="dashboard-card">
          <h2>⏳ Tiempo Promedio de Procesamiento</h2>
          <p className="stat-number">{stats.avgProcessingTime.toFixed(2)} días</p>
        </div>

        {/* ❌ Productos más Rechazados */}
        <div className="dashboard-card">
          <h2>❌ Productos más Rechazados</h2>
          <ul>
            {stats.mostDeniedProducts.length > 0 ? (
              stats.mostDeniedProducts.map((product) => (
                <li key={product._id}>
                  <span className="bold-text">{product._id}</span> - {product.totalDenied} rechazos
                </li>
              ))
            ) : (
              <p className="text-muted">No hay productos rechazados recientemente.</p>
            )}
          </ul>
        </div>

        {/* 🚚 Proveedores con Mejor Cumplimiento */}
        <div className="dashboard-card">
          <h2>🚚 Proveedores con Mejor Cumplimiento</h2>
          <div className="chart-container dashboard-bar-chart">
            <BarChart width={350} height={250} data={stats.supplierPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalShipped" fill="#00C49F" name="Envíos Completados" />
              <Bar dataKey="totalDenied" fill="#FF8042" name="Productos Rechazados" />
            </BarChart>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import { Link } from "react-router-dom";

const AdminNavbar = () => {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between">
        <h1 className="text-xl font-bold">Panel de Administración</h1>
        <ul className="flex space-x-4">
          <li>
            <Link to="/admin" className="hover:text-gray-400">Dashboard</Link>
          </li>
          <li>
            <Link to="/admin/users" className="hover:text-gray-400">Gestión de Usuarios</Link>
          </li>
          <li>
            <Link to="/admin/reset-passwords" className="hover:text-gray-400">Restablecer Contraseñas</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default AdminNavbar;

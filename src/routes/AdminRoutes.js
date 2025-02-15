import { Routes, Route } from "react-router-dom";
import AdminDashboard from "../pages/admin/AdminDashboard";
import ManageUsers from "../pages/admin/ManageUsers";
import ResetPasswords from "../pages/admin/ResetPasswords";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<ManageUsers />} />
      <Route path="/admin/reset-passwords" element={<ResetPasswords />} />
    </Routes>
  );
};

export default AdminRoutes;

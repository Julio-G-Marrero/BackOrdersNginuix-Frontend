import React, { useEffect, useState } from "react";
import axiosInstance from "../../services/axiosInstance";
import Swal from "sweetalert2";
import "./ManageUsers.css";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("vendedor");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const usersPerPage = 15;
  const [editedUser, setEditedUser] = useState({
    name: "",
    email: "",
    role: "vendedor",
  });
  
  useEffect(() => {
    fetchUsers();
  }, [searchQuery, currentPage, selectedStatus]);

  useEffect(() => {
    if (selectedUser) {
      setEditedUser({
        name: selectedUser.name || "",
        email: selectedUser.email || "",
        role: selectedUser.role || "vendedor",
      });
    }
  }, [selectedUser]);
  
  const filterAndPaginateUsers = () => {
    let filtered = [...users];
  
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  
    if (filterStatus !== "Todos") {
      filtered = filtered.filter((user) => user.status === filterStatus);
    }
  
    setFilteredUsers(filtered);
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/admin/users", {
        params: { search: searchQuery, page: currentPage, limit: 15, status: selectedStatus }
      });

      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleApproveUser = async () => {
    try {
      await axiosInstance.post(`/admin/users/approve/${selectedUser._id}`, { role: selectedRole });
      Swal.fire({
        icon: "success",
        title: "Usuario aprobado con éxito.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000
      });
      fetchUsers(); // Refrescar la lista
      setShowEditModal(false);
    } catch (error) {
      console.error("Error aprobando usuario:", error);
      Swal.fire({
        icon: "error",
        title: "Hubo un error al aprobar el usuario.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000
      });

    }
  };
  

  const handleRejectUser = async () => {
    try {
      await axiosInstance.post(`/admin/users/reject/${selectedUser._id}`);
      Swal.fire({
        icon: "warning",
        title: "Acceso rechazado",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000
      });
      fetchUsers();
      handleCloseModal();
    } catch (error) {
      console.error("Error rejecting user:", error);
    }
  };

  const handleDeleteUser = async () => {
    const confirmDelete = await Swal.fire({
      title: "¿Eliminar usuario?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirmDelete.isConfirmed) {
      try {
        await axiosInstance.delete(`/admin/users/${selectedUser._id}`);
        Swal.fire({
          icon: "success",
          title: "Usuario eliminado correctamente",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000
        });
        fetchUsers();
        handleCloseModal();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleChangeUserRole = async (role) => {
    try {
      await axiosInstance.patch(`/admin/users/${selectedUser._id}/role`, { role });
      Swal.fire({
        icon: "success",
        title: "Rol actualizado correctamente",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000
      });
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const handleUpdateUser = async () => {
    try {
      await axiosInstance.put(`/admin/users/${selectedUser._id}`, editedUser);
      fetchUsers(); // 🔄 Refrescar lista
      Swal.fire("Usuario actualizado", "Los cambios han sido guardados.", "success");
      setShowEditModal(false);
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      Swal.fire("❌ Error", "No se pudo actualizar el usuario.", "error");
    }
  };

  const handleRestrictAccess = async () => {
    if (!selectedUser) return;
  
    if (selectedUser.status === "restricted") {
      Swal.fire({
        icon: "info",
        title: "Este usuario ya está restringido.",
      });
      return;
    }
  
    try {
      await axiosInstance.patch(`/admin/users/${selectedUser._id}/restrict`);
  
      Swal.fire({
        icon: "warning",
        title: "Acceso Restringido",
        text: "El usuario ha sido restringido con éxito.",
      });
  
      fetchUsers(); // 🔄 Refresca la lista de usuarios
      setShowEditModal(false);
    } catch (error) {
      console.error("❌ Error al restringir acceso:", error);
  
      Swal.fire({
        icon: "error",
        title: "Error al restringir acceso",
        text: error.response?.data?.message || "No se pudo restringir el acceso del usuario.",
      });
    }
  };

  const handleRestoreAccess = async () => {
    if (!selectedUser) return;
  
    if (selectedUser.status !== "restricted") {
      Swal.fire({
        icon: "info",
        title: "Este usuario ya tiene acceso.",
      });
      return;
    }
  
    try {
      await axiosInstance.patch(`/admin/users/${selectedUser._id}/restore`);
  
      Swal.fire({
        icon: "success",
        title: "Acceso Restaurado",
        text: "El usuario ahora puede ingresar nuevamente.",
      });
  
      fetchUsers(); // 🔄 Refresca la lista de usuarios
      setShowEditModal(false);
    } catch (error) {
      console.error("❌ Error al restaurar acceso:", error);
  
      Swal.fire({
        icon: "error",
        title: "Error al restaurar acceso",
        text: error.response?.data?.message || "No se pudo restaurar el acceso del usuario.",
      });
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gestión de Usuarios</h2>

      {/* 🔹 Filtros y búsqueda */}
      <div className="filters-container">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={searchQuery}
          onChange={handleSearch}
          className="input-field"
        />
        <select value={selectedStatus} onChange={(e) => handleFilterChange(e.target.value)} className="select-field">
          <option value="">Todos los estados</option>
          <option value="pending_approval">Pendiente</option>
          <option value="approved">Aprobado</option>
          <option value="restricted">Restringido</option>
        </select>
      </div>
      {/* 🔹 Tabla de usuarios */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Nombre</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Rol</th>
            <th className="border p-2">Estado</th>
            <th className="border p-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            [...users]
              .filter(user => user.createdAt) // Asegurar que existan fechas válidas
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) 
              .map((user) => (
                <tr key={user._id} className="text-center cursor-pointer" onClick={() => handleSelectUser(user)}>
                  <td className="border p-2">{user.name}</td>
                  <td className="border p-2">{user.email}</td>
                  <td className="border p-2">{user.role || "sin definir"}</td>
                  <td className="border p-2">
                    {user.status === "pending_approval" ? "Pendiente" : 
                    user.status === "restricted" ? "Restringido" : 
                    user.status === "rejected" ? "Rechazado" : 
                    "Aprobado"}
                  </td>
                  <td className="border p-2">
                    <button className="bg-blue-500 text-white px-2 py-1 rounded">👁 Ver</button>
                  </td>
                </tr>
              ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center p-4">No se encontraron usuarios</td>
            </tr>
          )}
        </tbody>

      </table>

      {/* 🔹 Modal de edición */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="modal-title">Gestión de Usuario</h3>

            {/* 🔹 Si el usuario está pendiente de aprobación */}
            {selectedUser.status === "pending_approval" ? (
              <>
                <p className="modal-warning">Este usuario está pendiente de aprobación.</p>

                {/* 📌 Información del Usuario */}
                <div className="modal-info-box">
                  <p><strong>Nombre:</strong> {selectedUser.name || "No disponible"}</p>
                  <p><strong>Email:</strong> {selectedUser.email || "No disponible"}</p>
                  <p><strong>Estado:</strong> Pendiente de aprobación</p>
                  <p><strong>Fecha de Registro:</strong> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "No disponible"}</p>
                </div>

                {/* ✅ Selección de rol antes de aprobar */}
                <label className="modal-label">Asignar Rol:</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="modal-select"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="gerente">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>

                <div className="modal-buttons">
                  <button className="btn btn-approve" onClick={handleApproveUser}>
                    Aprobar Acceso
                  </button>
                  <button className="btn btn-reject" onClick={handleRejectUser}>
                    Rechazar Acceso
                  </button>
                </div>
              </>
            ) : selectedUser.status === "rejected" ? (
              <>
                {/* 🔹 Si el usuario tiene acceso rechazado */}
                <p className="modal-warning">Este usuario ha sido rechazado.</p>

                {/* 📌 Información del Usuario Rechazado */}
                <div className="modal-info-box">
                  <p><strong>Nombre:</strong> {selectedUser.name || "No disponible"}</p>
                  <p><strong>Email:</strong> {selectedUser.email || "No disponible"}</p>
                  <p><strong>Estado:</strong> Acceso Rechazado</p>
                  <p><strong>Fecha de Registro:</strong> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "No disponible"}</p>
                </div>

                {/* ✅ Selección de rol para aprobar el acceso */}
                <label className="modal-label">Asignar Rol para Aprobar:</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="modal-select"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="gerente">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>

                <div className="modal-buttons">
                  <button className="btn btn-approve" onClick={handleApproveUser}>
                    Aprobar Acceso
                  </button>
                  <button className="btn btn-delete" onClick={handleDeleteUser}>
                    Eliminar Usuario
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* 🔹 Si el usuario ya está aprobado, permitir edición */}
                <p className="modal-success">Este usuario está aprobado.</p>

                {/* 📌 Formulario para Editar Usuario */}
                <div className="modal-info-box">
                  <label className="modal-label">Nombre:</label>
                  <input
                    type="text"
                    value={editedUser.name}
                    onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                    className="modal-input"
                  />

                  <label className="modal-label">Email:</label>
                  <input
                    type="email"
                    value={editedUser.email}
                    onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                    className="modal-input"
                  />

                  <label className="modal-label">Rol:</label>
                  <select
                    value={editedUser.role}
                    onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value })}
                    className="modal-select"
                  >
                    <option value="admin">Administrador</option>
                    <option value="gerente">Gerente</option>
                    <option value="vendedor">Vendedor</option>
                  </select>

                  <label className="modal-label">Estado:</label>
                  <input
                    type="text"
                    value={selectedUser.status}
                    disabled
                    className="modal-input disabled"
                  />
                </div>

                {/* Botones de acción */}
                <div className="modal-buttons">
                  <button className="btn btn-save" onClick={handleUpdateUser}>
                    Guardar Cambios
                  </button>
                  {selectedUser.status === "restricted" ? (
                    <button className="btn btn-restore" onClick={handleRestoreAccess}>
                      Restaurar Acceso
                    </button>
                  ) : (
                    <button className="btn btn-restrict" onClick={handleRestrictAccess}>
                    Restringir Acceso
                    </button>
                  )}
                  <button className="btn btn-delete" onClick={handleDeleteUser}>
                     Eliminar Usuario
                  </button>
                </div>
              </>
            )}

            {/* 🔹 Botón de cierre */}
            <button className="btn btn-close" onClick={handleCloseModal}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;

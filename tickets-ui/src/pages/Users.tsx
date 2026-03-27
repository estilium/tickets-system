import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};

const defaultForm = {
  name: "",
  email: "",
  password: "",
  role: "REQUESTER",
  active: true,
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const openNewUser = () => {
    setEditingUser(null);
    setForm({ ...defaultForm });
    setError("");
    setShowModal(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      active: user.active,
    });
    setError("");
    setShowModal(true);
  };

  const handleChange = (field: string, value: any) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.role || (!editingUser && !form.password)) {
      setError("Completa todos los campos obligatorios");
      return;
    }

    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, {
          name: form.name,
          email: form.email,
          role: form.role,
          active: form.active,
          ...(form.password ? { password: form.password } : {}),
        });
      } else {
        await api.post("/users", {
          name: form.name,
          email: form.email,
          role: form.role,
          password: form.password,
        });
      }

      setShowModal(false);
      await loadUsers();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Error al guardar el usuario");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("¿Eliminar este usuario?");
    if (!confirmed) return;

    try {
      await api.delete(`/users/${id}`);
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el usuario");
    }
  };

  const goToAdminActions = () => {
    navigate("/admin/actions");
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Usuarios</h2>
          <p className="text-sm text-gray-500">Ver, agregar, editar y eliminar usuarios.</p>
        </div>

        <button
          onClick={openNewUser}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Agregar usuario
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-auto">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Nombre</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Rol</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Activo</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-4" colSpan={5}>Cargando...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="px-4 py-4" colSpan={5}>No hay usuarios registrados.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.active ? 'Sí' : 'No'}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => openEditUser(user)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-3">Acciones de Administrador</h3>
        <p className="text-sm text-gray-600 mb-4">
          Accede a la página de administración para realizar acciones globales del sistema.
        </p>
        <button
          onClick={goToAdminActions}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Ir a Admin Actions
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {editingUser ? 'Editar usuario' : 'Agregar usuario'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

            <div className="grid grid-cols-1 gap-4">
              <input
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nombre"
                className="w-full border p-2 rounded"
              />
              <input
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Email"
                type="email"
                className="w-full border p-2 rounded"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={form.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  <option value="REQUESTER">REQUESTER</option>
                  <option value="AGENT">AGENT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => handleChange('active', e.target.checked)}
                  />
                  Activo
                </label>
              </div>
              <input
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                type="password"
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

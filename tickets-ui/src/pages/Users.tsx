import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DndContext } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "../api/api";

function getCurrentUserRole(): string | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw)?.role ?? null;
  } catch {
    return null;
  }
}

type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};

type Category = {
  id: string;
  name: string;
  order: number;
};

const defaultForm = {
  username: "",
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
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const navigate = useNavigate();
  const currentRole = getCurrentUserRole();
  const isAgent = currentRole === "AGENT";
  const isAdmin = currentRole === "ADMIN";
  const roleOptions = isAgent ? ["REQUESTER", "AGENT"] : ["REQUESTER", "AGENT", "ADMIN"];

  useEffect(() => {
    loadUsers();
    loadCategories();
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

  async function loadCategories() {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((category) => category.id === active.id);
    const newIndex = categories.findIndex((category) => category.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const nextCategories = arrayMove(categories, oldIndex, newIndex);
    setCategories(nextCategories);

    try {
      await api.patch("/categories/order", {
        ids: nextCategories.map((category) => category.id),
      });
      await loadCategories();
    } catch (err: any) {
      console.error(err);
      alert("No se pudo reordenar categorías");
      await loadCategories();
    }
  };

  const openNewUser = () => {
    setEditingUser(null);
    setForm({ ...defaultForm });
    setError("");
    setShowModal(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      active: user.active,
    });
    setError("");
    setShowModal(true);
  };

  const openNewCategory = () => {
    setCategoryName("");
    setCategoryError("");
    setCategoryToEdit(null);
    setShowCategoryModal(true);
  };

  const openEditCategory = (category: Category) => {
    setCategoryToEdit(category);
    setCategoryName(category.name);
    setCategoryError("");
    setShowCategoryModal(true);
  };

  const handleChange = (field: string, value: any) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.username || !form.name || !form.email || !form.role || (!editingUser && !form.password)) {
      setError("Completa todos los campos obligatorios");
      return;
    }

    if (isAgent && form.role === "ADMIN") {
      setError("Los agentes no pueden crear usuarios ADMIN");
      return;
    }

    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, {
          username: form.username,
          name: form.name,
          email: form.email,
          role: form.role,
          active: form.active,
          ...(form.password ? { password: form.password } : {}),
        });
      } else {
        await api.post("/users", {
          username: form.username,
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

  const handleDelete = async (id: string, targetRole: string) => {
    if (isAgent && targetRole === "ADMIN") {
      alert("No puedes eliminar administradores");
      return;
    }
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

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      setCategoryError("Ingrese un nombre para la categoría");
      return;
    }

    try {
      if (categoryToEdit) {
        await api.put(`/categories/${categoryToEdit.id}`, { name: categoryName.trim() });
      } else {
        await api.post("/categories", { name: categoryName.trim() });
      }

      setShowCategoryModal(false);
      setCategoryToEdit(null);
      setCategoryName("");
      setCategoryError("");
      await loadCategories();
      alert(categoryToEdit ? "Categoría actualizada correctamente" : "Categoría creada correctamente");
    } catch (err: any) {
      console.error(err);
      setCategoryError(err.response?.data?.message || "Error al guardar la categoría");
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    const confirmed = window.confirm(`¿Eliminar categoría ${category.name}?`);
    if (!confirmed) return;

    try {
      await api.delete(`/categories/${category.id}`);
      await loadCategories();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "No se pudo eliminar la categoría");
    }
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
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Usuario</th>
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
              users.map((user) => {
                const deleteDisabled = isAgent && user.role === "ADMIN";
                const editDisabled = !isAdmin;

                return (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3">{user.username}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.role}</td>
                    <td className="px-4 py-3">{user.active ? 'Sí' : 'No'}</td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => isAdmin && openEditUser(user)}
                        disabled={editDisabled}
                        title={editDisabled ? "Solo ADMIN puede editar usuarios" : undefined}
                        className={`px-3 py-1 bg-yellow-500 text-white rounded ${editDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-600"}`}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.role)}
                        disabled={deleteDisabled}
                        title={deleteDisabled ? "No puedes eliminar administradores" : undefined}
                        className={`px-3 py-1 bg-red-600 text-white rounded ${deleteDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700"}`}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-3">Acciones de Administrador</h3>
        <p className="text-sm text-gray-600 mb-4">
          Accede a la página de administración para realizar acciones globales del sistema.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={goToAdminActions}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Ir a Admin Actions
          </button>
          <button
            onClick={openNewCategory}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Administrar categorías
          </button>
        </div>
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
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="Usuario"
                className="w-full border p-2 rounded"
              />
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
                  {roleOptions.map((roleOption) => (
                    <option key={roleOption} value={roleOption}>
                      {roleOption}
                    </option>
                  ))}
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

      {showCategoryModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {categoryToEdit ? 'Editar categoría' : 'Administrar categorías'}
                </h3>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {categoryError && (
              <div className="mb-4 text-sm text-red-600">{categoryError}</div>
            )}

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Categorías existentes</h4>
              {categories.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                  No hay categorías registradas.
                </div>
              ) : (
                <DndContext onDragEnd={handleCategoryDragEnd}>
                  <SortableContext
                    items={categories.map((category) => category.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {categories.map((category) => (
                        <SortableCategoryItem
                          key={category.id}
                          category={category}
                          onEdit={() => openEditCategory(category)}
                          onDelete={() => handleDeleteCategory(category)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Nombre de la categoría"
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryToEdit(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {categoryToEdit ? 'Guardar cambios' : 'Guardar categoría'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SortableCategoryItem({ category, onEdit, onDelete }: { category: Category; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-gray-400 hover:text-gray-600 cursor-grab"
        >
          ⠿
        </button>
        <span>{category.name}</span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

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
import Metrics from "./Metrics";

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
  assignedArea?: string | null;
  active: boolean;
};

type Category = {
  id: string;
  name: string;
  order: number;
};

type TicketLocation = {
  id: string;
  name: string;
  order: number;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    name: string;
    email: string;
  } | null;
};

function getApiErrorMessage(err: unknown, fallback: string) {
  if (typeof err === "object" && err !== null && "response" in err) {
    const apiError = err as { response?: { data?: { message?: string } } };
    return apiError.response?.data?.message || fallback;
  }

  return fallback;
}

const defaultForm = {
  username: "",
  name: "",
  email: "",
  password: "",
  role: "REQUESTER",
  assignedArea: "",
  active: true,
};

type AdminSection = "overview" | "users" | "catalogs" | "mttr" | "announcements" | "tools";

const adminSections: Array<{ id: AdminSection; label: string }> = [
  { id: "overview", label: "Resumen" },
  { id: "users", label: "Usuarios" },
  { id: "catalogs", label: "Catálogos" },
  { id: "mttr", label: "MTTR" },
  { id: "announcements", label: "Avisos" },
  { id: "tools", label: "Herramientas" },
];

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<TicketLocation[]>([]);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<TicketLocation | null>(null);
  const [locationName, setLocationName] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementToEdit, setAnnouncementToEdit] = useState<Announcement | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [announcementError, setAnnouncementError] = useState("");
  const navigate = useNavigate();
  const currentRole = getCurrentUserRole();
  const isAgent = currentRole === "AGENT";
  const isAdmin = currentRole === "ADMIN";
  const roleOptions = isAgent
    ? ["REQUESTER", "AGENT"]
    : ["REQUESTER", "AGENT", "CHECKLIST_MANAGER", "ADMIN"];
  const activeUsers = users.filter((user) => user.active).length;
  const activeAnnouncements = announcements.filter((announcement) => announcement.active).length;
  const visibleAdminSections = adminSections.filter((section) => {
    if (section.id === "announcements" && !isAdmin) return false;
    if (section.id === "tools" && !isAdmin) return false;
    return true;
  });

  useEffect(() => {
    loadUsers();
    loadCategories();
    loadLocations();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    async function loadInitialAnnouncements() {
      try {
        const res = await api.get("/announcements/admin");
        setAnnouncements(res.data);
      } catch (err) {
        console.error(err);
      }
    }

    loadInitialAnnouncements();
  }, [isAdmin]);

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

  async function loadLocations() {
    try {
      const res = await api.get("/locations");
      setLocations(res.data?.data ?? res.data ?? []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAnnouncements() {
    if (!isAdmin) return;

    try {
      const res = await api.get("/announcements/admin");
      setAnnouncements(res.data);
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
    } catch (err: unknown) {
      console.error(err);
      alert("No se pudo reordenar categorías");
      await loadCategories();
    }
  };

  const handleLocationDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = locations.findIndex((location) => location.id === active.id);
    const newIndex = locations.findIndex((location) => location.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const nextLocations = arrayMove(locations, oldIndex, newIndex);
    setLocations(nextLocations);

    try {
      await api.patch("/locations/order", {
        ids: nextLocations.map((location) => location.id),
      });
      await loadLocations();
    } catch (err: unknown) {
      console.error(err);
      alert("No se pudo reordenar ubicaciones");
      await loadLocations();
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
      assignedArea: user.assignedArea || "",
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

  const openNewLocation = () => {
    setLocationName("");
    setLocationError("");
    setLocationToEdit(null);
    setShowLocationModal(true);
  };

  const openEditLocation = (location: TicketLocation) => {
    setLocationToEdit(location);
    setLocationName(location.name);
    setLocationError("");
    setShowLocationModal(true);
  };

  const resetAnnouncementForm = () => {
    setAnnouncementToEdit(null);
    setAnnouncementTitle("");
    setAnnouncementBody("");
    setAnnouncementActive(true);
    setAnnouncementError("");
  };

  const openEditAnnouncement = (announcement: Announcement) => {
    setAnnouncementToEdit(announcement);
    setAnnouncementTitle(announcement.title);
    setAnnouncementBody(announcement.body);
    setAnnouncementActive(announcement.active);
    setAnnouncementError("");
  };

  const handleChange = (field: string, value: string | boolean) => {
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
          assignedArea: form.assignedArea,
          active: form.active,
          ...(form.password ? { password: form.password } : {}),
        });
      } else {
        await api.post("/users", {
          username: form.username,
          name: form.name,
          email: form.email,
          role: form.role,
          assignedArea: form.assignedArea,
          password: form.password,
        });
      }

      setShowModal(false);
      await loadUsers();
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, "Error al guardar el usuario"));
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

  const goToChecklistAdmin = () => {
    navigate("/admin/checklist");
  };

  const goToKanban = () => {
    navigate("/kanban");
  };

  const goToImport = () => {
    navigate("/tickets/import");
  };

  const goToHistoricalTicket = () => {
    navigate("/tickets/new");
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
    } catch (err: unknown) {
      console.error(err);
      setCategoryError(getApiErrorMessage(err, "Error al guardar la categoría"));
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    const confirmed = window.confirm(`¿Eliminar categoría ${category.name}?`);
    if (!confirmed) return;

    try {
      await api.delete(`/categories/${category.id}`);
      await loadCategories();
    } catch (err: unknown) {
      console.error(err);
      alert(getApiErrorMessage(err, "No se pudo eliminar la categoría"));
    }
  };

  const handleSaveLocation = async () => {
    if (!locationName.trim()) {
      setLocationError("Ingrese un nombre para la ubicación");
      return;
    }

    try {
      if (locationToEdit) {
        await api.put(`/locations/${locationToEdit.id}`, { name: locationName.trim() });
      } else {
        await api.post("/locations", { name: locationName.trim() });
      }

      setShowLocationModal(false);
      setLocationToEdit(null);
      setLocationName("");
      setLocationError("");
      await loadLocations();
      alert(locationToEdit ? "Ubicación actualizada correctamente" : "Ubicación creada correctamente");
    } catch (err: unknown) {
      console.error(err);
      setLocationError(getApiErrorMessage(err, "Error al guardar la ubicación"));
    }
  };

  const handleDeleteLocation = async (location: TicketLocation) => {
    const confirmed = window.confirm(`¿Eliminar ubicación ${location.name}?`);
    if (!confirmed) return;

    try {
      await api.delete(`/locations/${location.id}`);
      await loadLocations();
    } catch (err: unknown) {
      console.error(err);
      alert(getApiErrorMessage(err, "No se pudo eliminar la ubicación"));
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementBody.trim()) {
      setAnnouncementError("Completa el título y el mensaje del aviso");
      return;
    }

    try {
      const payload = {
        title: announcementTitle.trim(),
        body: announcementBody.trim(),
        active: announcementActive,
      };

      if (announcementToEdit) {
        await api.patch(`/announcements/${announcementToEdit.id}`, payload);
      } else {
        await api.post("/announcements", payload);
      }

      resetAnnouncementForm();
      await loadAnnouncements();
    } catch (err: unknown) {
      console.error(err);
      setAnnouncementError(getApiErrorMessage(err, "No se pudo guardar el aviso"));
    }
  };

  const handleDeleteAnnouncement = async (announcement: Announcement) => {
    const confirmed = window.confirm(`¿Eliminar el aviso ${announcement.title}?`);
    if (!confirmed) return;

    try {
      await api.delete(`/announcements/${announcement.id}`);
      if (announcementToEdit?.id === announcement.id) {
        resetAnnouncementForm();
      }
      await loadAnnouncements();
    } catch (err: unknown) {
      console.error(err);
      alert(getApiErrorMessage(err, "No se pudo eliminar el aviso"));
    }
  };

  const handleToggleAnnouncement = async (announcement: Announcement) => {
    try {
      await api.patch(`/announcements/${announcement.id}`, {
        active: !announcement.active,
      });
      await loadAnnouncements();
    } catch (err: unknown) {
      console.error(err);
      alert(getApiErrorMessage(err, "No se pudo actualizar el aviso"));
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Panel de control</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Administración</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Gestiona usuarios, catálogos, avisos y herramientas del sistema desde un solo lugar.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveSection("users");
              openNewUser();
            }}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Nuevo usuario
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setActiveSection("tools");
                goToChecklistAdmin();
              }}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Checklist
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat label="Usuarios activos" value={activeUsers} detail={`${users.length} usuarios totales`} />
        <AdminStat label="Categorías" value={categories.length} detail="Ordenables por arrastre" />
        <AdminStat label="Ubicaciones" value={locations.length} detail="Disponibles en tickets" />
        {isAdmin && (
          <AdminStat label="Avisos activos" value={activeAnnouncements} detail={`${announcements.length} avisos totales`} />
        )}
      </div>

      <div className="mb-6 overflow-x-auto border-b border-slate-200">
        <div className="flex min-w-max gap-1">
          {visibleAdminSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeSection === section.id
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {activeSection === "overview" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <button
            type="button"
            onClick={() => setActiveSection("users")}
            className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <div className="text-sm font-semibold text-slate-900">Usuarios</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">Altas, roles, estado y áreas asignadas.</p>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("catalogs")}
            className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <div className="text-sm font-semibold text-slate-900">Catálogos</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">Categorías y ubicaciones para clasificar tickets.</p>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("mttr")}
            className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <div className="text-sm font-semibold text-slate-900">MTTR</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">Consulta y genera registros mensuales de tiempo de resolución.</p>
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveSection("announcements")}
              className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="text-sm font-semibold text-slate-900">Avisos</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">Mensajes visibles para usuarios requester.</p>
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveSection("tools")}
              className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-red-200 hover:shadow-md"
            >
              <div className="text-sm font-semibold text-slate-900">Herramientas</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">Acciones globales y administración de checklist.</p>
            </button>
          )}
        </div>
      )}

      {activeSection === "mttr" && (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <Metrics />
        </section>
      )}

      {activeSection === "users" && (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Usuarios</h3>
              <p className="text-sm text-slate-500">Ver, agregar, editar y eliminar usuarios.</p>
            </div>
            <button
              type="button"
              onClick={openNewUser}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Agregar usuario
            </button>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Usuario</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Rol</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Área</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Activo</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td className="px-4 py-4 text-sm text-slate-500" colSpan={7}>Cargando...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-sm text-slate-500" colSpan={7}>No hay usuarios registrados.</td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const deleteDisabled = isAgent && user.role === "ADMIN";
                    const editDisabled = !isAdmin;

                    return (
                      <tr key={user.id}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{user.username}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{user.role}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{user.assignedArea || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${user.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                            {user.active ? "Sí" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => isAdmin && openEditUser(user)}
                              disabled={editDisabled}
                              title={editDisabled ? "Solo ADMIN puede editar usuarios" : undefined}
                              className={`rounded-md border px-3 py-1 text-sm font-semibold ${editDisabled ? "cursor-not-allowed border-slate-200 text-slate-300" : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"}`}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(user.id, user.role)}
                              disabled={deleteDisabled}
                              title={deleteDisabled ? "No puedes eliminar administradores" : undefined}
                              className={`rounded-md border px-3 py-1 text-sm font-semibold ${deleteDisabled ? "cursor-not-allowed border-slate-200 text-slate-300" : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"}`}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeSection === "catalogs" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Categorías</h3>
                <p className="text-sm text-slate-500">Administra las categorías de tickets.</p>
              </div>
              <button type="button" onClick={openNewCategory} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                Agregar
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No hay categorías registradas.</div>
            ) : (
              <DndContext onDragEnd={handleCategoryDragEnd}>
                <SortableContext items={categories.map((category) => category.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <SortableCategoryItem key={category.id} category={category} onEdit={() => openEditCategory(category)} onDelete={() => handleDeleteCategory(category)} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Ubicaciones</h3>
                <p className="text-sm text-slate-500">Administra las ubicaciones disponibles para tickets.</p>
              </div>
              <button type="button" onClick={openNewLocation} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                Agregar
              </button>
            </div>

            {locations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No hay ubicaciones registradas.</div>
            ) : (
              <DndContext onDragEnd={handleLocationDragEnd}>
                <SortableContext items={locations.map((location) => location.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {locations.map((location) => (
                      <SortableLocationItem key={location.id} location={location} onEdit={() => openEditLocation(location)} onDelete={() => handleDeleteLocation(location)} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </section>
        </div>
      )}

      {activeSection === "announcements" && isAdmin && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Avisos</h3>
              <p className="text-sm text-slate-500">Publica mensajes visibles en el inicio de los usuarios requester.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No hay avisos registrados.</div>
              ) : (
                announcements.map((announcement) => (
                  <div key={announcement.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-slate-900">{announcement.title}</h4>
                          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${announcement.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                            {announcement.active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(announcement.createdAt).toLocaleDateString()}
                          {announcement.author?.name ? ` · ${announcement.author.name}` : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => openEditAnnouncement(announcement)} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700 hover:bg-amber-100">
                          Editar
                        </button>
                        <button type="button" onClick={() => handleToggleAnnouncement(announcement)} className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                          {announcement.active ? "Ocultar" : "Publicar"}
                        </button>
                        <button type="button" onClick={() => handleDeleteAnnouncement(announcement)} className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-100">
                          Eliminar
                        </button>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{announcement.body}</p>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h4 className="font-semibold text-slate-950">{announcementToEdit ? "Editar aviso" : "Agregar aviso"}</h4>
              {announcementError && <div className="mt-3 text-sm text-red-600">{announcementError}</div>}
              <div className="mt-4 space-y-3">
                <input value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} placeholder="Título del aviso" className="w-full rounded-md border border-slate-300 p-2 text-sm" />
                <textarea value={announcementBody} onChange={(e) => setAnnouncementBody(e.target.value)} placeholder="Mensaje completo" rows={8} className="w-full rounded-md border border-slate-300 p-2 text-sm" />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={announcementActive} onChange={(e) => setAnnouncementActive(e.target.checked)} />
                  Publicar aviso
                </label>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                {announcementToEdit && (
                  <button type="button" onClick={resetAnnouncementForm} className="rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
                    Cancelar
                  </button>
                )}
                <button type="button" onClick={handleSaveAnnouncement} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  {announcementToEdit ? "Guardar cambios" : "Agregar aviso"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeSection === "tools" && isAdmin && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-950">Herramientas administrativas</h3>
            <p className="text-sm text-slate-500">Accesos a módulos avanzados y acciones globales del sistema.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <button type="button" onClick={goToChecklistAdmin} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50">
              <div className="font-semibold text-slate-900">Administrador de checklist</div>
              <p className="mt-1 text-sm text-slate-500">Configura máquinas, items y reglas de checklist.</p>
            </button>
            <button type="button" onClick={goToImport} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50">
              <div className="font-semibold text-slate-900">Importar CSV</div>
              <p className="mt-1 text-sm text-slate-500">Carga tickets históricos o registros masivos desde archivo.</p>
            </button>
            <button type="button" onClick={goToKanban} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50">
              <div className="font-semibold text-slate-900">Kanban</div>
              <p className="mt-1 text-sm text-slate-500">Consulta y organiza tickets por flujo de trabajo.</p>
            </button>
            <button type="button" onClick={goToHistoricalTicket} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50">
              <div className="font-semibold text-slate-900">Ticket histórico</div>
              <p className="mt-1 text-sm text-slate-500">Crea tickets con fecha y hora históricas para registros administrativos.</p>
            </button>
            <button type="button" onClick={goToAdminActions} className="rounded-lg border border-red-200 bg-red-50 p-4 text-left transition hover:bg-red-100">
              <div className="font-semibold text-red-800">Admin actions</div>
              <p className="mt-1 text-sm text-red-700">Acciones globales de alto impacto para tickets.</p>
            </button>
          </div>
        </section>
      )}

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
                <input
                  value={form.assignedArea}
                  onChange={(e) => handleChange('assignedArea', e.target.value)}
                  placeholder="Área asignada"
                  className="w-full border p-2 rounded"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => handleChange('active', e.target.checked)}
                  />
                  Activo
                </label>
                <input
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder={editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                  type="password"
                  className="w-full border p-2 rounded"
                />
              </div>
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
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {categoryToEdit ? 'Editar categoría' : 'Agregar categoría'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryToEdit(null);
                  setCategoryName("");
                  setCategoryError("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {categoryError && (
              <div className="mb-4 text-sm text-red-600">{categoryError}</div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Nombre de la categoría"
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryToEdit(null);
                  setCategoryName("");
                  setCategoryError("");
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

      {showLocationModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {locationToEdit ? 'Editar ubicación' : 'Agregar ubicación'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowLocationModal(false);
                  setLocationToEdit(null);
                  setLocationName("");
                  setLocationError("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {locationError && (
              <div className="mb-4 text-sm text-red-600">{locationError}</div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <input
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Nombre de la ubicación"
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowLocationModal(false);
                  setLocationToEdit(null);
                  setLocationName("");
                  setLocationError("");
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLocation}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {locationToEdit ? 'Guardar cambios' : 'Guardar ubicación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminStat({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <span className="text-3xl font-bold text-slate-950">{value}</span>
        <span className="text-right text-xs text-slate-500">{detail}</span>
      </div>
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
      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-md px-2 py-1 text-slate-400 hover:bg-white hover:text-slate-600"
        >
          ⠿
        </button>
        <span className="text-sm font-medium text-slate-800">{category.name}</span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700 hover:bg-amber-100"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-100"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

function SortableLocationItem({ location, onEdit, onDelete }: { location: TicketLocation; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: location.id,
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
      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-md px-2 py-1 text-slate-400 hover:bg-white hover:text-slate-600"
        >
          ⠿
        </button>
        <span className="text-sm font-medium text-slate-800">{location.name}</span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700 hover:bg-amber-100"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-100"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

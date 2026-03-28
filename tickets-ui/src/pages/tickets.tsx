import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import { useSocketEvent } from "../hooks/useRealtime";

const statusBorderColors: Record<string, string> = {
  OPEN: "border-blue-500",
  IN_PROGRESS: "border-yellow-500",
  CLOSED: "border-green-500",
};

const ticketCardClass = (status: string) =>
  `block bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition border-l-4 p-4 ${
    statusBorderColors[status] ?? "border-gray-400"
  }`;

export default function Tickets() {

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ticketLocation, setTicketLocation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showClosed, setShowClosed] = useState(true);

  // 🔥 modal state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [animate, setAnimate] = useState(false);


  async function loadTickets() {
    const res = await api.get("/tickets");
    setTickets(res.data.data);
    setLoading(false);
  }

  useSocketEvent("ticket.updated", (updated: any) => {
    setTickets((prev) =>
      prev.map((ticket) => (ticket.id === updated.id ? { ...ticket, ...updated } : ticket)),
    );
  });

  useSocketEvent("ticket.created", (newTicket: any) => {
    setTickets((prev) => {
      if (prev.some((ticket) => ticket.id === newTicket.id)) {
        return prev;
      }
      return [newTicket, ...prev];
    });
  });

  useEffect(() => {
    loadTickets();
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      setCurrentUser(JSON.parse(rawUser));
    }
  }, []);

useEffect(() => {
  api.get("/categories").then(res => {
    console.log("CATEGORIES:", res.data);

    setCategories(res.data?.data ?? res.data ?? []);
  });
}, []);

  async function handleCreate() {
    if (!title || !description || !ticketLocation || !categoryId) {
      alert("Por favor completa todos los campos (Título, Descripción, Ubicación y Categoría)");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("ticketLocation", ticketLocation);
      formData.append("categoryId", categoryId);
      if (attachment) {
        formData.append("files", attachment);
      }

      await api.post("/tickets", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowModal(false);
      setTitle("");
      setDescription("");
      setTicketLocation("");
      setCategoryId("");
      setAttachment(null);

      loadTickets();
    } catch (err) {
      console.error(err);
      alert("Error al crear el ticket");
    }
  }

  const handleCloseModal = () => {
  setAnimate(false);
  setTimeout(() => {
    setShowModal(false);
    setAttachment(null);
  }, 200);
};

  const filteredTickets = tickets
    .filter((t: any) => showClosed || t.status !== "CLOSED")
    .filter((t: any) =>
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedTo?.name?.toLowerCase().includes(search.toLowerCase())
    );

  if (loading) return <div>Loading...</div>;

  return (
      <div className="space-y-4">

{/* HEADER */}
<div className="flex justify-between items-center mb-4">

  <h1 className="text-xl font-semibold">Tickets</h1>

  {/* 🔥 BOTONES */}
  <div className="flex gap-2">

    <button
      onClick={() => {
        setShowModal(true);
        setTimeout(() => setAnimate(true), 10);
      }}
      className="bg-blue-600 hover:bg-blue-900 text-white px-4 py-2 rounded"
    >
      + New Ticket
    </button>

    {!currentUser?.role || currentUser.role !== "REQUESTER" ? (
      <Link
        to="/kanban"
        className="bg-gray-700 hover:bg-gray-900 text-white px-4 py-2 rounded"
      >
        Kanban
      </Link>
    ) : null}

  </div>

</div>
      {/* buscador y filtros */}
      <div className="flex flex-col gap-2 mb-4 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded p-2 w-full md:w-1/2"
        />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={() => setShowClosed((prev) => !prev)}
            />
            Mostrar tickets cerrados
          </label>
        </div>
      </div>

      {/* cards */}
      {filteredTickets.map((t: any) => (
        <Link key={t.id} to={`/tickets/${t.id}`} className={ticketCardClass(t.status)}>
        <div className="flex justify-between items-center">
            <div className="font-semibold text-lg">{t.title}</div>
            <StatusBadge status={t.status} />
       </div>

        <div className="text-gray-500 text-sm mt-1">
  {t.description}
</div>

            {/* 🔥 NUEVO */}
            <div className="flex gap-4 mt-2 text-xs text-gray-500">

              <div>
                📍 {t.ticketLocation ?? "Sin ubicación"}
              </div>

              <div>
                🏷️ {t.category?.name ?? "Sin categoría"}
              </div>

            </div>
        <div className="flex justify-between items-center mt-3 text-sm">
          <div className="text-gray-400">
             Ticket #{t.id.slice(0, 6)}
            </div>

            <div className="text-gray-600">
              👤 {t.assignedTo?.name ?? "Unassigned"}
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Creado por {t.requester?.name ?? t.requester?.email ?? "desconocido"}
        </div>
        </Link>
      ))}

      {/* 🔥 MODAL (AHORA SÍ BIEN PUESTO) */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/20 bg-opacity-20 flex items-center justify-center z-50 transition-opacity duration-300">
          
          <div
  className={`
    bg-white p-6 rounded shadow w-[540px]
    transform transition-all duration-300
    ${animate ? "scale-100 opacity-100" : "scale-90 opacity-0"}
  `}
>

            <h2 className="text-xl font-bold mb-4">Nuevo Ticket</h2>

            <input
              type="text"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border p-2 mb-2 rounded"
            />

            <textarea
              placeholder="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border p-2 mb-4 rounded min-h-[170px]"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen inicial (opcional)
            </label>
            <div className="flex flex-col gap-2 mb-3">
              <input
                id="ticket-image-upload"
                type="file"
                accept="image/*"
                onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <label
                htmlFor="ticket-image-upload"
                className="inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700"
              >
                Seleccionar imagen
              </label>
              {attachment && (
                <div className="text-sm text-gray-600">
                  {attachment.name}
                </div>
              )}
            </div>
            
                        <select
              value={ticketLocation}
              onChange={(e) => setTicketLocation(e.target.value)}
              className="w-full border p-2 mb-2 rounded"
              required
            >
              <option value="">Selecciona ubicación *</option>
              <option value="Oficina General">Oficina General</option>
              <option value="Pintura">Pintura</option>
              <option value="Inyección">Inyección</option>
              <option value="Embarques">Embarques</option>
              <option value="almacen">Almacén</option>
              <option value="moldes">Moldes</option>
              <option value="HR">HR</option>
              <option value="Enfermería">Enfermería</option>
            </select>

              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border p-2 mb-2 rounded"
                required
              >
                <option value="">Selecciona categoría *</option>

                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
                
            <div className="flex justify-end gap-2">
              
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancelar
              </button>

              <button
                onClick={handleCreate}
                disabled={!title || !description || !ticketLocation || !categoryId}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                Crear
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

function StatusBadge({ status }: any) {
  const colors: any = {
    OPEN: "bg-blue-300 text-blue-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-green-100 text-green-800"
  };

  return (
    <span className={`px-2 py-1 text-xs rounded ${colors[status]}`}>
      {status}
    </span>
  );
}

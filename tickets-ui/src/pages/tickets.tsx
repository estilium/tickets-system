import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import { useSocketEvent } from "../hooks/useRealtime";
import { ticketLocations } from "../constants/ticketLocations";
import { useLanguage } from "../i18n";
import { getCatalogName } from "../utils/catalogTranslations";

const statusBorderColors: Record<string, string> = {
  OPEN: "border-blue-500",
  IN_PROGRESS: "border-yellow-500",
  CLOSED: "border-green-500",
};

const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ticketCardClass = (status: string) =>
  `block bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition border-l-4 p-4 ${
    statusBorderColors[status] ?? "border-gray-400"
  }`;

export default function Tickets() {
  const { language, t } = useLanguage();

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ticketLocation, setTicketLocation] = useState("");
  const [availableLocations, setAvailableLocations] = useState(ticketLocations);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showClosed, setShowClosed] = useState(true);
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalTickets, setTotalTickets] = useState(0);

  // 🔥 modal state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [animate, setAnimate] = useState(false);


  async function loadTickets() {
    try {
      setLoading(true);
      const res = await api.get("/tickets", {
        params: {
          page,
          limit,
          search: search || undefined,
          showClosed,
          year: filterYear || undefined,
          month: filterMonth || undefined,
        },
      });
      setTickets(res.data.data);
      setTotalTickets(res.data.meta?.total ?? res.data.data.length);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error cargando tickets:", err);
      setLoading(false);
    }
  }

  useSocketEvent("ticket.deleted", (deletedTicketId: any) => {
    setTickets((prev) => prev.filter((ticket) => ticket.id !== deletedTicketId));
  });

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
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      setCurrentUser(JSON.parse(rawUser));
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadTickets();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [page, limit, search, showClosed, filterYear, filterMonth]);

useEffect(() => {
  api.get("/categories").then(res => {
    setCategories(res.data?.data ?? res.data ?? []);
  });
}, []);

useEffect(() => {
  api.get("/locations")
    .then((res) => {
      const locations = (res.data?.data ?? res.data ?? []).map((location: any) => ({
        value: location.name,
        label: getCatalogName(location, language),
      }));
      if (locations.length > 0) {
        setAvailableLocations(locations);
      }
    })
    .catch((err) => {
      console.error("Error cargando ubicaciones:", err);
    });
}, [language]);

  async function handleCreate() {
    if (!title || !description || !ticketLocation || !categoryId) {
      alert(t("tickets.validation.required"));
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
      alert(t("tickets.createError"));
    }
  }

  const handleCloseModal = () => {
  setAnimate(false);
  setTimeout(() => {
    setShowModal(false);
    setAttachment(null);
  }, 200);
};

  const filteredTickets = tickets;
  const totalPages = Math.max(1, Math.ceil(totalTickets / limit));
  const rangeStart = totalTickets === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, totalTickets);

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, index) => (currentYear - index).toString());
  }, []);

  if (loading) return <div>{t("common.loading")}</div>;

  return (
      <div className="space-y-4">

{/* HEADER */}
<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

  <h1 className="text-xl font-semibold">{t("tickets.title")}</h1>

  {/* 🔥 BOTONES */}
  <div className="flex flex-col gap-2 sm:flex-row">

    <button
      onClick={() => {
        setShowModal(true);
        setTimeout(() => setAnimate(true), 10);
      }}
      className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-900 sm:w-auto"
    >
      {t("tickets.new")}
    </button>

    {!currentUser?.role || currentUser.role !== "REQUESTER" ? (
      <Link
        to="/kanban"
        className="inline-flex w-full items-center justify-center rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-900 sm:w-auto"
      >
        {t("tickets.kanban")}
      </Link>
    ) : null}

  </div>

</div>
      {/* buscador y filtros */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder={t("tickets.search")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border rounded p-2 flex-1"
          />
          {(search || filterYear || filterMonth) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterYear("");
                setFilterMonth("");
                setPage(1);
              }}
            className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
            >
              {t("tickets.clearFilters")}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <select
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
                setFilterMonth("");
                setPage(1);
              }}
              className="border rounded p-2 text-sm"
            >
              <option value="">{t("tickets.allYears")}</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value);
                setPage(1);
              }}
              className="border rounded p-2 text-sm"
              disabled={!filterYear}
            >
              <option value="">{t("tickets.allMonths")}</option>
              <option value="01">Enero</option>
              <option value="02">Febrero</option>
              <option value="03">Marzo</option>
              <option value="04">Abril</option>
              <option value="05">Mayo</option>
              <option value="06">Junio</option>
              <option value="07">Julio</option>
              <option value="08">Agosto</option>
              <option value="09">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={() => {
                setShowClosed((prev) => !prev);
                setPage(1);
              }}
            />
            {t("tickets.showClosed")}
          </label>
        </div>
      </div>

      {/* cards */}
      <div className="mb-4 flex flex-col gap-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="font-semibold">
            {rangeStart}-{rangeEnd} de {totalTickets} ticket{totalTickets !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded border p-2 text-sm"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="rounded border px-3 py-2 font-semibold disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="px-2 font-semibold text-gray-700">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="rounded border px-3 py-2 font-semibold disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No se encontraron tickets con los filtros aplicados.</p>
          <button
            onClick={() => {
              setSearch("");
              setFilterYear("");
              setFilterMonth("");
              setPage(1);
            }}
            className="mt-2 text-blue-600 hover:underline"
          >
            Limpiar todos los filtros
          </button>
        </div>
      ) : (
        <>
          {filteredTickets.map((ticket: any) => (
        <Link key={ticket.id} to={`/tickets/${ticket.id}`} className={ticketCardClass(ticket.status)}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 break-words text-lg font-semibold">{ticket.title}</div>
            <StatusBadge status={ticket.status} />
       </div>

        <div className="text-gray-500 text-sm mt-1 line-clamp-2">
  {ticket.description}
</div>

            {/* 🔥 INFO DEL TICKET */}
            <div className="mt-2 flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:gap-4">

              <div>
                📍 {ticket.ticketLocation ?? "Sin ubicación"}
              </div>

              <div>
                🏷️ {getCatalogName(ticket.category, language)}
              </div>

            </div>

            {/* ID COMPLETO Y FECHA */}
            <div className="bg-gray-50 rounded p-2 mt-3 text-xs font-mono">
              <div className="text-gray-600">
                🆔 {ticket.id}
              </div>
              <div className="text-gray-500 mt-1">
                📅 {t("tickets.created")}: {formatDate(ticket.createdAt)}
              </div>
            </div>

        <div className="mt-3 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-gray-600">
              👤 {ticket.assignedTo?.name ?? "Unassigned"}
          </div>
          <div className="text-gray-500 text-xs">
            Creado por {ticket.requester?.name ?? ticket.requester?.email ?? "desconocido"}
          </div>
        </div>
        </Link>
      ))}
        </>
      )}

      {/* 🔥 MODAL (AHORA SÍ BIEN PUESTO) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 p-4 transition-opacity duration-300">
          
          <div
  className={`
    max-h-[calc(100vh-2rem)] w-full max-w-[540px] overflow-y-auto rounded bg-white p-4 shadow sm:p-6
    transform transition-all duration-300
    ${animate ? "scale-100 opacity-100" : "scale-90 opacity-0"}
  `}
>

            <h2 className="text-xl font-bold mb-4">{t("tickets.modal.title")}</h2>

            <input
              type="text"
              placeholder={t("tickets.modal.ticketTitle")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border p-2 mb-2 rounded"
            />

            <textarea
              placeholder={t("tickets.modal.description")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border p-2 mb-4 rounded min-h-[170px]"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("tickets.modal.image")}
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
                {t("tickets.modal.selectImage")}
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
              <option value="">{t("tickets.modal.location")} *</option>
              {availableLocations.map((location) => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>

              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border p-2 mb-2 rounded"
                required
              >
                <option value="">{t("tickets.modal.category")} *</option>

                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getCatalogName(c, language)}
                  </option>
                ))}
              </select>
                
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              
              <button
                onClick={handleCloseModal}
                className="rounded bg-gray-300 px-4 py-2"
              >
                {t("common.cancel")}
              </button>

              <button
                onClick={handleCreate}
                disabled={!title || !description || !ticketLocation || !categoryId}
                className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {t("tickets.modal.create")}
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

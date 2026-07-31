import { useEffect, useState } from "react";
import { api } from "../api/api";
import { Link } from "react-router-dom";
import { DndContext } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useSocketEvent } from "../hooks/useRealtime";

export default function Kanban() {

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTickets() {
    const res = await api.get("/tickets");
    setTickets(res.data.data);
    setLoading(false);
  }

  useEffect(() => {
    loadTickets();
  }, []);

  // 🔥 agrupamos por status
const columns = {
  OPEN: tickets.filter(t => t.status === "OPEN"),
  IN_PROGRESS: tickets.filter(t => t.status === "IN_PROGRESS"),
  CLOSED: tickets.filter(t => t.status === "CLOSED"),
};

  useSocketEvent("ticket.updated", (updated: any) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
    );
  });

  useSocketEvent("ticket.created", (newTicket: any) => {
    setTickets((prev) => {
      if (prev.some((t) => t.id === newTicket.id)) return prev;
      return [...prev, newTicket];
    });
  });

  if (loading) return <div className="p-4">Loading...</div>;

const handleDragEnd = async (event: any) => {
  const { active, over } = event;

  if (!over) return;

  const ticketId = active.id;
  const newStatus = over.id;

  console.log("Mover ticket:", ticketId, "→", newStatus);
// encontrar ticket y validar que el status realmente cambió no hacer nada si el ticket ya tiene ese status
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket || ticket.status === newStatus) return;

  // Actualizar estado local inmediatamente
  setTickets(prev => prev.map(t =>
    t.id === ticketId ? { ...t, status: newStatus } : t
  ));

  try {
    // Hacer API call para actualizar en backend
    await api.patch(`/tickets/${ticketId}/status`, {
      status: newStatus
    });
    console.log("Ticket actualizado exitosamente");
    setTickets(prev =>
  prev.map(t =>
    t.id === ticketId ? { ...t, status: newStatus } : t
  )
); 
  } catch (err: any) {
    console.error("Error actualizando ticket:", err);
    // Revertir cambio si falla
    setTickets(prev => prev.map(t =>
      t.id === ticketId ? { ...t, status: tickets.find(t => t.id === ticketId)?.status } : t
    ));
    alert("Error actualizando ticket");
  }
};

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Kanban</h1>

        <Link
          to="/users"
          className="inline-flex w-fit items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          Panel admin
        </Link>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Column title="Open" tickets={columns.OPEN} id="OPEN" />
        <Column title="In Progress" tickets={columns.IN_PROGRESS} id="IN_PROGRESS" />
        <Column title="Closed" tickets={columns.CLOSED} id="CLOSED" />
        

      </div>
          </DndContext>
    </div>

    );  
}



// 🔥 columna reutilizable
function Column({ title, tickets, id}: any) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
     <div
      ref={setNodeRef}
      className={`min-h-[260px] rounded p-3 transition lg:min-h-[500px] ${isOver ? "bg-blue-100" : "bg-gray-100"}`}
    >

      <h2 className="font-semibold mb-3">{title}</h2>

      <div className="space-y-2">

        {tickets.map((t: any) => (
          <DraggableCard
            key={t.id}
            ticket={t}
          />
        ))}

      </div>

    </div>
  );
}

function DraggableCard({ ticket }: any) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: ticket.id,
  });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab rounded bg-white p-3 shadow active:cursor-grabbing"
    >
      <div className="break-words font-medium">{ticket.title}</div>

      <div className="text-xs text-gray-500 mt-1">
        #{ticket.id.slice(0, 6)}
      </div>

<div className="text-xs mt-2">
  👤 {ticket.assignedTo?.name ?? "Unassigned"}
</div>

{/* 🔥 NUEVO */}
<div className="text-xs text-gray-500 mt-1">
  📍 {ticket.ticketLocation ?? "-"}  
</div>

<div className="text-xs text-gray-500">
  🏷️ {ticket.category?.name ?? "-"}
</div>
    </div>
  );
}

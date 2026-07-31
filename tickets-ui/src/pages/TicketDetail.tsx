import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "../api/api"
import { useSocketEvent, getAttachmentUrl } from "../hooks/useRealtime"

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


export default function TicketDetail() {

  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<any>(null)
  const [message, setMessage] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [showDeleteTicketModal, setShowDeleteTicketModal] = useState(false)
  const [isDeletingTicket, setIsDeletingTicket] = useState(false)
  const isRequester = currentUser?.role === "REQUESTER"
  const isAdmin = currentUser?.role === "ADMIN"
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null)
  const [isDeletingMessage, setIsDeletingMessage] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const handleRealtimeMessage = useCallback(
    (payload: any) => {
      if (payload.ticketId !== id) return
      setTicket((prev: any) =>
        prev && prev.id === id
          ? {
              ...prev,
              messages: [...(prev.messages ?? []), payload],
            }
          : prev,
      )
    },
    [id],
  )

  const handleRealtimeTicketUpdated = useCallback(
    (payload: any) => {
      if (payload.id !== id) return
      setTicket((prev: any) =>
        prev
          ? {
              ...prev,
              ...payload,
              messages: prev.messages ?? [],
            }
          : prev,
      )
    },
    [id],
  )

  useSocketEvent("message.created", handleRealtimeMessage)
  useSocketEvent("ticket.updated", handleRealtimeTicketUpdated)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    }
  }, [])

  useEffect(() => {
    loadAgents()
  }, [])

  async function loadAgents() {
    try {
      const res = await api.get("/users?role=ASSIGNEE")
      setUsers(res.data)
    } catch (err) {
      console.error("Error loading assignable users:", err)
    }
  }

  const handleAssign = async (assignTo?: string) => {
    const targetId = assignTo || currentUser?.id
    
    console.log("Current User:", currentUser)
    console.log("Target ID:", targetId)
    console.log("Assign To Param:", assignTo)
    
    if (!targetId) {
      alert("Selecciona un usuario")
      return
    }

    try {
      await api.patch(`/tickets/${ticket.id}/assign`, {
        assignedToId: targetId,
      });

      alert("Ticket asignado");
      setSelectedUserId("")
      await loadTicket()
    } catch (err: any) {
      console.error("ERROR COMPLETO:", err);
      console.error("DATA:", err.response?.data);
      alert("Error: " + (err.response?.data?.message?.[0] || err.response?.data?.message || "No se pudo asignar"))
    }
  };

  async function loadTicket() {
    try {
      const res = await api.get(`/tickets/${id}`)
      setTicket(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function sendMessage() {

    if (!message && !file) return

    const formData = new FormData()
    if (message.trim()) {
      formData.append("content", message.trim())
    }

    if (file) {
      formData.append("files", file) // 👈 importante
    }

    try {

      await api.post(`/tickets/${id}/messages`, formData)

      setMessage("")
      setFile(null)

if (fileRef.current) {
  fileRef.current.value = ""
}

      await loadTicket()

    } catch (err:any) {
      console.error(err.response?.data)
      alert("Error sending message")
    }
  }

  async function closeTicket() {
    try {
      await api.patch(`/tickets/${id}/status`, {
        status: "CLOSED"
      })
      await loadTicket()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDeleteMessage() {
    if (!ticket || !messageToDelete) return;
    setIsDeletingMessage(true);

    try {
      await api.delete(`/tickets/${ticket.id}/messages/${messageToDelete}`);
      setTicket((prev: any) =>
        prev
          ? {
              ...prev,
              messages: prev.messages?.filter((m: any) => m.id !== messageToDelete) ?? [],
            }
          : prev,
      );
      setToast({ message: "Mensaje eliminado", type: "success" });
      setMessageToDelete(null);
    } catch (err) {
      console.error("Error deleting message", err);
      setToast({ message: "No se pudo eliminar el mensaje", type: "error" });
    } finally {
      setIsDeletingMessage(false);
    }
  }

  async function handleDeleteTicket() {
    if (!ticket) {
      console.error("❌ No hay ticket para eliminar");
      return;
    }
    
    console.log("🗑️ Iniciando eliminación de ticket");
    console.log("Usuario actual:", currentUser);
    console.log("¿Es Admin?:", currentUser?.role === "ADMIN");
    console.log("Ticket ID:", ticket.id);
    
    setIsDeletingTicket(true);

    try {
      const ticketId = ticket.id;
      const fullUrl = `/tickets/${ticketId}`;
      console.log("📤 Enviando solicitud DELETE a:", fullUrl);
      
      const response = await api.delete(fullUrl);
      
      console.log("✅ Respuesta del servidor:", response);
      console.log("✅ Status:", response.status);
      console.log("✅ Ticket eliminado exitosamente");
      console.log("✅ Esperando a que el servidor notifique a otros clientes...");
      
      // Show success toast
      setToast({ message: "✅ Ticket eliminado correctamente", type: "success" });
      setShowDeleteTicketModal(false);
      setIsDeletingTicket(false);
      
      // Wait a bit then redirect
      console.log("⏳ Redirigiendo a /tickets en 3 segundos...");
      setTimeout(() => {
        console.log("🚀 Redirigiendo ahora...");
        navigate("/tickets");
      }, 3000);
      
    } catch (err: any) {
      setIsDeletingTicket(false);
      console.error("❌ Error completo:", err);
      console.error("Status:", err.response?.status);
      console.error("StatusText:", err.response?.statusText);
      console.error("Data:", err.response?.data);
      console.error("Error message:", err.message);
      
      let errorMsg = "No se pudo eliminar el ticket";
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.statusText) {
        errorMsg = `Error ${err.response.status}: ${err.response.statusText}`;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      console.error("❌ Mensaje de error final:", errorMsg);
      setToast({ message: "❌ " + (typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)), type: "error" });
    }
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    loadTicket()
  }, [])

  if (!ticket) return <div className="p-4 md:p-6">Loading...</div>

  const primaryAttachment = ticket.attachments?.find((a: any) => !a.messageId)
  const primaryAttachmentUrl = primaryAttachment
    ? getAttachmentUrl(primaryAttachment.url)
    : null

  return (
    <div className="space-y-6">
      <div className="space-y-6 rounded-lg bg-white p-4 shadow md:p-6">

        {/* HEADER */}
        <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="mt-2 flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:gap-4">


 <button
    onClick={() => navigate("/tickets")}
    className="text-blue-600 hover:underline"
  >
    ← Regresar
  </button>

  <div>
    📍 {ticket.ticketLocation ?? "Sin ubicación"}
  </div>

  <div>
    🏷️ {ticket.category?.name ?? "Sin categoría"}
  </div>

</div>


  {/* DERECHA (acciones) */}
  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
    
    {ticket.status !== "CLOSED" && !isRequester && (
      <>
        {ticket.assignedToId !== currentUser?.id && (
          <button
            onClick={() => handleAssign()}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Asignarme
          </button>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">Selecciona Agente</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email} ({u.role})
              </option>
            ))}
          </select>
          <button
            onClick={() => handleAssign(selectedUserId)}
            disabled={!selectedUserId}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Asignar a
          </button>
        </div>
      </>
    )}

    {ticket.status !== "CLOSED" && !isRequester && (
      <button
        onClick={closeTicket}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Close Ticket
      </button>
    )}

    {isAdmin && (
      <button
        onClick={() => setShowDeleteTicketModal(true)}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Eliminar ticket
      </button>
    )}

  </div>

</div>

      {/* TITLE */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">

        <h1 className="break-words text-2xl font-bold sm:text-3xl lg:text-4xl">
          {ticket.title}
        </h1>

        <span className="text-sm bg-gray-200 px-2 py-1 rounded">
          {ticket.status}
        </span>

      </div>

      {/* CREATED AT */}
      <div className="text-sm text-gray-500 mb-4">
        <span>📅 Creado: {formatDate(ticket.createdAt)}</span>
        {ticket.closedAt && (
          <span className="sm:ml-4">✓ Cerrado: {formatDate(ticket.closedAt)}</span>
        )}
      </div>

      {/* DESCRIPTION */}
      <p className="mb-10 whitespace-pre-wrap break-words text-base leading-relaxed text-gray-600 sm:text-lg">
        {ticket.description}
      </p>

      {/* SHOW INITIAL ATTACHMENT IMAGE */}
      {primaryAttachment && (
        <div className="mb-6">
          <h3 className="text-md  text-gray-500 mb-2">
            <b>Imagen inicial del ticket:</b>
          </h3>
          <div className="flex gap-2 flex-wrap">
            <img
              key={primaryAttachment.id}
              src={primaryAttachmentUrl ?? undefined}
              onClick={() => primaryAttachmentUrl && setSelectedImage(primaryAttachmentUrl)}
              className="w-48 h-48 object-cover rounded-xl cursor-pointer hover:scale-105 transition"
            />
          </div>
        </div>
      )}
      </div>

      <div className="space-y-6 rounded-lg bg-white p-4 shadow md:p-6">
      {/* MESSAGES */}
      <div className="space-y-4 mb-6">

        {ticket.messages?.map((m:any) => (
          <div key={m.id} className="rounded-3xl bg-slate-100 p-4 shadow-sm">
            <div className="text-xs text-gray-500 mb-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{m.author?.name}</span>
                  <span className="text-gray-400">•</span>
                  <span>{formatDate(m.createdAt)}</span>
                </div>
                {isAdmin && (
                  <button
                    className="text-red-600 text-[10px] uppercase tracking-wide"
                    onClick={() => setMessageToDelete(m.id)}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
            {m.content && (
              <div className="whitespace-pre-wrap text-gray-800">
                {m.content}
              </div>
            )}
            {m.attachments?.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-3">
                {m.attachments.map((a:any) => {
                  const attachmentUrl = getAttachmentUrl(a.url)
                  return (
                    <img
                      key={a.id}
                      src={attachmentUrl}
                      onClick={() => setSelectedImage(attachmentUrl)}
                      className="w-full max-w-sm rounded-2xl object-cover shadow-sm cursor-pointer hover:opacity-90 transition"
                    />
                  )
                })}
              </div>
            )}
          </div>
        ))}
{selectedImage && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 p-4"
    onClick={() => setSelectedImage(null)}
  >
    <img
      src={selectedImage}
      className="max-w-[90%] max-h-[90%] rounded shadow-lg"
    />
  </div>
)}
      </div>

      {/* INPUT */}
      {ticket.status !== "CLOSED" && (
        <div className="flex flex-col gap-2">

          <div className="flex flex-col gap-2 sm:flex-row">

            <input
              className="flex-1 rounded border p-2"
              value={message}
              onChange={(e)=>setMessage(e.target.value)}
              placeholder="Write a message..."
            />

            <button
              onClick={sendMessage}
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              Send
            </button>

          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              id="message-file-upload"
              type="file"
              className="hidden"
              onChange={(e)=>setFile(e.target.files?.[0] || null)}
            />
            <label
              htmlFor="message-file-upload"
              className="inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 w-max"
            >
              Seleccionar archivo
            </label>
            {file && (
              <span className="text-xs text-gray-500">
                {file.name}
              </span>
            )}
          </div>

        </div>
      )}

      </div>
      {messageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl sm:p-6">
            <p className="text-sm text-gray-700 mb-4">
              Eliminarás permanentemente este mensaje. ¿Deseas continuar?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setMessageToDelete(null)}
                disabled={isDeletingMessage}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                onClick={handleDeleteMessage}
                disabled={isDeletingMessage}
              >
                {isDeletingMessage ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl sm:p-6">
            <h3 className="text-lg font-bold text-red-600 mb-3">⚠️ Eliminar Ticket</h3>
            <p className="text-sm text-gray-700 mb-4">
              Este ticket se eliminará permanentemente junto con sus mensajes y archivos.
              <br />
              <br />
              <strong>Esta acción no se puede deshacer.</strong>
            </p>
            <div className="bg-gray-100 p-3 rounded mb-4">
              <p className="text-xs text-gray-600">ID: <code>{ticket?.id}</code></p>
              <p className="text-xs text-gray-600">Título: <strong>{ticket?.title}</strong></p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-semibold"
                onClick={() => {
                  console.log("❌ Cancelando eliminación");
                  setShowDeleteTicketModal(false);
                }}
                disabled={isDeletingTicket}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-semibold flex items-center gap-2"
                onClick={handleDeleteTicket}
                disabled={isDeletingTicket}
              >
                {isDeletingTicket ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Eliminando…
                  </>
                ) : (
                  <>🗑️ Sí, eliminar ticket</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed inset-x-4 bottom-20 rounded px-4 py-3 text-sm shadow-lg md:bottom-6 md:left-auto md:right-6 md:w-fit ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>

  )

  
}


import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "../api/api"


export default function TicketDetail() {

  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<any>(null)
  const [message, setMessage] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

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
    formData.append("content", message || "")

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

  useEffect(() => {
    loadTicket()
  }, [])

  if (!ticket) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="flex items-center mb-4">

        <button
          onClick={() => navigate("/tickets")}
          className="text-blue-600 hover:underline"
        >
          ← Back
        </button>

        {ticket.status !== "CLOSED" && (
          <button
            onClick={closeTicket}
            className="ml-auto bg-red-600 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        )}

      </div>

      {/* TITLE */}
      <div className="flex items-center gap-3 mb-4">

        <h1 className="text-2xl font-bold">
          {ticket.title}
        </h1>

        <span className="text-sm bg-gray-200 px-2 py-1 rounded">
          {ticket.status}
        </span>

      </div>

      {/* DESCRIPTION */}
      <p className="mb-6 text-gray-600">
        {ticket.description}
      </p>

      {/*SHOW IMG*/}
      {ticket.attachments?.length > 0 && (
      <div className="mb-6">

      <h3 className="text-sm text-gray-500 mb-2">
       <h1><b> Documentos Adjuntos: </b> </h1>
      </h3>

      <div className="flex gap-2 flex-wrap">

      {ticket.attachments.map((a:any)=>(
<img
  key={a.id}
  src={`http://localhost:3000${a.url}`}
  onClick={() => setSelectedImage(`http://localhost:3000${a.url}`)}
  className="w-32 h-32 object-cover rounded cursor-pointer hover:scale-105 transition"
/>
      ))}

    </div>

  </div>
    )}

      {/* MESSAGES */}
      <div className="space-y-3 mb-6">

        {ticket.messages?.map((m:any) => (

          <div key={m.id} className="border p-3 rounded bg-white">

            <div className="text-sm text-gray-500">
              {m.author?.name}
            </div>

            <div>{m.content}</div>

            {/* IMÁGENES */}
            {m.attachments?.map((a:any)=>(
              <img
                key={a.id}
                src={`http://localhost:3000${a.url}`}
                className="mt-2 max-w-xs rounded"
              />
            ))}

          </div>

        ))}
{selectedImage && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
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

          <div className="flex gap-2">

            <input
              className="border p-2 flex-1"
              value={message}
              onChange={(e)=>setMessage(e.target.value)}
              placeholder="Write a message..."
            />

            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white px-4 rounded"
            >
              Send
            </button>

          </div>

          <input
            ref={fileRef}
            type="file"
            onChange={(e)=>setFile(e.target.files?.[0] || null)}
          />

          {file && (
            <span className="text-xs text-gray-500">
              {file.name}
            </span>
          )}

        </div>
      )}

    </div>

    
  )

  
}


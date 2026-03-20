import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api/api"


export default function NewTicket() {

  const Navigate = useNavigate()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate () ;

  async function createTicket(e:any) {
    e.preventDefault()

    setLoading(true)

    try {

      await api.post("/tickets", {
        title,
        description
      })

      Navigate("/tickets")

    } catch(err) {
      console.error(err)
      alert("Error creating ticket")
    }

    setLoading(false)
  }

  return (
    <div className="max-w-xl">

        <button
  onClick={() => navigate("/tickets")}
  className="mb-4 text-blue-600 hover:underline bg-red-100 text-yellow-800"
>
  ← Back to tickets
</button>

      <h1 className="text-2xl font-bold mb-6">
        Create Ticket
      </h1>

      <form onSubmit={createTicket} className="space-y-4">

        <input
          placeholder="Title"
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
          className="border rounded p-2 w-full"
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
          className="border rounded p-2 w-full h-32"
        />

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Creating..." : "Create Ticket"}
        </button>

      </form>

    </div>
  )
}
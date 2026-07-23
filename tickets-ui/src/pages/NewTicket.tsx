import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api/api"
import { ticketLocations } from "../constants/ticketLocations"

export default function NewTicket() {
  const Navigate = useNavigate()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [ticketLocation, setTicketLocation] = useState("")
  const [availableLocations, setAvailableLocations] = useState(ticketLocations)
  const [categoryId, setCategoryId] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [closedAt, setClosedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const rawUser = localStorage.getItem('user')
  const currentUser = rawUser ? JSON.parse(rawUser) : null

  useEffect(() => {
    api.get('/categories').then((res) => {
      setCategories(res.data?.data ?? res.data ?? [])
    })

    api.get('/locations')
      .then((res) => {
        const locations = (res.data?.data ?? res.data ?? []).map((location: any) => ({
          value: location.name,
          label: location.name,
        }))
        if (locations.length > 0) {
          setAvailableLocations(locations)
        }
      })
      .catch((err) => {
        console.error('Error cargando ubicaciones:', err)
      })
  }, [])

  async function createTicket(e: any) {
    e.preventDefault()

    if (!title || !description || !ticketLocation || !categoryId) {
      alert('Please complete all required fields')
      return
    }

    setLoading(true)

    try {
      const payload: any = {
        title,
        description,
        ticketLocation,
        categoryId,
      }

      if (currentUser?.role === 'ADMIN') {
        if (createdAt) payload.createdAt = new Date(createdAt).toISOString()
        if (closedAt) payload.closedAt = new Date(closedAt).toISOString()
      }

      await api.post("/tickets", payload)

      Navigate("/tickets")
    } catch (err) {
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
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded p-2 w-full"
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded p-2 w-full h-32"
        />

        <select
          value={ticketLocation}
          onChange={(e) => setTicketLocation(e.target.value)}
          className="border rounded p-2 w-full"
        >
          <option value="">Select location</option>
          {availableLocations.map((location) => (
            <option key={location.value} value={location.value}>
              {location.label}
            </option>
          ))}
        </select>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border rounded p-2 w-full"
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {currentUser?.role === 'ADMIN' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Created at (history)</label>
              <input
                type="datetime-local"
                className="border rounded p-2 w-full"
                onChange={(e) => setCreatedAt(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Closed at (history)</label>
              <input
                type="datetime-local"
                className="border rounded p-2 w-full"
                onChange={(e) => setClosedAt(e.target.value)}
              />
            </div>
          </div>
        )}

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? "Creating..." : "Create Ticket"}
        </button>

      </form>

    </div>
  )
}

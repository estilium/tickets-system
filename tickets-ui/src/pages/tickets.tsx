import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../api/api"

export default function Tickets() {

  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  async function loadTickets() {
    const res = await api.get("/tickets")
    setTickets(res.data.data)
    setLoading(false)
  }

  useEffect(()=>{
    loadTickets()
  },[])

  const filteredTickets = tickets.filter((t:any) =>
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.assignedTo?.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div>Loading...</div>

  return (
    // Boton add 
    <div className="space-y-4">



                    <div className="flex justify-between items-center mb-4">

            <h1 className="text-xl font-semibold">
                Tickets
            </h1>

            <Link
                to="/tickets/new"
                className="bg-blue-600 text-white px-4 py-2 rounded"
            >
                + New Ticket
            </Link>

            </div>

      {/* buscador */}
      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Search tickets..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          className="border rounded p-2 w-full"
        />
      </div>

      {/* cards */}
      {filteredTickets.map((t:any)=>(
        <Link
          key={t.id}
          to={`/tickets/${t.id}`}
          className="block bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition"
        >

          {/* titulo */}
          <div className="flex justify-between items-center">

            <div className="font-semibold text-lg">
              {t.title}
            </div>

            <StatusBadge status={t.status} />

          </div>

          {/* descripcion */}
          <div className="text-gray-500 text-sm mt-1">
            {t.description}
          </div>

          {/* footer */}
          <div className="flex justify-between items-center mt-3 text-sm">

            <div className="text-gray-400">
              Ticket #{t.id.slice(0,6)}
            </div>

            <div className="text-gray-600">
              👤 {t.assignedTo?.name ?? "Unassigned"}
            </div>

          </div>

        </Link>
      ))}

    </div>
  )
}

function StatusBadge({ status }: any) {

  const colors:any = {
    OPEN: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    CLOSED: "bg-green-100 text-green-800"
  }

  return (
    <span className={`px-2 py-1 text-xs rounded ${colors[status]}`}>
      {status}
    </span>
  )
}
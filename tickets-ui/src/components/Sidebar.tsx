import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-60 h-screen bg-gray-900 text-white flex flex-col p-5">
      <h1 className="text-xl font-bold mb-8">Ticket System</h1>

      <nav className="flex flex-col gap-4">
        <Link to="/">Dashboard</Link>
        <Link to="/tickets">Tickets</Link>
        <Link to="/metrics">Metrics</Link>
        <Link to="/users">Users</Link>
      </nav>
    </div>
  )
}
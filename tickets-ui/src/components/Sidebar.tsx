import { Link } from "react-router-dom";

function getUserRole() {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser)?.role;
  } catch {
    return null;
  }
}

export default function Sidebar() {
  const role = getUserRole();
  const isRequester = role === "REQUESTER";

  return (
    <div className="w-60 h-screen bg-gray-900 text-white flex flex-col p-5">
      <h1 className="text-xl font-bold mb-8">Ticket System</h1>

      <nav className="flex flex-col gap-4 text-gray-300 hover:text-white transition duration-200  size-lg 2xl:text-xl bold">
        <Link to="/">{isRequester ? "Inicio" : "Dashboard"}</Link>
        <Link to="/tickets">Tickets</Link>
        {!isRequester && <Link to="/kanban">Kanban</Link>}
        {!isRequester && <Link to="/users">Users</Link>}
      </nav>
    </div>
  )
}
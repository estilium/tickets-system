import { Link } from "react-router-dom";
import logoMA from "../assets/MA.jpg";

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
    <div className="w-60 h-screen bg-gray-900 text-white flex flex-col p-6">
      <div className="flex flex-col items-start gap-3 mb-10">
        <div className="h-24 w-32 rounded-2xl border border-white/20 bg-white shadow-lg">
          <img src={logoMA} alt="Autotech logo" className="h-full w-full object-contain" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-blue-300">Autotech</p>
      </div>

      <nav className="flex flex-col gap-5 text-gray-100 text-lg font-semibold leading-8 hover:text-white transition duration-200 mt-8">
        <Link to="/">{isRequester ? "Inicio" : "Dashboard"}</Link>
        <Link to="/tickets">Tickets</Link>
        {!isRequester && <Link to="/kanban">Kanban</Link>}
        {!isRequester && <Link to="/users">Users</Link>}
      </nav>
    </div>
  )
}

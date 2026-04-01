import { useState } from "react";
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

const menuItems = [
  { label: "Dashboard", path: "/", icon: "🏠" },
  { label: "Tickets", path: "/tickets", icon: "🎫" },
  { label: "Kanban", path: "/kanban", icon: "🗂️" },
  { label: "Users", path: "/users", icon: "👥" },
];

export default function Sidebar() {
  const role = getUserRole();
  const isRequester = role === "REQUESTER";
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = menuItems.filter((item) =>
    ["Kanban", "Users"].includes(item.label) ? !isRequester : true,
  );

  return (
    <div
      className={`h-screen bg-gray-900 text-white flex flex-col p-4 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex items-center gap-3 mb-10">
        <div className="h-14 w-14 rounded-2xl border border-white/30 bg-white shadow">
          <img src={logoMA} alt="Autotech logo" className="h-full w-full object-contain" />
        </div>
        {!collapsed && (
          <div className="text-sm uppercase tracking-[0.3em] text-slate-200">M-AUTOTECH</div>
        )}
        <button
          className="ml-auto text-xs text-slate-300 border border-white/20 rounded-full px-2 py-1 hover:border-white hover:text-white transition"
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      <nav className="flex flex-col gap-3 text-gray-100 text-lg font-semibold leading-8">
        {filteredItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-white/10 hover:text-white ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {!collapsed && item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

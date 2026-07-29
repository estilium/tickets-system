import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLanguage } from "../i18n";
import autotechLogo from "../assets/autotech-logo.svg";

function getUserRole() {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser)?.role;
  } catch {
    return null;
  }
}

const sidebarStorageKey = "sidebar:collapsed";

type IconName =
  | "chart-pie"
  | "flag"
  | "document-plus"
  | "document-check"
  | "archive-box"
  | "cog-6-tooth"
  | "ellipsis-horizontal"
  | "ellipsis-vertical"
  | "arrow-left-start-on-rectangle";

type NavItem = {
  to: string;
  labelKey:
    | "sidebar.dashboard"
    | "sidebar.home"
    | "sidebar.tickets"
    | "sidebar.inventory"
    | "sidebar.historicalReport"
    | "sidebar.checklist"
    | "sidebar.panel";
  icon: IconName;
  roles?: string[];
  hiddenFor?: string[];
};

const navItems = [
  { to: "/", labelKey: "sidebar.dashboard", icon: "chart-pie", roles: ["AGENT", "ADMIN"] },
  { to: "/", labelKey: "sidebar.home", icon: "chart-pie", roles: ["REQUESTER", "CHECKLIST_MANAGER"] },
  { to: "/tickets", labelKey: "sidebar.tickets", icon: "flag", hiddenFor: ["CHECKLIST_MANAGER"] },
  { to: "/inventory", labelKey: "sidebar.inventory", icon: "archive-box", roles: ["AGENT", "ADMIN"] },
  { to: "/tickets/new", labelKey: "sidebar.historicalReport", icon: "document-plus", roles: ["ADMIN"] },
  { to: "/checklist", labelKey: "sidebar.checklist", icon: "document-check", hiddenFor: ["REQUESTER"] },
  { to: "/users", labelKey: "sidebar.panel", icon: "cog-6-tooth", roles: ["ADMIN"] },
] satisfies NavItem[];

export default function Sidebar() {
  const { t } = useLanguage();
  const role = getUserRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem(sidebarStorageKey) === "true";
  });

  useEffect(() => {
    localStorage.setItem(sidebarStorageKey, String(isCollapsed));
  }, [isCollapsed]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const visibleItems = navItems.filter((item) => {
    if (item.roles && (!role || !item.roles.includes(role))) return false;
    if (item.hiddenFor?.includes(role ?? "")) return false;
    return true;
  });

  return (
    <aside
      className={`h-screen shrink-0 bg-slate-950 text-white flex flex-col border-r border-white/10 shadow-xl transition-[width] duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-5 ${isCollapsed ? "justify-center" : "justify-between"}`}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-blue-400/30 bg-blue-500/10 p-1.5">
            <img src={autotechLogo} alt="M Autotech" className="h-full w-full object-contain" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">M-Autotech</p>
              <p className="text-[10px] uppercase tracking-[0.28em] text-blue-300">Soporte IT</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label={t("sidebar.collapse")}
            title={t("sidebar.collapse")}
          >
            <SidebarIcon name="ellipsis-horizontal" />
          </button>
        )}
      </div>

      {isCollapsed && (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="mx-auto mb-4 grid h-9 w-9 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
          aria-label={t("sidebar.expand")}
          title={t("sidebar.expand")}
      >
          <SidebarIcon name="ellipsis-vertical" />
      </button>
      )}

      <nav className="flex flex-1 flex-col gap-2 px-3 pt-4">
        {visibleItems.map((item) => (
          <NavLink
            key={`${item.to}-${item.labelKey}`}
            to={item.to}
            end={item.to === "/"}
            title={isCollapsed ? t(item.labelKey) : undefined}
            className={({ isActive }) => {
              const isTicketsLinkOnHistory = item.to === "/tickets" && location.pathname === "/tickets/new";
              const active = isActive && !isTicketsLinkOnHistory;

              return `flex h-11 items-center rounded-lg px-3 text-sm font-semibold transition ${
                isCollapsed ? "justify-center" : "gap-3"
              } ${
                active
                  ? "bg-blue-500/20 text-white ring-1 ring-blue-300/20"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`;
            }}
          >
            <span className="grid h-7 min-w-7 place-items-center rounded-md bg-white/5 text-blue-200">
              <SidebarIcon name={item.icon} />
            </span>
            {!isCollapsed && <span className="truncate">{t(item.labelKey)}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-white/10 p-3">
        <button
          type="button"
          onClick={logout}
          className={`flex h-11 w-full items-center rounded-lg px-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 hover:text-red-100 ${
            isCollapsed ? "justify-center" : "gap-3"
          }`}
          title={isCollapsed ? t("sidebar.logout") : undefined}
        >
          <span className="grid h-7 min-w-7 place-items-center rounded-md bg-red-500/10">
            <SidebarIcon name="arrow-left-start-on-rectangle" />
          </span>
          {!isCollapsed && <span>{t("sidebar.logout")}</span>}
        </button>
      </div>
    </aside>
  )
}

function SidebarIcon({ name }: { name: IconName }) {
  const commonProps = {
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.8,
    stroke: "currentColor",
    "aria-hidden": true,
  };

  if (name === "chart-pie") {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3a7.5 7.5 0 0 1 7.5 7.5h-7.5V3Z" />
      </svg>
    );
  }

  if (name === "flag") {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5V5.25m0 0c2.4-1.2 4.8-1.2 7.2 0 2.4 1.2 4.8 1.2 7.2 0v8.25c-2.4 1.2-4.8 1.2-7.2 0-2.4-1.2-4.8-1.2-7.2 0V5.25Z" />
      </svg>
    );
  }

  if (name === "document-check") {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 3.75H6.75A2.25 2.25 0 0 0 4.5 6v12a2.25 2.25 0 0 0 2.25 2.25h10.5A2.25 2.25 0 0 0 19.5 18V8.25L15 3.75h-4.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 3.75v4.5h4.5M8.25 13.5l2.25 2.25 5.25-5.25" />
      </svg>
    );
  }

  if (name === "document-plus") {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 3.75H6.75A2.25 2.25 0 0 0 4.5 6v12a2.25 2.25 0 0 0 2.25 2.25h10.5A2.25 2.25 0 0 0 19.5 18V8.25L15 3.75h-4.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 3.75v4.5h4.5M12 11.25v5.25M9.375 13.875h5.25" />
      </svg>
    );
  }

  if (name === "archive-box") {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h16.5M6 7.5v10.125A2.625 2.625 0 0 0 8.625 20.25h6.75A2.625 2.625 0 0 0 18 17.625V7.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 3.75h13.5l1.5 3.75H3.75l1.5-3.75ZM9.75 11.25h4.5" />
      </svg>
    );
  }

  if (name === "cog-6-tooth") {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.59 3.94c.09-.54.56-.94 1.11-.94h2.6c.55 0 1.02.4 1.11.94l.2 1.2c.07.42.37.76.76.93.1.04.2.08.29.12.39.18.85.15 1.2-.1l1-.71c.45-.32 1.07-.27 1.46.12l1.84 1.84c.39.39.44 1.01.12 1.46l-.71 1c-.25.35-.29.8-.1 1.2.04.1.08.19.12.29.17.39.51.69.93.76l1.2.2c.54.09.94.56.94 1.11v2.6c0 .55-.4 1.02-.94 1.11l-1.2.2c-.42.07-.76.37-.93.76-.04.1-.08.2-.12.29-.18.39-.15.85.1 1.2l.71 1c.32.45.27 1.07-.12 1.46l-1.84 1.84c-.39.39-1.01.44-1.46.12l-1-.71c-.35-.25-.8-.29-1.2-.1-.1.04-.19.08-.29.12-.39.17-.69.51-.76.93l-.2 1.2c-.09.54-.56.94-1.11.94h-2.6c-.55 0-1.02-.4-1.11-.94l-.2-1.2c-.07-.42-.37-.76-.76-.93-.1-.04-.2-.08-.29-.12-.39-.18-.85-.15-1.2.1l-1 .71c-.45.32-1.07.27-1.46-.12l-1.84-1.84c-.39-.39-.44-1.01-.12-1.46l.71-1c.25-.35.29-.8.1-1.2-.04-.1-.08-.19-.12-.29-.17-.39-.51-.69-.93-.76l-1.2-.2C2.65 17 2.25 16.53 2.25 15.98v-2.6c0-.55.4-1.02.94-1.11l1.2-.2c.42-.07.76-.37.93-.76.04-.1.08-.2.12-.29.18-.39.15-.85-.1-1.2l-.71-1c-.32-.45-.27-1.07.12-1.46L6.6 5.52c.39-.39 1.01-.44 1.46-.12l1 .71c.35.25.8.29 1.2.1.1-.04.19-.08.29-.12.39-.17.69-.51.76-.93l.2-1.2Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    );
  }

  if (name === "ellipsis-horizontal") {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
      </svg>
    );
  }

  if (name === "ellipsis-vertical") {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9l-3 3m0 0 3 3m-3-3h12" />
    </svg>
  );
}

export default function Header() {
  const rawUser = localStorage.getItem("user");
  let userName = "Usuario";
  let userRole = "";

  if (rawUser) {
    try {
      const user = JSON.parse(rawUser);
      userName = user?.name || user?.email || userName;
      userRole = user?.role || "";
    } catch {
      userName = "Usuario";
    }
  }

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 px-6 shadow-sm">
      <div className="flex h-full items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-slate-900">
            Bienvenido, {userName} , ¿Como podemos Ayudarte hoy?
          </h1>
        </div>

        {userRole && (
          <div className="hidden items-center gap-3 sm:flex">
            <span className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
              {userRole}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

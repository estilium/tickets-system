import { useLanguage } from "../i18n";

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const rawUser = localStorage.getItem("user");
  let userName = t("common.user");
  let userRole = "";

  if (rawUser) {
    try {
      const user = JSON.parse(rawUser);
      userName = user?.name || user?.email || userName;
      userRole = user?.role || "";
    } catch {
      userName = t("common.user");
    }
  }

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 px-6 shadow-sm">
      <div className="flex h-full items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-slate-900">
            {t("header.welcome", { name: userName })}
          </h1>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          {userRole && (
            <span className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
              {userRole}
            </span>
          )}
          <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold">
            {(["es", "kr", "en"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLanguage(option)}
                className={`px-2.5 py-1 uppercase transition ${
                  language === option ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-white hover:text-slate-900"
                }`}
              >
                {option === "kr" ? "KR" : option.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

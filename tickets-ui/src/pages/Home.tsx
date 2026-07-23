import { useEffect, useState } from "react";
import { api } from "../api/api";
import Dashboard from "./Dashboard";

type Announcement = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

function getUserRole() {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser)?.role;
  } catch {
    return null;
  }
}

export default function Home() {
  const role = getUserRole();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(role === "REQUESTER");

  useEffect(() => {
    if (role !== "REQUESTER") return;

    async function loadAnnouncements() {
      setLoadingAnnouncements(true);
      try {
        const res = await api.get("/announcements");
        setAnnouncements(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAnnouncements(false);
      }
    }

    loadAnnouncements();
  }, [role]);

  if (role === "REQUESTER") {
    return (
      <div className="p-4">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-600">Centro de avisos</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">¿En que podemos ayudarte?</h1>
          <p className="mt-2 text-gray-600">Aquí podrás ver tus avisos e información de inicio.</p>
        </div>

        <div className="space-y-4">
          {loadingAnnouncements ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-gray-500">Cargando avisos...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
              <p className="font-semibold text-slate-800">No hay avisos por el momento.</p>
              <p className="mt-1 text-sm text-gray-500">
                Cuando el equipo publique información importante aparecerá aquí.
              </p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <article key={announcement.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-col gap-1 border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-semibold text-slate-900">{announcement.title}</h2>
                  <time className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </time>
                </div>
                <p className="whitespace-pre-wrap leading-7 text-slate-700">{announcement.body}</p>
              </article>
            ))
          )}
        </div>
      </div>
    );
  }

  if (role === "CHECKLIST_MANAGER") {
    return (
      <div className="p-4">
        <h1 className="text-4xl font-bold mb-4">Checklist asignado</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Usa el checklist para tu área desde el menú izquierdo.</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

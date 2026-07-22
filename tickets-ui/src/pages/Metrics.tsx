import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function Metrics() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [backfillYear, setBackfillYear] = useState(now.getFullYear());
  const [backfillMonth, setBackfillMonth] = useState(now.getMonth() + 1);
  const rawUser = localStorage.getItem("user");
  const currentUser = rawUser ? JSON.parse(rawUser) : null;

  useEffect(() => {
    loadHistory();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/metrics/mttr?year=${year}&month=${month}`);
      setResult(res.data);
    } catch (e) {
      console.error(e);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get("/metrics/mttr-records");
      setHistory(res.data);
    } catch (e) {
      console.error(e);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const backfill = async () => {
    if (!backfillYear || !backfillMonth) return;
    setBackfillLoading(true);
    try {
      await api.post(`/metrics/mttr/backfill?year=${backfillYear}&month=${backfillMonth}`);
      loadHistory();
      if (backfillYear === year && backfillMonth === month) {
        load();
      }
      alert("MTTR backfill completed");
    } catch (e) {
      console.error(e);
      alert("Error during MTTR backfill");
    } finally {
      setBackfillLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Métricas - MTTR mensual</h1>

      <div className="bg-white p-4 rounded shadow mb-4 grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-gray-500">Año</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="block border rounded p-2 w-full"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500">Mes</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="block border rounded p-2 w-full"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={load}
          className="bg-blue-600 text-white px-4 py-2 rounded h-12"
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Cargar MTTR'}
        </button>
      </div>

      {currentUser?.role === 'ADMIN' && (
        <div className="bg-white p-4 rounded shadow mb-4">
          <h2 className="font-semibold mb-3">Backfill MTTR histórico</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm text-gray-500">Año</label>
              <input
                type="number"
                value={backfillYear}
                onChange={(e) => setBackfillYear(Number(e.target.value))}
                className="block border rounded p-2 w-full"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Mes</label>
              <select
                value={backfillMonth}
                onChange={(e) => setBackfillMonth(Number(e.target.value))}
                className="block border rounded p-2 w-full"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <button
              onClick={backfill}
              className="bg-yellow-500 text-black px-4 py-2 rounded"
              disabled={backfillLoading}
            >
              {backfillLoading ? 'Guardando...' : 'Guardar registro MTTR'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-semibold mb-3">Historial MTTR registrado</h2>
        {historyLoading ? (
          <p>Cargando historial...</p>
        ) : history.length === 0 ? (
          <p className="text-gray-500">No hay registros guardados todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="border p-2">Año</th>
                  <th className="border p-2">Mes</th>
                  <th className="border p-2">Cerrados</th>
                  <th className="border p-2">Promedio</th>
                  <th className="border p-2">Mín</th>
                  <th className="border p-2">Máx</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={`${item.year}-${item.month}`}>
                    <td className="border p-2">{item.year}</td>
                    <td className="border p-2">{item.month}</td>
                    <td className="border p-2">{item.totalClosed}</td>
                    <td className="border p-2">{item.mttrMinutesAvg}</td>
                    <td className="border p-2">{item.mttrMinutesMin}</td>
                    <td className="border p-2">{item.mttrMinutesMax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {result ? (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Resultados</h2>
          <p>Año: {result.year} - Mes: {result.month}</p>
          <p>Total cerrados: {result.totalClosed}</p>
          <p>MTTR promedio (min): {result.mttrMinutesAvg}</p>
          <p>MTTR mínimo (min): {result.mttrMinutesMin}</p>
          <p>MTTR máximo (min): {result.mttrMinutesMax}</p>
          <pre className="mt-2 text-xs text-gray-500">{JSON.stringify(result, null, 2)}</pre>
        </div>
      ) : (
        <div className="text-gray-500">No hay resultados. Ejecuta la consulta para obtener MTTR del mes.</div>
      )}
    </div>
  );
}

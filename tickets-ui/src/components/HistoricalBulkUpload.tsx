import { useState } from "react";
import Papa from "papaparse";
import type { ParseResult } from "papaparse";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

const TARGET_FIELDS = [
  'title',
  'description',
  'requesterEmail',
  'assignedToEmail',
  'category',
  'ticketLocation',
  'status',
  'priority',
  'createdAt',
  'closedAt',
];

type CsvRow = Record<string, unknown>;

export default function HistoricalBulkUpload() {
  const navigate = useNavigate();
  const [origFile, setOrigFile] = useState<File | null>(null);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string | null>>(() => {
    const m: Record<string, string | null> = {};
    TARGET_FIELDS.forEach((f) => (m[f] = null));
    return m;
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  function downloadTemplate() {
    const headers = TARGET_FIELDS;
    const sample = [
      ['Fallo en máquina', 'Descripción breve', 'juan@dominio.com', 'agent@dominio.com', 'Mantenimiento', 'INYECCION', 'OPEN', 'HIGH', '2024-06-01T08:30:00Z', ''],
    ];
    const csv = Papa.unparse({ fields: headers, data: sample });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tickets-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileSelect(f: File | null) {
    setOrigFile(f);
    setPreviewHeaders([]);
    setPreviewRows([]);
    setResult(null);
    if (!f) return;

    Papa.parse<CsvRow>(f, {
      preview: 10,
      header: true,
      skipEmptyLines: true,
      complete: (res: ParseResult<CsvRow>) => {
        const headers = res.meta.fields ?? [];
        setPreviewHeaders(headers);
        const rows: string[][] = res.data.map((r) => headers.map((h) => String(r[h] ?? '')));
        setPreviewRows(rows);

        // Auto map by exact match or common variants
        const newMap: Record<string, string | null> = {};
        TARGET_FIELDS.forEach((t) => {
          const candidates = [t, t.toLowerCase(), t.replace(/([A-Z])/g, '_$1').toLowerCase()];
          const found = headers.find((h: string) => candidates.includes(h) || candidates.includes(h.toLowerCase()));
          newMap[t] = found ?? null;
        });
        setMapping(newMap);
      },
      error: (err: Error) => {
        alert('Error parsing CSV: ' + err.message);
      },
    });
  }

  function updateMapping(target: string, column: string | null) {
    setMapping((m) => ({ ...m, [target]: column }));
  }

  async function handleUpload(e: any) {
    e.preventDefault();
    if (!origFile) return alert('Selecciona un archivo CSV');

    // Build normalized CSV according to TARGET_FIELDS using mapping
    setLoading(true);
    setResult(null);
    try {
      const parsed = await new Promise<ParseResult<CsvRow>>((resolve, reject) => {
        Papa.parse<CsvRow>(origFile as File, { header: true, skipEmptyLines: true, complete: resolve, error: reject });
      });

      const rows: CsvRow[] = parsed.data.map((r) => {
        const out: CsvRow = {};
        TARGET_FIELDS.forEach((t) => {
          const col = mapping[t];
          out[t] = col ? (r[col] ?? '') : '';
        });
        return out;
      });

      const csv = Papa.unparse({ fields: TARGET_FIELDS, data: rows });
      const blob = new Blob([csv], { type: 'text/csv' });
      const fileToUpload = new File([blob], 'normalized-tickets.csv', { type: 'text/csv' });

      const fd = new FormData();
      fd.append('file', fileToUpload);

      const res = await api.post('/tickets/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-2xl font-semibold">Carga masiva de tickets (CSV)</h2>
        <button
          type="button"
          onClick={() => navigate("/users")}
          className="inline-flex w-fit items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          Panel admin
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={downloadTemplate}>
          Descargar plantilla CSV
        </button>
        <label className="px-4 py-2 bg-gray-200 rounded cursor-pointer">
          Seleccionar archivo
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {previewHeaders.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold">Previsualización</h3>
          <div className="overflow-auto border rounded p-2 mt-2">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  {previewHeaders.map((h) => (
                    <th key={h} className="px-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, i) => (
                  <tr key={i} className="odd:bg-white/5">
                    {r.map((c, j) => (
                      <td key={j} className="px-2 py-1">{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {previewHeaders.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold">Mapeo de columnas</h3>
          <p className="text-sm text-slate-400 mb-2">Asocia cada campo del sistema a una columna del CSV.</p>
          <div className="grid grid-cols-2 gap-3">
            {TARGET_FIELDS.map((t) => (
              <div key={t} className="flex items-center gap-2">
                <label className="w-40">{t}</label>
                <select value={mapping[t] ?? ''} onChange={(e) => updateMapping(t, e.target.value || null)} className="flex-1 rounded px-2 py-1 bg-white/5">
                  <option value="">(no asignado)</option>
                  {previewHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <button onClick={handleUpload} disabled={loading || !previewHeaders.length} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">
          {loading ? 'Procesando...' : 'Subir CSV mapeado'}
        </button>
      </div>

      {result && (
        <div className="mt-6 bg-white/5 p-4 rounded">
          <h3 className="font-semibold">Resultado</h3>
          <p>Total filas: {result?.summary?.total}</p>
          <p>Creados: {result?.summary?.created}</p>
          <p>Fallidos: {result?.summary?.failed}</p>
          <details className="mt-2">
            <summary className="cursor-pointer">Errores por fila</summary>
            <div className="mt-2 text-sm">
              {result.details.errors && result.details.errors.length > 0 ? (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 text-left">Fila</th>
                      <th className="px-2 text-left">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.details.errors.map((err: any, idx: number) => (
                      <tr key={idx} className="odd:bg-white/5">
                        <td className="px-2 py-1">{err.row}</td>
                        <td className="px-2 py-1">{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm">No hay errores.</p>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

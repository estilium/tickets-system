import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

type Shift = "SHIFT_1" | "SHIFT_2";
type ItemStatus = "OK" | "NG";

type ChecklistItem = {
  id: string;
  label: string;
  description?: string | null;
  order: number;
  active: boolean;
};

type ChecklistRun = {
  id: string;
  date: string;
  shift: Shift;
  hasNg?: boolean;
  machineId: string;
  machine?: ChecklistMachine;
  agent?: { name: string; username?: string };
  responses: Array<{
    id: string;
    itemId?: string;
    status: ItemStatus;
    observation?: string | null;
    item?: ChecklistItem;
  }>;
};

type ChecklistMachine = {
  id: string;
  code: string;
  name: string;
  area?: string | null;
  category?: string | null;
  active: boolean;
  items: ChecklistItem[];
  runs?: ChecklistRun[];
};

type Report = {
  month: string;
  expected: number;
  completed: number;
  withNg: number;
  compliance: number;
  byShift: Array<{ shift: Shift; expected: number; completed: number; compliance: number }>;
  byMachine: Array<{
    machine: ChecklistMachine;
    expected: number;
    completed: number;
    withNg: number;
    compliance: number;
  }>;
  runs: ChecklistRun[];
};

const today = new Date().toISOString().slice(0, 10);
const currentMonth = new Date().toISOString().slice(0, 7);

const shiftLabel: Record<Shift, string> = {
  SHIFT_1: "Turno 1",
  SHIFT_2: "Turno 2",
};

export default function Checklist() {
  const [view, setView] = useState<"capture" | "report">("capture");
  const [date, setDate] = useState(today);
  const [shift, setShift] = useState<Shift>("SHIFT_1");
  const [machines, setMachines] = useState<ChecklistMachine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [selectedArea, setSelectedArea] = useState<string | null>(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return null;
    try {
      return JSON.parse(rawUser)?.assignedArea ?? null;
    } catch {
      return null;
    }
  });
  const [responses, setResponses] = useState<Record<string, { status?: ItemStatus; observation: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reportMonth, setReportMonth] = useState(currentMonth);
  const [report, setReport] = useState<Report | null>(null);

  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) ?? null;
  const selectedRun = selectedMachine?.runs?.find((run) => run.shift === shift) ?? null;
  const completedCount = selectedMachine
    ? selectedMachine.items.filter((item) => responses[item.id]?.status).length
    : 0;

  const currentUser = useMemo(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return null;
    try {
      return JSON.parse(rawUser);
    } catch {
      return null;
    }
  }, []);

  const assignedAreaLabel = currentUser?.assignedArea;

  const areas = useMemo(
    () => {
      const uniqueAreas = new Set(machines.map((m) => m.area).filter((a): a is string => !!a));
      return Array.from(uniqueAreas).sort() as string[];
    },
    [machines],
  );

  const filteredMachines = useMemo(
    () => selectedArea ? machines.filter((m) => m.area === selectedArea) : machines,
    [machines, selectedArea],
  );

  const sortedItems = useMemo(
    () => [...(selectedMachine?.items ?? [])].filter((item) => item.active).sort((a, b) => a.order - b.order),
    [selectedMachine],
  );

  useEffect(() => {
    loadDailyStatus();
  }, [date]);

  useEffect(() => {
    loadReport();
  }, [reportMonth]);

  useEffect(() => {
    if (!selectedMachine) {
      setResponses({});
      return;
    }

    const nextResponses: Record<string, { status?: ItemStatus; observation: string }> = {};
    selectedMachine.items
      .filter((item) => item.active)
      .forEach((item) => {
        const previous = selectedRun?.responses.find((response) => (response.item?.id ?? response.itemId) === item.id);
        nextResponses[item.id] = {
          status: previous?.status,
          observation: previous?.observation ?? "",
        };
      });
    setResponses(nextResponses);
  }, [selectedMachineId, shift, machines]);

  async function loadDailyStatus() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/checklist/daily", { params: { date } });
      setMachines(res.data);
      if (selectedMachineId && !res.data.some((machine: ChecklistMachine) => machine.id === selectedMachineId)) {
        setSelectedMachineId("");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo cargar el checklist diario");
    } finally {
      setLoading(false);
    }
  }

  async function loadReport() {
    try {
      const res = await api.get("/checklist/report", { params: { month: reportMonth } });
      setReport(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  function getMachineState(machine: ChecklistMachine) {
    const run = machine.runs?.find((item) => item.shift === shift);
    if (!run) return { label: "Pendiente", className: "bg-gray-100 text-gray-700 border-gray-200" };
    if (run.hasNg) return { label: "Con NG", className: "bg-red-100 text-red-700 border-red-200" };
    return { label: "OK", className: "bg-green-100 text-green-700 border-green-200" };
  }

  function setItemStatus(itemId: string, status: ItemStatus) {
    setResponses((current) => ({
      ...current,
      [itemId]: {
        status,
        observation: status === "OK" ? "" : current[itemId]?.observation ?? "",
      },
    }));
  }

  async function saveRun() {
    if (!selectedMachine) return;

    const missing = sortedItems.some((item) => !responses[item.id]?.status);
    if (missing) {
      setError("Responde todos los puntos antes de guardar");
      return;
    }

    const missingObservation = sortedItems.some(
      (item) => responses[item.id]?.status === "NG" && !responses[item.id]?.observation.trim(),
    );
    if (missingObservation) {
      setError("Cada NG requiere una observación");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.post("/checklist/runs", {
        machineId: selectedMachine.id,
        date,
        shift,
        responses: sortedItems.map((item) => ({
          itemId: item.id,
          status: responses[item.id].status,
          observation: responses[item.id].observation,
        })),
      });
      await loadDailyStatus();
      await loadReport();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo guardar el checklist");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Checklist diario</h2>
          <p className="text-sm text-gray-500">Captura por máquina, fecha y turno.</p>
          {assignedAreaLabel ? (
            <div className="mt-3 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700">
              Área asignada: <span className="ml-2 font-semibold">{assignedAreaLabel}</span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setView("capture")}
            className={`rounded px-4 py-3 font-semibold ${view === "capture" ? "bg-blue-600 text-white" : "bg-white text-gray-700 shadow"}`}
          >
            Captura
          </button>
          <button
            onClick={() => setView("report")}
            className={`rounded px-4 py-3 font-semibold ${view === "report" ? "bg-blue-600 text-white" : "bg-white text-gray-700 shadow"}`}
          >
            Reporte mensual
          </button>
        </div>
      </div>

      {view === "capture" ? (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 bg-white p-4 shadow md:grid-cols-[220px_1fr]">
            <label className="text-sm font-semibold text-gray-700">
              Fecha
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1 h-12 w-full rounded border px-3 text-base"
              />
            </label>
            <div>
              <p className="mb-1 text-sm font-semibold text-gray-700">Turno</p>
              <div className="grid grid-cols-2 gap-2">
                {(["SHIFT_1", "SHIFT_2"] as Shift[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => setShift(option)}
                    className={`h-12 rounded border text-base font-semibold ${shift === option ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 bg-gray-50 text-gray-700"}`}
                  >
                    {shiftLabel[option]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_1fr]">
            <div className="bg-white p-4 shadow">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Máquinas</h3>
                <span className="text-sm text-gray-500">{filteredMachines.length}</span>
              </div>
              {areas.length > 0 && (
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Filtrar por área
                  </label>
                  <select
                    value={selectedArea || ""}
                    onChange={(event) => setSelectedArea(event.target.value || null)}
                    className="w-full rounded border px-3 py-2 text-sm"
                  >
                    <option value="">Todas las áreas</option>
                    {areas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {loading ? (
                <div className="py-10 text-center text-gray-500">Cargando...</div>
              ) : filteredMachines.length === 0 ? (
                <div className="rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  {selectedArea ? "No hay máquinas en esta área." : "No hay máquinas activas para checklist."}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {filteredMachines.map((machine) => {
                    const state = getMachineState(machine);
                    return (
                      <button
                        key={machine.id}
                        onClick={() => setSelectedMachineId(machine.id)}
                        className={`min-h-20 rounded border p-3 text-left transition ${selectedMachineId === machine.id ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-gray-50"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-gray-900">{machine.code}</p>
                            <p className="text-sm text-gray-600">{machine.name}</p>
                          </div>
                          <span className={`rounded border px-2 py-1 text-xs font-bold ${state.className}`}>
                            {state.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white p-4 shadow">
              {!selectedMachine ? (
                <div className="flex min-h-80 items-center justify-center rounded border border-dashed border-gray-300 text-center text-gray-500">
                  Selecciona una máquina para iniciar.
                </div>
              ) : sortedItems.length === 0 ? (
                <div className="rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  Esta máquina no tiene puntos de revisión activos.
                </div>
              ) : (
                <>
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold">
                        {selectedMachine.code} · {selectedMachine.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Progreso {completedCount} / {sortedItems.length}
                        {selectedRun ? " · Ya existe captura para este turno" : ""}
                      </p>
                    </div>
                    <button
                      onClick={saveRun}
                      disabled={saving}
                      className="h-12 rounded bg-green-600 px-6 font-bold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {saving ? "Guardando..." : selectedRun ? "Actualizar checklist" : "Guardar checklist"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {sortedItems.map((item) => {
                      const current = responses[item.id];
                      return (
                        <div key={item.id} className="rounded border border-gray-200 p-3">
                          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px] lg:items-start">
                            <div>
                              <p className="font-semibold text-gray-900">{item.label}</p>
                              {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setItemStatus(item.id, "OK")}
                                className={`h-12 rounded border font-bold ${current?.status === "OK" ? "border-green-600 bg-green-600 text-white" : "border-gray-200 bg-gray-50 text-gray-700"}`}
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setItemStatus(item.id, "NG")}
                                className={`h-12 rounded border font-bold ${current?.status === "NG" ? "border-red-600 bg-red-600 text-white" : "border-gray-200 bg-gray-50 text-gray-700"}`}
                              >
                                NG
                              </button>
                            </div>
                          </div>
                          {current?.status === "NG" && (
                            <textarea
                              value={current.observation}
                              onChange={(event) =>
                                setResponses((value) => ({
                                  ...value,
                                  [item.id]: { ...value[item.id], observation: event.target.value },
                                }))
                              }
                              placeholder="Observación requerida"
                              className="mt-3 min-h-24 w-full rounded border p-3 text-base"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <ReportView report={report} reportMonth={reportMonth} setReportMonth={setReportMonth} />
      )}
    </div>
  );
}

function ReportView({
  report,
  reportMonth,
  setReportMonth,
}: {
  report: Report | null;
  reportMonth: string;
  setReportMonth: (value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="bg-white p-4 shadow">
        <label className="text-sm font-semibold text-gray-700">
          Mes
          <input
            type="month"
            value={reportMonth}
            onChange={(event) => setReportMonth(event.target.value)}
            className="mt-1 h-12 w-full max-w-xs rounded border px-3 text-base"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Metric label="Cumplimiento" value={`${report?.compliance ?? 0}%`} />
        <Metric label="Realizados" value={`${report?.completed ?? 0} / ${report?.expected ?? 0}`} />
        <Metric label="Con NG" value={`${report?.withNg ?? 0}`} />
        <Metric label="Máquinas" value={`${report?.byMachine.length ?? 0}`} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="bg-white p-4 shadow">
          <h3 className="mb-3 text-lg font-semibold">Cumplimiento por turno</h3>
          <div className="space-y-3">
            {report?.byShift.map((item) => (
              <ProgressRow
                key={item.shift}
                label={shiftLabel[item.shift]}
                completed={item.completed}
                expected={item.expected}
                percent={item.compliance}
              />
            ))}
          </div>
        </div>

        <div className="bg-white p-4 shadow">
          <h3 className="mb-3 text-lg font-semibold">Cumplimiento por máquina</h3>
          <div className="max-h-80 space-y-3 overflow-auto pr-2">
            {report?.byMachine.map((item) => (
              <ProgressRow
                key={item.machine.id}
                label={`${item.machine.code} · ${item.machine.name}`}
                completed={item.completed}
                expected={item.expected}
                percent={item.compliance}
                note={item.withNg ? `${item.withNg} con NG` : "Sin NG"}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-auto bg-white shadow">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Fecha</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Turno</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Máquina</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Agente</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">NG</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {report?.runs.length ? (
              report.runs.map((run) => {
                const ngResponses = run.responses.filter((response) => response.status === "NG");
                return (
                  <tr key={run.id} className="border-t">
                    <td className="px-4 py-3">{run.date.slice(0, 10)}</td>
                    <td className="px-4 py-3">{shiftLabel[run.shift]}</td>
                    <td className="px-4 py-3">{run.machine?.code} · {run.machine?.name}</td>
                    <td className="px-4 py-3">{run.agent?.name ?? "-"}</td>
                    <td className="px-4 py-3">{ngResponses.length}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {ngResponses.map((response) => `${response.item?.label ?? "Punto"}: ${response.observation}`).join(" | ") || "-"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-5 text-gray-500" colSpan={6}>No hay capturas en este mes.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4 shadow">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ProgressRow({
  label,
  completed,
  expected,
  percent,
  note,
}: {
  label: string;
  completed: number;
  expected: number;
  percent: number;
  note?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className="text-gray-500">{completed}/{expected} · {percent}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded bg-gray-100">
        <div className="h-full bg-blue-600" style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
    </div>
  );
}

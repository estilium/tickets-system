import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

type ChecklistItem = {
  id: string;
  label: string;
  description?: string | null;
  order: number;
  active: boolean;
};

type ChecklistMachine = {
  id: string;
  code: string;
  name: string;
  area?: string | null;
  category?: string | null;
  active: boolean;
  items: ChecklistItem[];
};

const emptyMachine = {
  code: "",
  name: "",
  area: "",
  category: "",
  active: true,
};

const emptyItem = {
  label: "",
  description: "",
  active: true,
};

export default function AdminChecklist() {
  const currentUser = useMemo(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return null;
    try {
      return JSON.parse(rawUser);
    } catch {
      return null;
    }
  }, []);

  const assignedArea = currentUser?.assignedArea ?? null;
  const getEmptyMachine = () => ({ ...emptyMachine, area: assignedArea ?? "" });

  const [machines, setMachines] = useState<ChecklistMachine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [machineForm, setMachineForm] = useState(getEmptyMachine);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fillInfo, setFillInfo] = useState("");
  const [fillLoading, setFillLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [draggedMachine, setDraggedMachine] = useState<ChecklistMachine | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [fillStartDate, setFillStartDate] = useState(today);
  const [fillEndDate, setFillEndDate] = useState(today);

  const visibleMachines = showInactive ? machines : machines.filter((machine) => machine.active);
  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId) ?? null;

  const areas = useMemo(
    () => {
      const uniqueAreas = new Set(machines.map((m) => m.area).filter((a): a is string => !!a));
      return Array.from(uniqueAreas).sort() as string[];
    },
    [machines],
  );

  const filteredMachines = useMemo(
    () => selectedArea ? visibleMachines.filter((m) => m.area === selectedArea) : visibleMachines,
    [visibleMachines, selectedArea],
  );

  useEffect(() => {
    loadMachines();
  }, []);

  useEffect(() => {
    if (!selectedMachineId) return;
    const selected = machines.find((machine) => machine.id === selectedMachineId);
    if (!showInactive && selected && !selected.active) {
      setSelectedMachineId(machines.find((machine) => machine.active)?.id ?? "");
    }
  }, [showInactive, machines, selectedMachineId]);

  async function loadMachines() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/checklist/machines", { params: { includeInactive: true } });
      setMachines(res.data);
      const activeMachines = res.data.filter((machine: ChecklistMachine) => machine.active);
      const nextMachines = showInactive ? res.data : activeMachines;
      if (selectedMachineId && !res.data.some((machine: ChecklistMachine) => machine.id === selectedMachineId)) {
        setSelectedMachineId("");
      } else if (!selectedMachineId && nextMachines.length) {
        setSelectedMachineId(nextMachines[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo cargar administracion de checklist");
    } finally {
      setLoading(false);
    }
  }

  async function fillHistorical() {
    setError("");
    setFillInfo("");

    if (!fillStartDate || !fillEndDate) {
      setError("Selecciona un rango de fechas");
      return;
    }

    setFillLoading(true);
    try {
      const res = await api.post("/checklist/fill-historical", {
        startDate: fillStartDate,
        endDate: fillEndDate,
      });
      setFillInfo(res.data?.message || "Histórico llenado correctamente");
      await loadMachines();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo llenar el histórico");
    } finally {
      setFillLoading(false);
    }
  }

  function editMachine(machine: ChecklistMachine) {
    setEditingMachineId(machine.id);
    setMachineForm({
      code: machine.code,
      name: machine.name,
      area: machine.area ?? "",
      category: machine.category ?? "",
      active: machine.active,
    });
  }

  async function saveMachine() {
    if (!machineForm.code.trim() || !machineForm.name.trim()) {
      setError("Codigo y nombre de maquina son obligatorios");
      return;
    }

    setError("");
    try {
      const payload = {
        ...machineForm,
        area: assignedArea ?? machineForm.area,
      };

      if (editingMachineId) {
        await api.patch(`/checklist/machines/${editingMachineId}`, payload);
      } else {
        await api.post("/checklist/machines", payload);
      }
      setMachineForm(getEmptyMachine());
      setEditingMachineId(null);
      await loadMachines();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo guardar la maquina");
    }
  }

  async function deactivateMachine(machine: ChecklistMachine) {
    const confirmed = window.confirm(
      `Desactivar maquina ${machine.code}? Si tiene historial, se conservaran sus reportes.`,
    );
    if (!confirmed) return;

    try {
      await api.delete(`/checklist/machines/${machine.id}`);
      if (selectedMachineId === machine.id) setSelectedMachineId("");
      await loadMachines();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo desactivar la maquina");
    }
  }

  async function hardDeleteMachine(machine: ChecklistMachine) {
    try {
      await api.delete(`/checklist/machines/${machine.id}/hard`);
      if (selectedMachineId === machine.id) setSelectedMachineId("");
      await loadMachines();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo eliminar definitivamente la maquina");
    }
  }

  async function duplicateMachine(machine: ChecklistMachine) {
    const code = window.prompt("Codigo de la nueva maquina", `${machine.code}-COPIA`);
    if (!code?.trim()) return;

    const name = window.prompt("Nombre de la nueva maquina", `${machine.name} copia`);
    if (name === null) return;

    setError("");
    try {
      const res = await api.post(`/checklist/machines/${machine.id}/duplicate`, {
        code: code.trim(),
        name: name.trim() || `${machine.name} copia`,
      });
      await loadMachines();
      setSelectedMachineId(res.data.id);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo duplicar la maquina");
    }
  }

  async function reorderMachines(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;

    const allMachines = showInactive ? machines : machines.filter((m) => m.active);
    const draggedIndex = allMachines.findIndex((m) => m.id === draggedId);
    const targetIndex = allMachines.findIndex((m) => m.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      console.warn("Indices not found", { draggedIndex, targetIndex });
      return;
    }

    const newOrder = [...allMachines];
    const [draggedMach] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedMach);

    const machineIds = newOrder.map((m) => m.id);
    console.log("Reordering machines:", machineIds);

    try {
      await api.post("/checklist/machines/reorder", { machineIds });
      console.log("Reorder successful");
      await loadMachines();
      setDraggedMachine(null);
    } catch (err: any) {
      console.error("Reorder error:", err);
      setError(err.response?.data?.message || "No se pudo reordenar las maquinas");
    }
  }

  function editItem(item: ChecklistItem) {
    setEditingItemId(item.id);
    setItemForm({
      label: item.label,
      description: item.description ?? "",
      active: item.active,
    });
  }

  async function saveItem() {
    if (!selectedMachine) {
      setError("Selecciona una maquina");
      return;
    }
    if (!itemForm.label.trim()) {
      setError("El punto de revision necesita nombre");
      return;
    }

    setError("");
    try {
      if (editingItemId) {
        await api.patch(`/checklist/items/${editingItemId}`, itemForm);
      } else {
        await api.post(`/checklist/machines/${selectedMachine.id}/items`, itemForm);
      }
      setItemForm(emptyItem);
      setEditingItemId(null);
      await loadMachines();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo guardar el punto");
    }
  }

  async function deactivateItem(item: ChecklistItem) {
    const confirmed = window.confirm(
      `Desactivar punto "${item.label}"? Si tiene historial, se conservaran sus reportes.`,
    );
    if (!confirmed) return;

    try {
      await api.delete(`/checklist/items/${item.id}`);
      await loadMachines();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo desactivar el punto");
    }
  }

  async function hardDeleteItem(item: ChecklistItem) {
    try {
      await api.delete(`/checklist/items/${item.id}/hard`);
      await loadMachines();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo eliminar definitivamente el punto");
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Administracion de checklist</h2>
        <p className="text-sm text-gray-500">Administra maquinas y puntos de revision.</p>
      </div>

      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="order-1 rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold">{editingMachineId ? "Editar maquina" : "Nueva maquina"}</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1 min-w-0">
                  <span className="text-sm font-medium text-gray-700">Código</span>
                  <input
                    value={machineForm.code}
                    onChange={(event) => setMachineForm((form) => ({ ...form, code: event.target.value }))}
                    placeholder="Codigo"
                    className="w-full rounded border px-3 py-2"
                  />
                </label>
                <label className="space-y-1 min-w-0">
                  <span className="text-sm font-medium text-gray-700">Nombre</span>
                  <input
                    value={machineForm.name}
                    onChange={(event) => setMachineForm((form) => ({ ...form, name: event.target.value }))}
                    placeholder="Nombre"
                    className="w-full rounded border px-3 py-2"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1 min-w-0">
                  <span className="text-sm font-medium text-gray-700">Área</span>
                  <input
                    value={machineForm.area}
                    onChange={(event) => setMachineForm((form) => ({ ...form, area: event.target.value }))}
                    placeholder="Area"
                    disabled={!!assignedArea}
                    className="w-full rounded border px-3 py-2 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                  {assignedArea && (
                    <p className="text-xs text-gray-500">Área fijada a tu área: {assignedArea}</p>
                  )}
                </label>
                <label className="space-y-1 min-w-0">
                  <span className="text-sm font-medium text-gray-700">Categoría</span>
                  <input
                    value={machineForm.category}
                    onChange={(event) => setMachineForm((form) => ({ ...form, category: event.target.value }))}
                    placeholder="Categoria"
                    className="w-full rounded border px-3 py-2"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={machineForm.active}
                  onChange={(event) => setMachineForm((form) => ({ ...form, active: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Activa
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={saveMachine} className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
                {editingMachineId ? "Guardar cambios" : "Agregar maquina"}
              </button>
              {editingMachineId && (
                <button
                  onClick={() => {
                    setEditingMachineId(null);
                    setMachineForm(getEmptyMachine());
                  }}
                  className="rounded bg-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-300"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <div className="order-3 rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Llenar checklist histórico</h3>
                <p className="text-sm text-gray-500">Genera registros OK para todas las máquinas activas entre fechas seleccionadas.</p>
              </div>
              <span className="text-sm text-gray-500">Admin</span>
            </div>
            <div className="mb-4 rounded border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm text-gray-700">
                  Desde
                  <input
                    type="date"
                    value={fillStartDate}
                    onChange={(event) => setFillStartDate(event.target.value)}
                    className="mt-1 w-full rounded border px-2 py-2"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Hasta
                  <input
                    type="date"
                    value={fillEndDate}
                    onChange={(event) => setFillEndDate(event.target.value)}
                    className="mt-1 w-full rounded border px-2 py-2"
                  />
                </label>
              </div>
              <div className="mt-4">
                <button
                  onClick={fillHistorical}
                  disabled={fillLoading}
                  className="h-12 w-full rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {fillLoading ? "Llenando..." : "Llenar checklist"}
                </button>
              </div>
            </div>
            {fillInfo && (
              <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {fillInfo}
              </div>
            )}
          </div>

          <div className="order-2 rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Maquinas</h3>
                <label className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(event) => setShowInactive(event.target.checked)}
                  />
                  Mostrar inactivas
                </label>
              </div>
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
              <p className="py-8 text-center text-gray-500">Cargando...</p>
            ) : (
              <div className="space-y-2">
                {filteredMachines.map((machine) => (
                  <div
                    key={machine.id}
                    draggable
                    onDragStart={() => setDraggedMachine(machine)}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (draggedMachine && draggedMachine.id !== machine.id) {
                        reorderMachines(draggedMachine.id, machine.id);
                      }
                      setDraggedMachine(null);
                    }}
                    onDragEnd={() => setDraggedMachine(null)}
                    className={`transition ${draggedMachine?.id === machine.id ? "opacity-40" : ""}`}
                  >
                    <button
                      onClick={() => setSelectedMachineId(machine.id)}
                      className={`w-full rounded border p-2 text-left flex items-center gap-3 cursor-grab active:cursor-grabbing ${selectedMachineId === machine.id ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-gray-50"}`}
                    >
                      <span className="flex items-center text-gray-400" title="Arrastrar">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M7 4a1 1 0 100 2 1 1 0 000-2zM7 8a1 1 0 100 2 1 1 0 000-2zM7 12a1 1 0 100 2 1 1 0 000-2zM13 4a1 1 0 100 2 1 1 0 000-2zM13 8a1 1 0 100 2 1 1 0 000-2zM13 12a1 1 0 100 2 1 1 0 000-2z" />
                        </svg>
                      </span>
                      <div className="flex-1">
                        <p className="font-bold">{machine.code}</p>
                        <p className="text-sm text-gray-600">{machine.name}</p>
                        <p className="text-xs text-gray-500">{machine.items.length} puntos</p>
                      </div>
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${machine.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                        {machine.active ? "Activa" : "Inactiva"}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            {selectedMachine ? (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-bold">{selectedMachine.code} - {selectedMachine.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedMachine.area || "Sin area"} - {selectedMachine.category || "Sin categoria"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => editMachine(selectedMachine)} className="rounded px-3 py-1.5 text-sm font-semibold text-white bg-yellow-500 hover:bg-yellow-600">
                    Editar
                  </button>
                  <button onClick={() => duplicateMachine(selectedMachine)} className="rounded px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700">
                    Duplicar
                  </button>
                  <button onClick={() => deactivateMachine(selectedMachine)} className="rounded px-3 py-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700">
                    Desactivar
                  </button>
                  <button onClick={() => hardDeleteMachine(selectedMachine)} className="rounded px-3 py-1.5 text-sm font-semibold text-white bg-red-800 hover:bg-red-900">
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Selecciona una maquina.</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold">{editingItemId ? "Editar punto" : "Nuevo punto de revision"}</h3>
            <div className="grid grid-cols-1 gap-3">
              <input
                value={itemForm.label}
                onChange={(event) => setItemForm((form) => ({ ...form, label: event.target.value }))}
                placeholder="Nombre del punto"
                className="h-11 rounded border px-3"
              />
              <textarea
                value={itemForm.description}
                onChange={(event) => setItemForm((form) => ({ ...form, description: event.target.value }))}
                placeholder="Descripcion opcional"
                className="min-h-20 rounded border p-3"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={itemForm.active}
                  onChange={(event) => setItemForm((form) => ({ ...form, active: event.target.checked }))}
                />
                Activo
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={saveItem}
                disabled={!selectedMachine}
                className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {editingItemId ? "Guardar cambios" : "Agregar punto"}
              </button>
              {editingItemId && (
                <button
                  onClick={() => {
                    setEditingItemId(null);
                    setItemForm(emptyItem);
                  }}
                  className="rounded bg-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-300"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold">Puntos de revision</h3>
            {!selectedMachine ? (
              <p className="text-sm text-gray-500">Selecciona una maquina para ver sus puntos.</p>
            ) : selectedMachine.items.length === 0 ? (
              <div className="rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                No hay puntos de revision.
              </div>
            ) : (
              <div className="space-y-2">
                {[...selectedMachine.items].sort((a, b) => a.order - b.order).map((item) => (
                  <div key={item.id} className="rounded border border-gray-200 bg-gray-50 p-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{item.label}</p>
                        {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                        <p className="text-xs text-gray-500">{item.active ? "Activo" : "Inactivo"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => editItem(item)} className="rounded px-3 py-1.5 text-sm font-semibold text-white bg-yellow-500 hover:bg-yellow-600">
                          Editar
                        </button>
                        <button onClick={() => deactivateItem(item)} className="rounded px-3 py-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700">
                          Desactivar
                        </button>
                        <button onClick={() => hardDeleteItem(item)} className="rounded px-3 py-1.5 text-sm font-semibold text-white bg-red-800 hover:bg-red-900">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

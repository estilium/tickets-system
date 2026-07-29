import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

type AssetType = "DESKTOP" | "LAPTOP" | "AIO" | "MONITOR" | "PPC" | "PDA" | "PRINTER" | "ACCESSORY" | "OTHER";
type AssetStatus = "AVAILABLE" | "ASSIGNED" | "ACTIVE" | "MAINTENANCE" | "LOST" | "DISPOSED";
type AssetCondition = "GOOD" | "FAIR" | "DAMAGED" | "UNKNOWN";
type CriteriaKey =
  | "assetTag"
  | "serialNumber"
  | "brandModel"
  | "assignedTo"
  | "department"
  | "location"
  | "ipAddress"
  | "os"
  | "ram"
  | "quantity"
  | "condition"
  | "maintenance"
  | "notes";

type InventoryAssetType = {
  id: string;
  code: string;
  name: string;
  labelPrefix: string;
  baseType: AssetType;
  description?: string | null;
  criteria: CriteriaKey[];
  active: boolean;
  order: number;
  _count?: { assets: number };
};

type InventoryBrand = {
  id: string;
  name: string;
  appliesTo: AssetType[];
  active: boolean;
  order: number;
};

type InventoryAsset = {
  id: string;
  assetTag?: string | null;
  assetTypeId?: string | null;
  assetType?: Pick<InventoryAssetType, "id" | "code" | "name" | "labelPrefix" | "criteria"> | null;
  type: AssetType;
  status: AssetStatus;
  condition: AssetCondition;
  department?: string | null;
  location?: string | null;
  assignedTo?: string | null;
  assignedEmail?: string | null;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  os?: string | null;
  ram?: string | null;
  ipAddress?: string | null;
  quantity: number;
  notes?: string | null;
  maintenanceEligible: boolean;
  updatedAt: string;
};

type AssetForm = {
  assetTag: string;
  assetTypeId: string;
  type: AssetType;
  status: AssetStatus;
  condition: AssetCondition;
  department: string;
  location: string;
  assignedTo: string;
  assignedEmail: string;
  brand: string;
  model: string;
  serialNumber: string;
  os: string;
  ram: string;
  ipAddress: string;
  quantity: number;
  notes: string;
  maintenanceEligible: boolean;
};

type TypeForm = {
  code: string;
  name: string;
  labelPrefix: string;
  baseType: AssetType;
  description: string;
  criteria: CriteriaKey[];
  active: boolean;
  order: number;
};

type BulkRow = {
  serialNumber: string;
  assignedTo: string;
  ipAddress: string;
  location: string;
  notes: string;
};

type BrandForm = {
  name: string;
  appliesTo: AssetType[];
  active: boolean;
  order: number;
};

const defaultCriteria: CriteriaKey[] = ["assetTag", "serialNumber", "brandModel", "assignedTo", "department", "condition"];

const emptyForm: AssetForm = {
  assetTag: "",
  assetTypeId: "",
  type: "OTHER",
  status: "AVAILABLE",
  condition: "GOOD",
  department: "",
  location: "",
  assignedTo: "",
  assignedEmail: "",
  brand: "",
  model: "",
  serialNumber: "",
  os: "",
  ram: "",
  ipAddress: "",
  quantity: 1,
  notes: "",
  maintenanceEligible: false,
};

const emptyTypeForm: TypeForm = {
  code: "",
  name: "",
  labelPrefix: "",
  baseType: "OTHER",
  description: "",
  criteria: defaultCriteria,
  active: true,
  order: 100,
};

const emptyBulkRow: BulkRow = {
  serialNumber: "",
  assignedTo: "",
  ipAddress: "",
  location: "",
  notes: "",
};

const emptyBrandForm: BrandForm = {
  name: "",
  appliesTo: [],
  active: true,
  order: 100,
};

const typeLabels: Record<AssetType, string> = {
  DESKTOP: "Desktop",
  LAPTOP: "Laptop",
  AIO: "All in one",
  MONITOR: "Monitor",
  PPC: "PPC",
  PDA: "PDA",
  PRINTER: "Impresora",
  ACCESSORY: "Accesorio",
  OTHER: "Otro",
};

const statusLabels: Record<AssetStatus, string> = {
  AVAILABLE: "Disponible",
  ASSIGNED: "Asignado",
  ACTIVE: "Activo",
  MAINTENANCE: "Mtto",
  LOST: "Perdido",
  DISPOSED: "Baja",
};

const conditionLabels: Record<AssetCondition, string> = {
  GOOD: "Bueno",
  FAIR: "Regular",
  DAMAGED: "Danado",
  UNKNOWN: "Sin revisar",
};

const criteriaLabels: Record<CriteriaKey, { label: string; detail: string }> = {
  assetTag: { label: "Etiqueta", detail: "Codigo interno o placa" },
  serialNumber: { label: "Serie", detail: "Serial del fabricante" },
  brandModel: { label: "Marca / modelo", detail: "Identificacion comercial" },
  assignedTo: { label: "Usuario", detail: "Responsable o resguardo" },
  department: { label: "Departamento", detail: "Area dueña del activo" },
  location: { label: "Ubicacion", detail: "Linea, oficina o almacen" },
  ipAddress: { label: "IP", detail: "Datos de red" },
  os: { label: "Sistema", detail: "Windows, Android, firmware" },
  ram: { label: "RAM", detail: "Memoria o capacidad" },
  quantity: { label: "Cantidad", detail: "Util para accesorios" },
  condition: { label: "Condicion", detail: "Bueno, regular, danado" },
  maintenance: { label: "Mantenimiento", detail: "Puede entrar a mtto" },
  notes: { label: "Notas", detail: "Observaciones libres" },
};

const managedRoles = ["ADMIN", "AGENT"];

export default function Inventory() {
  const [tab, setTab] = useState<"assets" | "types" | "brands">("assets");
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [assetTypes, setAssetTypes] = useState<InventoryAssetType[]>([]);
  const [brands, setBrands] = useState<InventoryBrand[]>([]);
  const [form, setForm] = useState<AssetForm>(emptyForm);
  const [typeForm, setTypeForm] = useState<TypeForm>(emptyTypeForm);
  const [brandForm, setBrandForm] = useState<BrandForm>(emptyBrandForm);
  const [entryMode, setEntryMode] = useState<"single" | "bulk">("single");
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [previewLabels, setPreviewLabels] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const currentUser = useMemo(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return null;
    try {
      return JSON.parse(rawUser);
    } catch {
      return null;
    }
  }, []);

  const canManage = managedRoles.includes(currentUser?.role ?? "");
  const selectedType = assetTypes.find((item) => item.id === form.assetTypeId) ?? null;
  const visibleCriteria = selectedType?.criteria?.length ? selectedType.criteria : defaultCriteria;
  const availableBrands = brands.filter((brand) => {
    if (!brand.active) return false;
    if (!selectedType) return true;
    return brand.appliesTo.length === 0 || brand.appliesTo.includes(selectedType.baseType);
  });

  const totals = useMemo(() => {
    return {
      total: assets.length,
      assigned: assets.filter((asset) => asset.status === "ASSIGNED").length,
      maintenance: assets.filter((asset) => asset.status === "MAINTENANCE" || asset.maintenanceEligible).length,
      available: assets.filter((asset) => asset.status === "AVAILABLE").length,
    };
  }, [assets]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    await Promise.all([loadTypes(), loadBrands(), loadAssets()]);
  }

  async function loadAssets(params = { search, status, type }) {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/inventory", {
        params: {
          search: params.search || undefined,
          status: params.status || undefined,
          type: params.type || undefined,
        },
      });
      setAssets(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo cargar inventario");
    } finally {
      setLoading(false);
    }
  }

  async function loadTypes() {
    const res = await api.get("/inventory/types", { params: { includeInactive: true } });
    setAssetTypes(res.data);
  }

  async function loadBrands() {
    const res = await api.get("/inventory/brands", { params: { includeInactive: true } });
    setBrands(res.data);
  }

  function updateField<K extends keyof AssetForm>(field: K, value: AssetForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateTypeField<K extends keyof TypeForm>(field: K, value: TypeForm[K]) {
    setTypeForm((current) => ({ ...current, [field]: value }));
  }

  function updateBrandField<K extends keyof BrandForm>(field: K, value: BrandForm[K]) {
    setBrandForm((current) => ({ ...current, [field]: value }));
  }

  function toggleBrandType(baseType: AssetType) {
    setBrandForm((current) => ({
      ...current,
      appliesTo: current.appliesTo.includes(baseType)
        ? current.appliesTo.filter((item) => item !== baseType)
        : [...current.appliesTo, baseType],
    }));
  }

  function updateTypeCode(value: string) {
    const code = value.toUpperCase().replace(/\s+/g, "_");
    const suggestedPrefix = code.replace(/[^A-Z0-9]/g, "").slice(0, 3);
    setTypeForm((current) => ({
      ...current,
      code,
      labelPrefix: current.labelPrefix ? current.labelPrefix : suggestedPrefix,
    }));
  }

  function selectAssetType(assetTypeId: string) {
    const nextType = assetTypes.find((item) => item.id === assetTypeId);
    setForm((current) => ({
      ...current,
      assetTypeId,
      type: nextType?.baseType ?? current.type,
      brand: nextType && current.brand && !brands.some((brand) => brand.active && brand.name === current.brand && (brand.appliesTo.length === 0 || brand.appliesTo.includes(nextType.baseType))) ? "" : current.brand,
      maintenanceEligible: nextType?.criteria?.includes("maintenance") ?? current.maintenanceEligible,
      os: nextType?.baseType === "AIO" || nextType?.baseType === "DESKTOP" || nextType?.baseType === "LAPTOP" ? current.os || "Windows 11" : current.os,
    }));
    setPreviewLabels([]);
  }

  function editAsset(asset: InventoryAsset) {
    setEditingId(asset.id);
    setForm({
      assetTag: asset.assetTag ?? "",
      assetTypeId: asset.assetTypeId ?? "",
      type: asset.type,
      status: asset.status,
      condition: asset.condition,
      department: asset.department ?? "",
      location: asset.location ?? "",
      assignedTo: asset.assignedTo ?? "",
      assignedEmail: asset.assignedEmail ?? "",
      brand: asset.brand ?? "",
      model: asset.model ?? "",
      serialNumber: asset.serialNumber ?? "",
      os: asset.os ?? "",
      ram: asset.ram ?? "",
      ipAddress: asset.ipAddress ?? "",
      quantity: asset.quantity || 1,
      notes: asset.notes ?? "",
      maintenanceEligible: asset.maintenanceEligible,
    });
    setTab("assets");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveAsset(event: React.FormEvent) {
    event.preventDefault();
    if (!canManage) return;
    if (!form.assetTypeId && !form.assetTag.trim() && !form.serialNumber.trim() && !form.model.trim()) {
      setError("Selecciona un tipo o captura etiqueta, serie o modelo");
      return;
    }

    setSaving(true);
    setError("");
    setInfo("");
    try {
      const payload = {
        ...form,
        assetTypeId: form.assetTypeId || undefined,
        quantity: Number(form.quantity) || 1,
        status: form.assignedTo.trim() && form.status === "AVAILABLE" ? "ASSIGNED" : form.status,
      };

      if (editingId) {
        await api.patch(`/inventory/${editingId}`, payload);
        setInfo("Activo actualizado");
      } else {
        await api.post("/inventory", payload);
        setInfo("Activo agregado");
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadAssets();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo guardar el activo");
    } finally {
      setSaving(false);
    }
  }

  async function loadPreviewLabels(assetTypeId: string, count: number) {
    if (!assetTypeId) {
      setPreviewLabels([]);
      return [];
    }

    const res = await api.get(`/inventory/types/${assetTypeId}/labels`, { params: { count } });
    const labels = res.data?.labels ?? [];
    setPreviewLabels(labels);
    return labels;
  }

  async function generateBulkRows() {
    const count = Math.max(1, Math.min(Number(bulkCount) || 1, 100));
    await loadPreviewLabels(form.assetTypeId, count);
    setBulkRows(Array.from({ length: count }, () => ({ ...emptyBulkRow })));
  }

  function updateBulkRow(index: number, field: keyof BulkRow, value: string) {
    setBulkRows((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  }

  async function saveBulkAssets(event: React.FormEvent) {
    event.preventDefault();
    if (!canManage) return;
    if (!form.assetTypeId) {
      setError("Selecciona un tipo de equipo");
      return;
    }
    if (bulkRows.length === 0) {
      setError("Genera los renglones antes de guardar");
      return;
    }

    setSaving(true);
    setError("");
    setInfo("");
    try {
      const assets = bulkRows.map((row) => ({
        ...form,
        assetTypeId: form.assetTypeId || undefined,
        assetTag: "",
        serialNumber: row.serialNumber,
        assignedTo: row.assignedTo || form.assignedTo,
        ipAddress: row.ipAddress || form.ipAddress,
        location: row.location || form.location,
        notes: row.notes || form.notes,
        quantity: 1,
        status: (row.assignedTo || form.assignedTo).trim() && form.status === "AVAILABLE" ? "ASSIGNED" : form.status,
      }));

      const res = await api.post("/inventory/bulk", { assets });
      setInfo(`${res.data?.created ?? assets.length} activos agregados`);
      setBulkRows([]);
      setPreviewLabels([]);
      setForm(emptyForm);
      await loadAssets();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo guardar el lote");
    } finally {
      setSaving(false);
    }
  }

  async function saveType(event: React.FormEvent) {
    event.preventDefault();
    if (!canManage) return;
    if (!typeForm.code.trim() || !typeForm.name.trim() || !typeForm.labelPrefix.trim()) {
      setError("Codigo, nombre y prefijo son obligatorios");
      return;
    }

    setSaving(true);
    setError("");
    setInfo("");
    try {
      const payload = {
        ...typeForm,
        order: editingTypeId ? Number(typeForm.order) || 100 : (assetTypes.length + 1) * 10,
      };
      if (editingTypeId) {
        await api.patch(`/inventory/types/${editingTypeId}`, payload);
        setInfo("Tipo actualizado");
      } else {
        await api.post("/inventory/types", payload);
        setInfo("Tipo agregado");
      }
      setTypeForm(emptyTypeForm);
      setEditingTypeId(null);
      await loadTypes();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo guardar el tipo");
    } finally {
      setSaving(false);
    }
  }

  async function saveBrand(event: React.FormEvent) {
    event.preventDefault();
    if (!canManage) return;
    if (!brandForm.name.trim()) {
      setError("Nombre de marca obligatorio");
      return;
    }

    setSaving(true);
    setError("");
    setInfo("");
    try {
      const payload = {
        ...brandForm,
        order: editingBrandId ? Number(brandForm.order) || 100 : (brands.length + 1) * 10,
      };
      if (editingBrandId) {
        await api.patch(`/inventory/brands/${editingBrandId}`, payload);
        setInfo("Marca actualizada");
      } else {
        await api.post("/inventory/brands", payload);
        setInfo("Marca agregada");
      }
      setBrandForm(emptyBrandForm);
      setEditingBrandId(null);
      await loadBrands();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo guardar la marca");
    } finally {
      setSaving(false);
    }
  }

  function editType(assetType: InventoryAssetType) {
    setEditingTypeId(assetType.id);
    setTypeForm({
      code: assetType.code,
      name: assetType.name,
      labelPrefix: assetType.labelPrefix,
      baseType: assetType.baseType,
      description: assetType.description ?? "",
      criteria: assetType.criteria ?? defaultCriteria,
      active: assetType.active,
      order: assetType.order,
    });
  }

  async function deactivateType(assetType: InventoryAssetType) {
    const confirmed = window.confirm(`Desactivar tipo ${assetType.name}? Los activos existentes conservaran su historial.`);
    if (!confirmed) return;
    try {
      await api.delete(`/inventory/types/${assetType.id}`);
      await loadTypes();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo desactivar el tipo");
    }
  }

  function editBrand(brand: InventoryBrand) {
    setEditingBrandId(brand.id);
    setBrandForm({
      name: brand.name,
      appliesTo: brand.appliesTo ?? [],
      active: brand.active,
      order: brand.order,
    });
  }

  async function deactivateBrand(brand: InventoryBrand) {
    const confirmed = window.confirm(`Desactivar marca ${brand.name}?`);
    if (!confirmed) return;
    try {
      await api.delete(`/inventory/brands/${brand.id}`);
      await loadBrands();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo desactivar la marca");
    }
  }

  async function disposeAsset(asset: InventoryAsset) {
    const confirmed = window.confirm(`Dar de baja ${asset.assetTag || asset.serialNumber || asset.model}?`);
    if (!confirmed) return;

    try {
      await api.delete(`/inventory/${asset.id}`);
      await loadAssets();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "No se pudo dar de baja");
    }
  }

  function clearForm() {
    setForm(emptyForm);
    setEditingId(null);
    setBulkRows([]);
    setPreviewLabels([]);
    setError("");
  }

  function clearTypeForm() {
    setTypeForm(emptyTypeForm);
    setEditingTypeId(null);
    setError("");
  }

  function clearBrandForm() {
    setBrandForm(emptyBrandForm);
    setEditingBrandId(null);
    setError("");
  }

  function toggleCriteria(criteria: CriteriaKey) {
    setTypeForm((current) => ({
      ...current,
      criteria: current.criteria.includes(criteria)
        ? current.criteria.filter((item) => item !== criteria)
        : [...current.criteria, criteria],
    }));
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Inventario IT</h2>
          <p className="text-sm text-slate-500">Activos, accesorios y criterios por tipo para capturar sin friccion.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Total" value={totals.total} />
          <Metric label="Asignados" value={totals.assigned} />
          <Metric label="Disponibles" value={totals.available} />
          <Metric label="Mtto" value={totals.maintenance} />
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <TabButton active={tab === "assets"} onClick={() => setTab("assets")}>Activos</TabButton>
        <TabButton active={tab === "types"} onClick={() => setTab("types")}>Tipos y criterios</TabButton>
        <TabButton active={tab === "brands"} onClick={() => setTab("brands")}>Marcas</TabButton>
      </div>

      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {info && <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{info}</div>}

      {tab === "assets" ? (
        <>
          <form onSubmit={entryMode === "bulk" && !editingId ? saveBulkAssets : saveAsset} className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-slate-950">{editingId ? "Editar activo" : "Alta rapida"}</h3>
              <div className="flex gap-2">
                {!editingId && (
                  <div className="flex rounded border border-slate-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setEntryMode("single")}
                      className={`h-8 rounded px-3 text-sm font-semibold ${entryMode === "single" ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-50"}`}
                    >
                      Individual
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryMode("bulk")}
                      className={`h-8 rounded px-3 text-sm font-semibold ${entryMode === "bulk" ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-50"}`}
                    >
                      Multiple
                    </button>
                  </div>
                )}
                {editingId && (
                  <button type="button" onClick={clearForm} className="h-10 rounded border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Cancelar
                  </button>
                )}
                <button type="submit" disabled={!canManage || saving} className="inline-flex h-10 items-center gap-2 rounded bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  <PlusIcon />
                  {saving ? "Guardando..." : editingId ? "Guardar" : entryMode === "bulk" ? `Guardar ${bulkRows.length || ""}` : "Agregar"}
                </button>
              </div>
            </div>

            <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
              <Field label="Tipo de equipo">
                <select value={form.assetTypeId} onChange={(e) => selectAssetType(e.target.value)} className="input">
                  <option value="">Selecciona un tipo</option>
                  {assetTypes.filter((item) => item.active).map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                {selectedType && (
                  <p className="text-xs font-semibold text-slate-500">
                    Categoria base: {typeLabels[selectedType.baseType]}
                  </p>
                )}
              </Field>
              <Field label="Estado">
                <select value={form.status} onChange={(e) => updateField("status", e.target.value as AssetStatus)} className="input">
                  {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-6">
              {visibleCriteria.includes("assetTag") && (
                <Field label="Etiqueta">
                  <div className="flex h-10 items-center rounded border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                    {selectedType ? `MXMAU-IT-${selectedType.labelPrefix}-###` : "Se genera al guardar"}
                  </div>
                </Field>
              )}
              {visibleCriteria.includes("serialNumber") && <Field label="Serie"><input value={form.serialNumber} onChange={(e) => updateField("serialNumber", e.target.value)} placeholder="S/N" className="input" /></Field>}
              {visibleCriteria.includes("brandModel") && (
                <Field label="Marca">
                  <select value={form.brand} onChange={(e) => updateField("brand", e.target.value)} className="input">
                    <option value="">Selecciona marca</option>
                    {availableBrands.map((brand) => (
                      <option key={brand.id} value={brand.name}>{brand.name}</option>
                    ))}
                  </select>
                  {selectedType && availableBrands.length === 0 && (
                    <p className="text-xs font-semibold text-slate-500">No hay marcas para {typeLabels[selectedType.baseType]}.</p>
                  )}
                </Field>
              )}
              {visibleCriteria.includes("brandModel") && <Field label="Modelo"><input value={form.model} onChange={(e) => updateField("model", e.target.value)} placeholder="ThinkCentre" className="input" /></Field>}
              {visibleCriteria.includes("department") && <Field label="Departamento"><input value={form.department} onChange={(e) => updateField("department", e.target.value)} placeholder="Quality" className="input" /></Field>}
              {visibleCriteria.includes("assignedTo") && <Field label="Usuario"><input value={form.assignedTo} onChange={(e) => updateField("assignedTo", e.target.value)} placeholder="Nombre" className="input" /></Field>}
              {visibleCriteria.includes("location") && <Field label="Ubicacion"><input value={form.location} onChange={(e) => updateField("location", e.target.value)} placeholder="Linea / oficina" className="input" /></Field>}
              {visibleCriteria.includes("ipAddress") && <Field label="IP"><input value={form.ipAddress} onChange={(e) => updateField("ipAddress", e.target.value)} placeholder="172.22..." className="input" /></Field>}
              {visibleCriteria.includes("os") && <Field label="Sistema"><input value={form.os} onChange={(e) => updateField("os", e.target.value)} placeholder="Windows 11" className="input" /></Field>}
              {visibleCriteria.includes("ram") && <Field label="RAM"><input value={form.ram} onChange={(e) => updateField("ram", e.target.value)} placeholder="16GB" className="input" /></Field>}
              {visibleCriteria.includes("quantity") && <Field label="Cantidad"><input type="number" min={1} value={form.quantity} onChange={(e) => updateField("quantity", Number(e.target.value))} className="input" /></Field>}
              {visibleCriteria.includes("condition") && (
                <Field label="Condicion">
                  <select value={form.condition} onChange={(e) => updateField("condition", e.target.value as AssetCondition)} className="input">
                    {Object.entries(conditionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </Field>
              )}
            </div>

            {visibleCriteria.includes("notes") && (
              <div className="mt-3">
                <Field label="Notas">
                  <input value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Cargador, observaciones, accesorios incluidos..." className="input" />
                </Field>
              </div>
            )}

            {visibleCriteria.includes("maintenance") && (
              <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={form.maintenanceEligible} onChange={(e) => updateField("maintenanceEligible", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                Equipo activo candidato a mantenimiento
              </label>
            )}

            {entryMode === "bulk" && !editingId && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Renglones del lote</p>
                    <p className="text-xs text-slate-500">Los datos comunes de arriba se aplican a cada renglon.</p>
                  </div>
                  <div className="flex gap-2">
                    <label className="w-28 text-sm">
                      <span className="font-semibold text-slate-700">Cantidad</span>
                      <input type="number" min={1} max={100} value={bulkCount} onChange={(e) => setBulkCount(Number(e.target.value))} className="input mt-1" />
                    </label>
                    <button type="button" onClick={generateBulkRows} className="mt-6 h-10 rounded border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      Generar
                    </button>
                  </div>
                </div>

                {bulkRows.length > 0 && (
                  <div className="overflow-x-auto rounded border border-slate-200">
                    <table className="min-w-[920px] divide-y divide-slate-100 text-sm">
                      <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
                        <tr>
                          <th className="w-12 px-3 py-2">#</th>
                          <th className="px-3 py-2">Etiqueta</th>
                          <th className="px-3 py-2">Serie</th>
                          <th className="px-3 py-2">Usuario</th>
                          <th className="px-3 py-2">IP</th>
                          <th className="px-3 py-2">Ubicacion</th>
                          <th className="px-3 py-2">Notas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulkRows.map((row, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 font-bold text-slate-500">{index + 1}</td>
                            <td className="px-3 py-2">
                              <div className="flex h-10 items-center rounded border border-slate-200 bg-slate-50 px-3 font-semibold text-slate-700">
                                {previewLabels[index] ?? "Pendiente"}
                              </div>
                            </td>
                            <td className="px-3 py-2"><input value={row.serialNumber} onChange={(e) => updateBulkRow(index, "serialNumber", e.target.value)} placeholder="S/N" className="input" /></td>
                            <td className="px-3 py-2"><input value={row.assignedTo} onChange={(e) => updateBulkRow(index, "assignedTo", e.target.value)} placeholder={form.assignedTo || "Usuario"} className="input" /></td>
                            <td className="px-3 py-2"><input value={row.ipAddress} onChange={(e) => updateBulkRow(index, "ipAddress", e.target.value)} placeholder={form.ipAddress || "172.22..."} className="input" /></td>
                            <td className="px-3 py-2"><input value={row.location} onChange={(e) => updateBulkRow(index, "location", e.target.value)} placeholder={form.location || "Ubicacion"} className="input" /></td>
                            <td className="px-3 py-2"><input value={row.notes} onChange={(e) => updateBulkRow(index, "notes", e.target.value)} placeholder={form.notes || "Notas"} className="input" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </form>

          <AssetFilters search={search} setSearch={setSearch} type={type} setType={setType} status={status} setStatus={setStatus} loadAssets={() => loadAssets()} />
          <AssetTable assets={assets} loading={loading} canManage={canManage} editAsset={editAsset} disposeAsset={disposeAsset} />
        </>
      ) : tab === "types" ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <form onSubmit={saveType} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-950">{editingTypeId ? "Editar tipo" : "Nuevo tipo"}</h3>
              {editingTypeId && <button type="button" onClick={clearTypeForm} className="rounded border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700">Cancelar</button>}
            </div>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Codigo"><input value={typeForm.code} onChange={(e) => updateTypeCode(e.target.value)} placeholder="SWITCH" className="input" /></Field>
              <Field label="Nombre"><input value={typeForm.name} onChange={(e) => updateTypeField("name", e.target.value)} placeholder="Switch de red" className="input" /></Field>
              <Field label="Prefijo etiqueta">
                <input
                  value={typeForm.labelPrefix}
                  onChange={(e) => updateTypeField("labelPrefix", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3))}
                  placeholder="AIO"
                  maxLength={3}
                  className="input"
                />
                <p className="text-xs font-semibold text-slate-500">
                  Formato: MXMAU-IT-{typeForm.labelPrefix || "XXX"}-001
                </p>
              </Field>
              <Field label="Categoria base">
                <select value={typeForm.baseType} onChange={(e) => updateTypeField("baseType", e.target.value as AssetType)} className="input">
                  {Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </Field>
              <Field label="Descripcion"><input value={typeForm.description} onChange={(e) => updateTypeField("description", e.target.value)} placeholder="Para que se usa este tipo" className="input" /></Field>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={typeForm.active} onChange={(e) => updateTypeField("active", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              Activo
            </label>
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-slate-700">Criterios a pedir</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(Object.keys(criteriaLabels) as CriteriaKey[]).map((criteria) => (
                  <label key={criteria} className="flex gap-2 rounded border border-slate-200 p-3 text-sm hover:bg-slate-50">
                    <input type="checkbox" checked={typeForm.criteria.includes(criteria)} onChange={() => toggleCriteria(criteria)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span>
                      <span className="block font-semibold text-slate-800">{criteriaLabels[criteria].label}</span>
                      <span className="block text-xs text-slate-500">{criteriaLabels[criteria].detail}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" disabled={!canManage || saving} className="mt-4 h-10 w-full rounded bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Guardando..." : editingTypeId ? "Guardar tipo" : "Agregar tipo"}
            </button>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-slate-950">Tipos configurados</h3>
            <div className="space-y-3">
              {assetTypes.map((assetType) => (
                <div key={assetType.id} className="rounded border border-slate-200 p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-bold text-slate-950">{assetType.name}</p>
                      <p className="text-xs text-slate-500">
                        {assetType.code} - {typeLabels[assetType.baseType]} - MXMAU-IT-{assetType.labelPrefix}-### - {assetType._count?.assets ?? 0} activos
                      </p>
                      {assetType.description && <p className="mt-1 text-sm text-slate-600">{assetType.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => editType(assetType)} disabled={!canManage} className="rounded border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Editar</button>
                      <button type="button" onClick={() => deactivateType(assetType)} disabled={!canManage || !assetType.active} className="rounded bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">Desactivar</button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {assetType.criteria.map((criteria) => (
                      <span key={criteria} className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{criteriaLabels[criteria]?.label ?? criteria}</span>
                    ))}
                    {!assetType.active && <span className="rounded bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">Inactivo</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <form onSubmit={saveBrand} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-950">{editingBrandId ? "Editar marca" : "Nueva marca"}</h3>
              {editingBrandId && <button type="button" onClick={clearBrandForm} className="rounded border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700">Cancelar</button>}
            </div>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Marca">
                <input value={brandForm.name} onChange={(e) => updateBrandField("name", e.target.value)} placeholder="Dell, HP, Zebra..." className="input" />
              </Field>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-slate-700">Aplica para</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(Object.keys(typeLabels) as AssetType[]).map((baseType) => (
                  <label key={baseType} className="flex items-center gap-2 rounded border border-slate-200 p-2 text-sm hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={brandForm.appliesTo.includes(baseType)}
                      onChange={() => toggleBrandType(baseType)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-700">{typeLabels[baseType]}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">Si no seleccionas ninguna, la marca aparece para todas las categorias.</p>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={brandForm.active} onChange={(e) => updateBrandField("active", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              Activa
            </label>
            <button type="submit" disabled={!canManage || saving} className="mt-4 h-10 w-full rounded bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Guardando..." : editingBrandId ? "Guardar marca" : "Agregar marca"}
            </button>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-slate-950">Marcas configuradas</h3>
            <div className="space-y-2">
              {brands.map((brand) => (
                <div key={brand.id} className="flex flex-col gap-3 rounded border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-950">{brand.name}</p>
                    <p className="text-xs text-slate-500">{brand.active ? "Activa" : "Inactiva"}</p>
                    <p className="text-xs text-slate-500">
                      {brand.appliesTo.length ? brand.appliesTo.map((item) => typeLabels[item]).join(", ") : "Todas las categorias"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => editBrand(brand)} disabled={!canManage} className="rounded border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Editar</button>
                    <button type="button" onClick={() => deactivateBrand(brand)} disabled={!canManage || !brand.active} className="rounded bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">Desactivar</button>
                  </div>
                </div>
              ))}
              {brands.length === 0 && <p className="rounded border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Sin marcas configuradas.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssetFilters({ search, setSearch, type, setType, status, setStatus, loadAssets }: {
  search: string;
  setSearch: (value: string) => void;
  type: string;
  setType: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  loadAssets: () => void;
}) {
  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><SearchIcon /></span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por serie, usuario, IP, marca..." className="h-11 w-full rounded border border-slate-200 pl-10 pr-3 text-sm" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="h-11 rounded border border-slate-200 px-3 text-sm">
          <option value="">Todas las categorias</option>
          {Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded border border-slate-200 px-3 text-sm">
          <option value="">Todos los estados</option>
          {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <button type="button" onClick={loadAssets} className="h-11 rounded bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">Filtrar</button>
      </div>
    </div>
  );
}

function AssetTable({ assets, loading, canManage, editAsset, disposeAsset }: {
  assets: InventoryAsset[];
  loading: boolean;
  canManage: boolean;
  editAsset: (asset: InventoryAsset) => void;
  disposeAsset: (asset: InventoryAsset) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {loading ? (
        <p className="p-8 text-center text-slate-500">Cargando...</p>
      ) : assets.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">Sin activos con esos filtros.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Activo</th>
                <th className="px-4 py-3">Asignacion</th>
                <th className="px-4 py-3">Equipo</th>
                <th className="px-4 py-3">Red</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-950">{asset.assetTag || asset.serialNumber || "Sin etiqueta"}</p>
                    <p className="text-xs text-slate-500">{asset.assetType?.name || typeLabels[asset.type]} - Cant. {asset.quantity}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{asset.assignedTo || "Sin asignar"}</p>
                    <p className="text-xs text-slate-500">{asset.department || asset.location || "Sin area"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800">{[asset.brand, asset.model].filter(Boolean).join(" ") || "Sin modelo"}</p>
                    <p className="text-xs text-slate-500">{asset.serialNumber || "Sin serie"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800">{asset.ipAddress || "-"}</p>
                    <p className="text-xs text-slate-500">{[asset.os, asset.ram].filter(Boolean).join(" / ") || "-"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs font-bold ${statusClass(asset.status)}`}>{statusLabels[asset.status]}</span>
                    {asset.maintenanceEligible && <p className="mt-1 text-xs font-semibold text-blue-700">Candidato mtto</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => editAsset(asset)} disabled={!canManage} className="rounded border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Editar</button>
                      <button type="button" onClick={() => disposeAsset(asset)} disabled={!canManage || asset.status === "DISPOSED"} className="rounded bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50">Baja</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="min-w-0 space-y-1 text-sm">
      <span className="font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`h-10 rounded px-4 text-sm font-semibold transition ${active ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
      {children}
    </button>
  );
}

function statusClass(status: AssetStatus) {
  if (status === "ASSIGNED" || status === "ACTIVE") return "bg-green-100 text-green-700";
  if (status === "AVAILABLE") return "bg-blue-100 text-blue-700";
  if (status === "MAINTENANCE") return "bg-yellow-100 text-yellow-800";
  if (status === "DISPOSED") return "bg-slate-200 text-slate-600";
  return "bg-red-100 text-red-700";
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />
    </svg>
  );
}

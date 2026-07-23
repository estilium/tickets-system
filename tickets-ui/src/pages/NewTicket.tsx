import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { ticketLocations } from "../constants/ticketLocations";
import { useLanguage } from "../i18n";
import { getCatalogName } from "../utils/catalogTranslations";

type DateTimeParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
};

const now = new Date();
const defaultDateTimeParts: DateTimeParts = {
  year: String(now.getFullYear()),
  month: String(now.getMonth() + 1).padStart(2, "0"),
  day: String(now.getDate()).padStart(2, "0"),
  hour: String(now.getHours()).padStart(2, "0"),
  minute: String(now.getMinutes()).padStart(2, "0"),
};

const years = Array.from({ length: 8 }, (_, index) => String(now.getFullYear() - index));
const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

function getDays(year: string, month: string) {
  const numericYear = Number(year || now.getFullYear());
  const numericMonth = Number(month || 1);
  const daysInMonth = new Date(numericYear, numericMonth, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => String(index + 1).padStart(2, "0"));
}

function toIsoDate(parts: DateTimeParts) {
  if (!parts.year || !parts.month || !parts.day || !parts.hour || !parts.minute) return null;
  return new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00`).toISOString();
}

function addMinutesToIsoDate(isoDate: string, minutesToAdd: number) {
  const date = new Date(isoDate);
  date.setMinutes(date.getMinutes() + minutesToAdd);
  return date.toISOString();
}

export default function NewTicket() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ticketLocation, setTicketLocation] = useState("");
  const [availableLocations, setAvailableLocations] = useState(ticketLocations);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [createdAtParts, setCreatedAtParts] = useState<DateTimeParts>(defaultDateTimeParts);
  const [closeMinutes, setCloseMinutes] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [initialComment, setInitialComment] = useState("");
  const [loading, setLoading] = useState(false);

  const rawUser = localStorage.getItem("user");
  const currentUser = rawUser ? JSON.parse(rawUser) : null;

  useEffect(() => {
    api.get("/categories").then((res) => {
      setCategories(res.data?.data ?? res.data ?? []);
    });

    api
      .get("/locations")
      .then((res) => {
        const locations = (res.data?.data ?? res.data ?? []).map((location: any) => ({
          value: location.name,
          label: getCatalogName(location, language),
        }));
        if (locations.length > 0) {
          setAvailableLocations(locations);
        }
      })
      .catch((err) => {
        console.error("Error loading locations:", err);
      });
  }, [language]);

  async function createTicket(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title || !description || !ticketLocation || !categoryId) {
      alert("Please complete all required fields");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("ticketLocation", ticketLocation);
      formData.append("categoryId", categoryId);
      if (attachment) {
        formData.append("files", attachment);
      }
      if (initialComment.trim()) {
        formData.append("initialComment", initialComment.trim());
      }

      if (currentUser?.role === "ADMIN") {
        const createdAt = toIsoDate(createdAtParts);
        if (createdAt) formData.append("createdAt", createdAt);
        if (createdAt && closeMinutes.trim()) {
          const parsedCloseMinutes = Number(closeMinutes);
          if (!Number.isFinite(parsedCloseMinutes) || parsedCloseMinutes < 0) {
            alert("Ingresa un tiempo de cierre valido en minutos");
            setLoading(false);
            return;
          }
          formData.append("closedAt", addMinutesToIsoDate(createdAt, parsedCloseMinutes));
        }
      }

      await api.post("/tickets", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/tickets");
    } catch (err) {
      console.error(err);
      alert("Error creating ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <button
        type="button"
        onClick={() => navigate("/tickets")}
        className="mb-4 text-blue-600 hover:underline"
      >
        {t("ticketHistory.back")}
      </button>

      <h1 className="mb-6 text-2xl font-bold">{t("ticketHistory.title")}</h1>

      <form onSubmit={createTicket} className="space-y-4">
        <input
          placeholder={t("ticketHistory.ticketTitle")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border p-2"
        />

        <textarea
          placeholder={t("ticketHistory.description")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-32 w-full rounded border p-2"
        />

        <select
          value={ticketLocation}
          onChange={(e) => setTicketLocation(e.target.value)}
          className="w-full rounded border p-2"
        >
          <option value="">{t("ticketHistory.location")}</option>
          {availableLocations.map((location) => (
            <option key={location.value} value={location.value}>
              {location.label}
            </option>
          ))}
        </select>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded border p-2"
        >
          <option value="">{t("ticketHistory.category")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {getCatalogName(category, language)}
            </option>
          ))}
        </select>

        <div>
          <label className="block text-sm font-medium">{t("ticketHistory.image")}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
            className="mt-1 w-full rounded border p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">{t("ticketHistory.initialComment")}</label>
          <textarea
            value={initialComment}
            onChange={(e) => setInitialComment(e.target.value)}
            placeholder={t("ticketHistory.initialCommentPlaceholder")}
            className="mt-1 h-24 w-full rounded border p-2"
          />
        </div>

        {currentUser?.role === "ADMIN" && (
          <div className="space-y-4">
            <DateTimeSelect label={t("ticketHistory.createdAt")} value={createdAtParts} onChange={setCreatedAtParts} />
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <label className="text-sm font-semibold text-slate-800">{t("ticketHistory.close")}</label>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={closeMinutes}
                  onChange={(e) => setCloseMinutes(e.target.value)}
                  placeholder={t("ticketHistory.closePlaceholder")}
                  className="w-full rounded border p-2 sm:max-w-40"
                />
                <span className="text-sm text-slate-600">{t("ticketHistory.closeMinutes")}</span>
              </div>
            </div>
          </div>
        )}

        <button className="rounded bg-blue-600 px-4 py-2 text-white">
          {loading ? t("ticketHistory.creating") : t("ticketHistory.create")}
        </button>
      </form>
    </div>
  );
}

function DateTimeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DateTimeParts;
  onChange: (value: DateTimeParts) => void;
}) {
  const dayOptions = getDays(value.year, value.month);

  function update(field: keyof DateTimeParts, nextValue: string) {
    const next = { ...value, [field]: nextValue };
    if ((field === "year" || field === "month") && next.day) {
      const validDays = getDays(next.year, next.month);
      if (!validDays.includes(next.day)) {
        next.day = validDays[validDays.length - 1];
      }
    }
    onChange(next);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-800">{label}</label>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <select value={value.year} onChange={(e) => update("year", e.target.value)} className="w-full rounded border p-2">
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select value={value.month} onChange={(e) => update("month", e.target.value)} className="w-full rounded border p-2">
          {months.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        <select value={value.day} onChange={(e) => update("day", e.target.value)} className="w-full rounded border p-2">
          {dayOptions.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>

        <select value={value.hour} onChange={(e) => update("hour", e.target.value)} className="w-full rounded border p-2">
          {hours.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>

        <select value={value.minute} onChange={(e) => update("minute", e.target.value)} className="w-full rounded border p-2">
          {minutes.map((minute) => (
            <option key={minute} value={minute}>
              {minute}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

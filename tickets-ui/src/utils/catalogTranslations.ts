import type { Language } from "../i18n";

type TranslatableCatalog = {
  name?: string | null;
  nameEn?: string | null;
  nameKr?: string | null;
};

export function getCatalogName(item: TranslatableCatalog | null | undefined, language: Language) {
  if (!item) return "-";
  if (language === "en" && item.nameEn?.trim()) return item.nameEn;
  if (language === "kr" && item.nameKr?.trim()) return item.nameKr;
  return item.name || "-";
}

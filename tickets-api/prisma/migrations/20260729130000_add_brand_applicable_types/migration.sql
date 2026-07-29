-- AlterTable
ALTER TABLE "InventoryBrand" ADD COLUMN "appliesTo" JSONB NOT NULL DEFAULT '[]';

-- Existing starter brands are known to apply to current spreadsheet categories.
UPDATE "InventoryBrand"
SET "appliesTo" = CASE
  WHEN "name" = 'Lenovo' THEN '["DESKTOP","LAPTOP","AIO","MONITOR"]'::jsonb
  WHEN "name" = 'ADVANTECH' THEN '["PPC"]'::jsonb
  WHEN "name" = 'SYMBOL' THEN '["PDA"]'::jsonb
  ELSE '[]'::jsonb
END;

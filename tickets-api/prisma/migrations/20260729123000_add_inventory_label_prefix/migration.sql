-- AlterTable
ALTER TABLE "InventoryAssetType" ADD COLUMN "labelPrefix" TEXT;

-- Backfill label prefixes for existing configured types.
UPDATE "InventoryAssetType"
SET "labelPrefix" = CASE
  WHEN "code" = 'AIO' THEN 'AIO'
  WHEN "code" = 'PPC' THEN 'PPC'
  WHEN "code" = 'PDA' THEN 'PDA'
  WHEN "code" = 'MONITOR' THEN 'MON'
  WHEN "code" = 'ACCESSORY' THEN 'ACC'
  ELSE SUBSTRING(REGEXP_REPLACE(UPPER("code"), '[^A-Z0-9]', '', 'g') FROM 1 FOR 3)
END;

-- Guarantee a value even for unusual old rows.
UPDATE "InventoryAssetType"
SET "labelPrefix" = 'OTR'
WHERE "labelPrefix" IS NULL OR "labelPrefix" = '';

-- AlterTable
ALTER TABLE "InventoryAssetType" ALTER COLUMN "labelPrefix" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "InventoryAssetType_labelPrefix_key" ON "InventoryAssetType"("labelPrefix");

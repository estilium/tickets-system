-- CreateTable
CREATE TABLE "InventoryBaseCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legacyType" "AssetType" NOT NULL DEFAULT 'OTHER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryBaseCategory_pkey" PRIMARY KEY ("id")
);

-- Seed current base categories.
INSERT INTO "InventoryBaseCategory" ("id", "code", "name", "legacyType", "order", "updatedAt")
VALUES
  ('invcat-desktop', 'DESKTOP', 'Desktop', 'DESKTOP', 10, CURRENT_TIMESTAMP),
  ('invcat-laptop', 'LAPTOP', 'Laptop', 'LAPTOP', 20, CURRENT_TIMESTAMP),
  ('invcat-aio', 'AIO', 'All in one', 'AIO', 30, CURRENT_TIMESTAMP),
  ('invcat-monitor', 'MONITOR', 'Monitor', 'MONITOR', 40, CURRENT_TIMESTAMP),
  ('invcat-ppc', 'PPC', 'PPC', 'PPC', 50, CURRENT_TIMESTAMP),
  ('invcat-pda', 'PDA', 'PDA', 'PDA', 60, CURRENT_TIMESTAMP),
  ('invcat-printer', 'PRINTER', 'Impresora', 'PRINTER', 70, CURRENT_TIMESTAMP),
  ('invcat-accessory', 'ACCESSORY', 'Accesorio', 'ACCESSORY', 80, CURRENT_TIMESTAMP),
  ('invcat-other', 'OTHER', 'Otro', 'OTHER', 999, CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "InventoryAssetType" ADD COLUMN "baseCategoryId" TEXT;

-- Backfill existing asset type categories from their legacy base type.
UPDATE "InventoryAssetType"
SET "baseCategoryId" = CASE
  WHEN "baseType" = 'DESKTOP' THEN 'invcat-desktop'
  WHEN "baseType" = 'LAPTOP' THEN 'invcat-laptop'
  WHEN "baseType" = 'AIO' THEN 'invcat-aio'
  WHEN "baseType" = 'MONITOR' THEN 'invcat-monitor'
  WHEN "baseType" = 'PPC' THEN 'invcat-ppc'
  WHEN "baseType" = 'PDA' THEN 'invcat-pda'
  WHEN "baseType" = 'PRINTER' THEN 'invcat-printer'
  WHEN "baseType" = 'ACCESSORY' THEN 'invcat-accessory'
  ELSE 'invcat-other'
END;

-- CreateIndex
CREATE UNIQUE INDEX "InventoryBaseCategory_code_key" ON "InventoryBaseCategory"("code");

-- CreateIndex
CREATE INDEX "InventoryBaseCategory_active_idx" ON "InventoryBaseCategory"("active");

-- CreateIndex
CREATE INDEX "InventoryBaseCategory_order_idx" ON "InventoryBaseCategory"("order");

-- CreateIndex
CREATE INDEX "InventoryAssetType_baseCategoryId_idx" ON "InventoryAssetType"("baseCategoryId");

-- AddForeignKey
ALTER TABLE "InventoryAssetType" ADD CONSTRAINT "InventoryAssetType_baseCategoryId_fkey" FOREIGN KEY ("baseCategoryId") REFERENCES "InventoryBaseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

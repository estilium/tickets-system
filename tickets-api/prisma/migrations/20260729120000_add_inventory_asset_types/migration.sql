-- CreateTable
CREATE TABLE "InventoryAssetType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseType" "AssetType" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "criteria" JSONB NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryAssetType_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "InventoryAsset" ADD COLUMN "assetTypeId" TEXT,
ADD COLUMN "customFields" JSONB NOT NULL DEFAULT '{}';

-- Seed useful starter types
INSERT INTO "InventoryAssetType" ("id", "code", "name", "baseType", "description", "criteria", "order", "updatedAt")
VALUES
  ('invtype-aio', 'AIO', 'All in one', 'AIO', 'Equipo de usuario con Windows', '["assetTag","serialNumber","brandModel","assignedTo","department","ipAddress","os","ram","maintenance"]', 10, CURRENT_TIMESTAMP),
  ('invtype-ppc', 'PPC', 'Panel PC / PPC', 'PPC', 'Equipo activo en linea de produccion', '["serialNumber","brandModel","department","location","ipAddress","maintenance","notes"]', 20, CURRENT_TIMESTAMP),
  ('invtype-pda', 'PDA', 'PDA / Handheld', 'PDA', 'Terminal movil para almacen o embarques', '["serialNumber","brandModel","department","assignedTo","condition","notes"]', 30, CURRENT_TIMESTAMP),
  ('invtype-monitor', 'MONITOR', 'Monitor', 'MONITOR', 'Pantalla asignable o de reemplazo', '["assetTag","serialNumber","brandModel","assignedTo","department","condition"]', 40, CURRENT_TIMESTAMP),
  ('invtype-accessory', 'ACCESSORY', 'Accesorio', 'ACCESSORY', 'Cargadores, mouse, teclados, cables y adaptadores', '["assetTag","brandModel","assignedTo","department","quantity","condition","notes"]', 50, CURRENT_TIMESTAMP);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryAssetType_code_key" ON "InventoryAssetType"("code");

-- CreateIndex
CREATE INDEX "InventoryAssetType_active_idx" ON "InventoryAssetType"("active");

-- CreateIndex
CREATE INDEX "InventoryAssetType_baseType_idx" ON "InventoryAssetType"("baseType");

-- CreateIndex
CREATE INDEX "InventoryAssetType_order_idx" ON "InventoryAssetType"("order");

-- CreateIndex
CREATE INDEX "InventoryAsset_assetTypeId_idx" ON "InventoryAsset"("assetTypeId");

-- AddForeignKey
ALTER TABLE "InventoryAsset" ADD CONSTRAINT "InventoryAsset_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "InventoryAssetType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

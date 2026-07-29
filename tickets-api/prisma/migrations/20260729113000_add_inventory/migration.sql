-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('DESKTOP', 'LAPTOP', 'AIO', 'MONITOR', 'PPC', 'PDA', 'PRINTER', 'ACCESSORY', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'ACTIVE', 'MAINTENANCE', 'LOST', 'DISPOSED');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('GOOD', 'FAIR', 'DAMAGED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "InventoryAsset" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT,
    "type" "AssetType" NOT NULL DEFAULT 'OTHER',
    "status" "AssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    "condition" "AssetCondition" NOT NULL DEFAULT 'UNKNOWN',
    "department" TEXT,
    "location" TEXT,
    "assignedTo" TEXT,
    "assignedEmail" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "os" TEXT,
    "ram" TEXT,
    "ipAddress" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "maintenanceEligible" BOOLEAN NOT NULL DEFAULT false,
    "checklistMachineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryEvent" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryAsset_assetTag_key" ON "InventoryAsset"("assetTag");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryAsset_serialNumber_key" ON "InventoryAsset"("serialNumber");

-- CreateIndex
CREATE INDEX "InventoryAsset_type_idx" ON "InventoryAsset"("type");

-- CreateIndex
CREATE INDEX "InventoryAsset_status_idx" ON "InventoryAsset"("status");

-- CreateIndex
CREATE INDEX "InventoryAsset_department_idx" ON "InventoryAsset"("department");

-- CreateIndex
CREATE INDEX "InventoryAsset_assignedTo_idx" ON "InventoryAsset"("assignedTo");

-- CreateIndex
CREATE INDEX "InventoryAsset_checklistMachineId_idx" ON "InventoryAsset"("checklistMachineId");

-- CreateIndex
CREATE INDEX "InventoryEvent_assetId_idx" ON "InventoryEvent"("assetId");

-- CreateIndex
CREATE INDEX "InventoryEvent_actorId_idx" ON "InventoryEvent"("actorId");

-- CreateIndex
CREATE INDEX "InventoryEvent_createdAt_idx" ON "InventoryEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "InventoryAsset" ADD CONSTRAINT "InventoryAsset_checklistMachineId_fkey" FOREIGN KEY ("checklistMachineId") REFERENCES "ChecklistMachine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryEvent" ADD CONSTRAINT "InventoryEvent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "InventoryAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryEvent" ADD CONSTRAINT "InventoryEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

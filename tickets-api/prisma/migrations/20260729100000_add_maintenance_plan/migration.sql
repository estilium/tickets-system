CREATE TYPE "MaintenanceStatus" AS ENUM ('OK', 'NG');

ALTER TABLE "ChecklistMachine"
ADD COLUMN "maintenanceEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "maintenanceFrequencyMonths" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN "maintenanceStartMonth" INTEGER,
ADD COLUMN "maintenanceType" TEXT DEFAULT 'Preventivo';

CREATE TABLE "MaintenanceRun" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "MaintenanceStatus" NOT NULL,
    "observation" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MaintenanceRun_machineId_year_month_key" ON "MaintenanceRun"("machineId", "year", "month");
CREATE INDEX "MaintenanceRun_year_month_idx" ON "MaintenanceRun"("year", "month");
CREATE INDEX "MaintenanceRun_agentId_idx" ON "MaintenanceRun"("agentId");

ALTER TABLE "MaintenanceRun" ADD CONSTRAINT "MaintenanceRun_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "ChecklistMachine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRun" ADD CONSTRAINT "MaintenanceRun_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

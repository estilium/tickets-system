CREATE TYPE "ChecklistShift" AS ENUM ('SHIFT_1', 'SHIFT_2');

CREATE TYPE "ChecklistItemStatus" AS ENUM ('OK', 'NG');

CREATE TABLE "ChecklistMachine" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT,
    "category" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistMachine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChecklistRun" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shift" "ChecklistShift" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChecklistResponse" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "status" "ChecklistItemStatus" NOT NULL,
    "observation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistResponse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChecklistMachine_code_key" ON "ChecklistMachine"("code");
CREATE INDEX "ChecklistItem_machineId_idx" ON "ChecklistItem"("machineId");
CREATE INDEX "ChecklistRun_date_idx" ON "ChecklistRun"("date");
CREATE INDEX "ChecklistRun_agentId_idx" ON "ChecklistRun"("agentId");
CREATE UNIQUE INDEX "ChecklistRun_machineId_date_shift_key" ON "ChecklistRun"("machineId", "date", "shift");
CREATE INDEX "ChecklistResponse_itemId_idx" ON "ChecklistResponse"("itemId");
CREATE UNIQUE INDEX "ChecklistResponse_runId_itemId_key" ON "ChecklistResponse"("runId", "itemId");

ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "ChecklistMachine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChecklistRun" ADD CONSTRAINT "ChecklistRun_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "ChecklistMachine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChecklistRun" ADD CONSTRAINT "ChecklistRun_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChecklistResponse" ADD CONSTRAINT "ChecklistResponse_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ChecklistRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChecklistResponse" ADD CONSTRAINT "ChecklistResponse_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

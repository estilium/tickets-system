-- CreateTable
CREATE TABLE "MonthlyMttrRecord" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "totalClosed" INTEGER NOT NULL,
    "mttrMinutesAvg" DOUBLE PRECISION NOT NULL,
    "mttrMinutesMin" DOUBLE PRECISION NOT NULL,
    "mttrMinutesMax" DOUBLE PRECISION NOT NULL,
    "from" TIMESTAMP(3) NOT NULL,
    "to" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyMttrRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyMttrRecord_year_month_key" ON "MonthlyMttrRecord"("year", "month");

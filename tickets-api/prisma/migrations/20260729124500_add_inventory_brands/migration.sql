-- CreateTable
CREATE TABLE "InventoryBrand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryBrand_pkey" PRIMARY KEY ("id")
);

-- Seed common inventory brands from current spreadsheets.
INSERT INTO "InventoryBrand" ("id", "name", "order", "updatedAt")
VALUES
  ('invbrand-lenovo', 'Lenovo', 10, CURRENT_TIMESTAMP),
  ('invbrand-advantech', 'ADVANTECH', 20, CURRENT_TIMESTAMP),
  ('invbrand-symbol', 'SYMBOL', 30, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE UNIQUE INDEX "InventoryBrand_name_key" ON "InventoryBrand"("name");

-- CreateIndex
CREATE INDEX "InventoryBrand_active_idx" ON "InventoryBrand"("active");

-- CreateIndex
CREATE INDEX "InventoryBrand_order_idx" ON "InventoryBrand"("order");

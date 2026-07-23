-- CreateTable
CREATE TABLE "TicketLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TicketLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketLocation_name_key" ON "TicketLocation"("name");

-- Seed existing locations
INSERT INTO "TicketLocation" ("id", "name", "order")
VALUES
  ('loc-oficina-general', 'Oficina General', 0),
  ('loc-oficina-inyeccion', 'Oficina Inyección', 1),
  ('loc-oficina-pintura', 'Oficina Pintura', 2),
  ('loc-pintura', 'Pintura', 3),
  ('loc-inyeccion', 'Inyección', 4),
  ('loc-embarques', 'Embarques', 5),
  ('loc-almacen', 'almacen', 6),
  ('loc-moldes', 'moldes', 7),
  ('loc-hr', 'HR', 8),
  ('loc-enfermeria', 'Enfermería', 9),
  ('loc-ensamble', 'Ensamble', 10)
ON CONFLICT ("name") DO NOTHING;

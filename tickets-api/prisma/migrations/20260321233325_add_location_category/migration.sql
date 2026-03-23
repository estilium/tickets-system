-- CreateEnum
CREATE TYPE "Location" AS ENUM ('OFICINA_GRAL', 'PINTURA', 'INYECCION', 'EMBARQUES', 'ALMACEN', 'HR', 'ENFERMERIA', 'MOLDES');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "Location" TEXT,
ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

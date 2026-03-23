/*
  Warnings:

  - You are about to drop the column `Location` on the `Ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "Location",
ADD COLUMN     "location" TEXT;

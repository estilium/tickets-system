/*
  Warnings:

  - You are about to drop the column `location` on the `Ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "location",
ADD COLUMN     "ticketLocation" TEXT;

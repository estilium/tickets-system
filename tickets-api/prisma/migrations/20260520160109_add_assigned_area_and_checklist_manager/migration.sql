-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CHECKLIST_MANAGER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "assignedArea" TEXT;

-- AlterTable
ALTER TABLE "dmm_machine_shifts" ADD COLUMN     "createdAt" TIMESTAMP(3),
ADD COLUMN     "createdBy" VARCHAR(36);

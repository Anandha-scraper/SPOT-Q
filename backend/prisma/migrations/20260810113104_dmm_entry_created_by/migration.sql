-- Gives DmmParameterEntry the ownership columns its report page's edit needs.
-- `updatedAt` is NOT NULL and the table may be non-empty, so the column is added
-- WITH a default to backfill existing rows and the default is dropped straight
-- afterwards — leaving no drift against the schema, which declares none.
-- Prisma's @updatedAt writes the column explicitly on every create and update.

-- AlterTable
ALTER TABLE "dmm_parameter_entries" ADD COLUMN     "createdBy" VARCHAR(36),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "dmm_parameter_entries" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Same cleanup for the cupola column added on 2026-08-10, whose backfill
-- default was left in place and now shows as drift.
-- AlterTable
ALTER TABLE "cupola_log_entries" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "dmm_parameter_entries" ADD CONSTRAINT "dmm_parameter_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

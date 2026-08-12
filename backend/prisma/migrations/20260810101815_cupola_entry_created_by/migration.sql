-- Gives CupolaLogEntry the ownership columns its report page's edit/delete needs.
-- `updatedAt` is NOT NULL and the table is non-empty, so Prisma's generated
-- `ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL` cannot run. The DEFAULT below
-- backfills existing rows with the migration time; Prisma's @updatedAt writes
-- the column explicitly on every update, so the default is only ever used here.
-- Pre-existing rows keep a null createdBy and stay admin-editable.

-- AlterTable
ALTER TABLE "cupola_log_entries" ADD COLUMN     "createdBy" VARCHAR(36),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "cupola_log_entries" ADD CONSTRAINT "cupola_log_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

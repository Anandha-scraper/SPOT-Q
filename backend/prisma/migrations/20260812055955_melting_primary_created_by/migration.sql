-- AlterTable
ALTER TABLE "melting_log_primaries" ADD COLUMN     "createdBy" VARCHAR(36);

-- AddForeignKey
ALTER TABLE "melting_log_primaries" ADD CONSTRAINT "melting_log_primaries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "return_sand_note_entries" ADD COLUMN     "createdBy" VARCHAR(36);

-- AlterTable
ALTER TABLE "sand_note_entries" ADD COLUMN     "createdBy" VARCHAR(36);

-- AlterTable
ALTER TABLE "sand_record_days" ADD COLUMN     "createdBy" VARCHAR(36);

-- AddForeignKey
ALTER TABLE "sand_note_entries" ADD CONSTRAINT "sand_note_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_sand_note_entries" ADD CONSTRAINT "return_sand_note_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sand_record_days" ADD CONSTRAINT "sand_record_days_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

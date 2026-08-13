-- AlterTable
ALTER TABLE "disa_delay_entries" ADD COLUMN     "createdBy" VARCHAR(36);

-- AlterTable
ALTER TABLE "disa_mould_hardness_entries" ADD COLUMN     "createdBy" VARCHAR(36);

-- AlterTable
ALTER TABLE "disa_next_shift_plan_entries" ADD COLUMN     "createdBy" VARCHAR(36);

-- AlterTable
ALTER TABLE "disa_pattern_temp_entries" ADD COLUMN     "createdBy" VARCHAR(36);

-- AlterTable
ALTER TABLE "disa_production_entries" ADD COLUMN     "createdBy" VARCHAR(36);

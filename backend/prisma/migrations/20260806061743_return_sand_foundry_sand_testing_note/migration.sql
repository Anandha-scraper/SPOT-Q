-- CreateTable
CREATE TABLE "return_sand_note_days" (
    "id" VARCHAR(36) NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_sand_note_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_sand_note_entries" (
    "id" VARCHAR(36) NOT NULL,
    "dayId" VARCHAR(36) NOT NULL,
    "shift" VARCHAR(16) NOT NULL,
    "plant" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_sand_note_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_sand_note_fields" (
    "id" VARCHAR(36) NOT NULL,
    "entryId" VARCHAR(36) NOT NULL,
    "section" VARCHAR(20) NOT NULL,
    "testNo" INTEGER NOT NULL,
    "fieldPath" VARCHAR(40) NOT NULL,
    "value" VARCHAR(64) NOT NULL,

    CONSTRAINT "return_sand_note_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "return_sand_note_days_date_key" ON "return_sand_note_days"("date");

-- CreateIndex
CREATE UNIQUE INDEX "return_sand_note_entries_dayId_shift_plant_key" ON "return_sand_note_entries"("dayId", "shift", "plant");

-- CreateIndex
CREATE UNIQUE INDEX "return_sand_note_fields_entryId_section_testNo_fieldPath_key" ON "return_sand_note_fields"("entryId", "section", "testNo", "fieldPath");

-- AddForeignKey
ALTER TABLE "return_sand_note_entries" ADD CONSTRAINT "return_sand_note_entries_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "return_sand_note_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_sand_note_fields" ADD CONSTRAINT "return_sand_note_fields_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "return_sand_note_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

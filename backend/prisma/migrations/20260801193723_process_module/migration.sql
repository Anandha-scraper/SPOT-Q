-- CreateTable
CREATE TABLE "process" (
    "id" VARCHAR(36) NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_saved_disas" (
    "id" VARCHAR(36) NOT NULL,
    "processId" VARCHAR(36) NOT NULL,
    "disa" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "process_saved_disas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_entries" (
    "id" VARCHAR(36) NOT NULL,
    "processId" VARCHAR(36) NOT NULL,
    "disa" VARCHAR(32) NOT NULL,
    "partName" VARCHAR(128) NOT NULL DEFAULT '',
    "datecode" VARCHAR(16) NOT NULL DEFAULT '',
    "heatcode" VARCHAR(32) NOT NULL DEFAULT '',
    "quantityOfMoulds" INTEGER,
    "metalCompositionC" VARCHAR(32) NOT NULL DEFAULT '-',
    "metalCompositionSi" VARCHAR(32) NOT NULL DEFAULT '-',
    "metalCompositionMn" VARCHAR(32) NOT NULL DEFAULT '-',
    "metalCompositionP" VARCHAR(32) NOT NULL DEFAULT '-',
    "metalCompositionS" VARCHAR(32) NOT NULL DEFAULT '-',
    "metalCompositionMgFL" VARCHAR(32) NOT NULL DEFAULT '-',
    "metalCompositionCu" VARCHAR(32) NOT NULL DEFAULT '-',
    "metalCompositionCr" VARCHAR(32) NOT NULL DEFAULT '-',
    "correctiveAdditionC" VARCHAR(32) NOT NULL DEFAULT '-',
    "correctiveAdditionSi" VARCHAR(32) NOT NULL DEFAULT '-',
    "correctiveAdditionMn" VARCHAR(32) NOT NULL DEFAULT '-',
    "correctiveAdditionS" VARCHAR(32) NOT NULL DEFAULT '-',
    "correctiveAdditionCr" VARCHAR(32) NOT NULL DEFAULT '-',
    "correctiveAdditionCu" VARCHAR(32) NOT NULL DEFAULT '-',
    "correctiveAdditionSn" VARCHAR(32) NOT NULL DEFAULT '-',
    "tappingWt" VARCHAR(32) NOT NULL DEFAULT '-',
    "mg" VARCHAR(32) NOT NULL DEFAULT '-',
    "resMgConvertor" VARCHAR(32) NOT NULL DEFAULT '-',
    "recOfMg" VARCHAR(32) NOT NULL DEFAULT '-',
    "streamInoculant" VARCHAR(32) NOT NULL DEFAULT '-',
    "pTime" VARCHAR(32) NOT NULL DEFAULT '-',
    "timeOfPouring" VARCHAR(32) NOT NULL DEFAULT '',
    "tappingTime" VARCHAR(32) NOT NULL DEFAULT '',
    "pouringTemperatureMin" INTEGER,
    "pouringTemperatureMax" INTEGER,
    "ppCode" VARCHAR(16) NOT NULL DEFAULT '',
    "treatmentNo" VARCHAR(16) NOT NULL DEFAULT '',
    "fcNo" VARCHAR(8) NOT NULL DEFAULT '',
    "heatNo" VARCHAR(32) NOT NULL DEFAULT '',
    "conNo" VARCHAR(32) NOT NULL DEFAULT '',
    "remarks" VARCHAR(500) NOT NULL DEFAULT '',
    "createdBy" VARCHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "process_date_key" ON "process"("date");

-- CreateIndex
CREATE UNIQUE INDEX "process_saved_disas_processId_disa_key" ON "process_saved_disas"("processId", "disa");

-- CreateIndex
CREATE INDEX "process_entries_processId_idx" ON "process_entries"("processId");

-- CreateIndex
CREATE INDEX "process_entries_partName_idx" ON "process_entries"("partName");

-- AddForeignKey
ALTER TABLE "process_saved_disas" ADD CONSTRAINT "process_saved_disas_processId_fkey" FOREIGN KEY ("processId") REFERENCES "process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_entries" ADD CONSTRAINT "process_entries_processId_fkey" FOREIGN KEY ("processId") REFERENCES "process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_entries" ADD CONSTRAINT "process_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

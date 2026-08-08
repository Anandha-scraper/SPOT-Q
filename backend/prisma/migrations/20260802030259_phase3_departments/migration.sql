-- CreateTable
CREATE TABLE "tensile" (
    "id" VARCHAR(36) NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tensile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tensile_entries" (
    "id" VARCHAR(36) NOT NULL,
    "tensileId" VARCHAR(36) NOT NULL,
    "item" VARCHAR(128) NOT NULL,
    "dateCode" VARCHAR(16) NOT NULL,
    "heatCode" VARCHAR(32) NOT NULL DEFAULT '',
    "dia" DOUBLE PRECISION,
    "lo" DOUBLE PRECISION,
    "li" DOUBLE PRECISION,
    "breakingLoad" DOUBLE PRECISION,
    "yieldLoad" DOUBLE PRECISION,
    "uts" DOUBLE PRECISION,
    "ys" DOUBLE PRECISION,
    "elongation" DOUBLE PRECISION,
    "remarks" VARCHAR(500) NOT NULL DEFAULT '',
    "testedBy" VARCHAR(64) NOT NULL DEFAULT '',
    "createdBy" VARCHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tensile_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impact" (
    "id" VARCHAR(36) NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "impact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impact_entries" (
    "id" VARCHAR(36) NOT NULL,
    "impactId" VARCHAR(36) NOT NULL,
    "partName" VARCHAR(128) NOT NULL,
    "dateCode" VARCHAR(16) NOT NULL,
    "specification" VARCHAR(128) NOT NULL,
    "observedValue" VARCHAR(200) NOT NULL,
    "remarks" VARCHAR(500) NOT NULL,
    "createdBy" VARCHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "impact_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "micro_tensile" (
    "id" VARCHAR(36) NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "micro_tensile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "micro_tensile_saved_disas" (
    "id" VARCHAR(36) NOT NULL,
    "microTensileId" VARCHAR(36) NOT NULL,
    "disa" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "micro_tensile_saved_disas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "micro_tensile_entries" (
    "id" VARCHAR(36) NOT NULL,
    "microTensileId" VARCHAR(36) NOT NULL,
    "disa" VARCHAR(32) NOT NULL,
    "itemIt1" VARCHAR(128) NOT NULL,
    "itemIt2" VARCHAR(32) NOT NULL DEFAULT '',
    "dateCode" VARCHAR(16) NOT NULL,
    "heatCode" VARCHAR(32) NOT NULL,
    "barDia" DOUBLE PRECISION NOT NULL,
    "gaugeLength" DOUBLE PRECISION NOT NULL,
    "maxLoad" DOUBLE PRECISION NOT NULL,
    "yieldLoad" DOUBLE PRECISION NOT NULL,
    "tensileStrength" DOUBLE PRECISION NOT NULL,
    "yieldStrength" DOUBLE PRECISION NOT NULL,
    "elongation" DOUBLE PRECISION NOT NULL,
    "remarks" VARCHAR(500) NOT NULL DEFAULT '',
    "testedBy" VARCHAR(64) NOT NULL DEFAULT '',
    "createdBy" VARCHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "micro_tensile_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "micro_structure" (
    "id" VARCHAR(36) NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "micro_structure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "micro_structure_saved_disas" (
    "id" VARCHAR(36) NOT NULL,
    "microStructureId" VARCHAR(36) NOT NULL,
    "disa" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "micro_structure_saved_disas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "micro_structure_entries" (
    "id" VARCHAR(36) NOT NULL,
    "microStructureId" VARCHAR(36) NOT NULL,
    "disa" VARCHAR(32) NOT NULL,
    "partName" VARCHAR(128) NOT NULL,
    "dateCode" VARCHAR(16) NOT NULL,
    "heatCode" VARCHAR(32) NOT NULL,
    "nodularity" DOUBLE PRECISION NOT NULL,
    "graphiteType" VARCHAR(32) NOT NULL,
    "countMin" DOUBLE PRECISION NOT NULL,
    "countMax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sizeMin" DOUBLE PRECISION NOT NULL,
    "sizeMax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ferriteMin" DOUBLE PRECISION NOT NULL,
    "ferriteMax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pearliteMin" DOUBLE PRECISION NOT NULL,
    "pearliteMax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbideMin" DOUBLE PRECISION NOT NULL,
    "carbideMax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" VARCHAR(500) NOT NULL DEFAULT '',
    "createdBy" VARCHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "micro_structure_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_production_details" (
    "id" VARCHAR(36) NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "partName" VARCHAR(128) NOT NULL,
    "noOfMoulds" INTEGER,
    "cPercentFrom" DOUBLE PRECISION,
    "cPercentTo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "siPercentFrom" DOUBLE PRECISION,
    "siPercentTo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mnPercentFrom" DOUBLE PRECISION,
    "mnPercentTo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pPercentFrom" DOUBLE PRECISION,
    "pPercentTo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sPercentFrom" DOUBLE PRECISION,
    "sPercentTo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mgPercentFrom" DOUBLE PRECISION,
    "mgPercentTo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cuPercentFrom" DOUBLE PRECISION,
    "cuPercentTo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "crPercentFrom" DOUBLE PRECISION,
    "crPercentTo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nodularity" DOUBLE PRECISION,
    "noduleCount" DOUBLE PRECISION,
    "graphiteTypeFrom" DOUBLE PRECISION,
    "graphiteTypeTo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pearlite" DOUBLE PRECISION,
    "ferrite" DOUBLE PRECISION,
    "hardnessBHNFrom" DOUBLE PRECISION,
    "hardnessBHNTo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdBy" VARCHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qc_production_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_production_values" (
    "id" VARCHAR(36) NOT NULL,
    "qcProductionId" VARCHAR(36) NOT NULL,
    "kind" VARCHAR(2) NOT NULL,
    "position" INTEGER NOT NULL,
    "value" VARCHAR(32) NOT NULL,

    CONSTRAINT "qc_production_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tensile_date_key" ON "tensile"("date");

-- CreateIndex
CREATE INDEX "tensile_entries_tensileId_idx" ON "tensile_entries"("tensileId");

-- CreateIndex
CREATE UNIQUE INDEX "impact_date_key" ON "impact"("date");

-- CreateIndex
CREATE INDEX "impact_entries_impactId_idx" ON "impact_entries"("impactId");

-- CreateIndex
CREATE UNIQUE INDEX "micro_tensile_date_key" ON "micro_tensile"("date");

-- CreateIndex
CREATE UNIQUE INDEX "micro_tensile_saved_disas_microTensileId_disa_key" ON "micro_tensile_saved_disas"("microTensileId", "disa");

-- CreateIndex
CREATE INDEX "micro_tensile_entries_microTensileId_idx" ON "micro_tensile_entries"("microTensileId");

-- CreateIndex
CREATE UNIQUE INDEX "micro_structure_date_key" ON "micro_structure"("date");

-- CreateIndex
CREATE UNIQUE INDEX "micro_structure_saved_disas_microStructureId_disa_key" ON "micro_structure_saved_disas"("microStructureId", "disa");

-- CreateIndex
CREATE INDEX "micro_structure_entries_microStructureId_idx" ON "micro_structure_entries"("microStructureId");

-- CreateIndex
CREATE INDEX "qc_production_details_date_idx" ON "qc_production_details"("date");

-- CreateIndex
CREATE INDEX "qc_production_details_partName_idx" ON "qc_production_details"("partName");

-- CreateIndex
CREATE UNIQUE INDEX "qc_production_values_qcProductionId_kind_position_key" ON "qc_production_values"("qcProductionId", "kind", "position");

-- AddForeignKey
ALTER TABLE "tensile_entries" ADD CONSTRAINT "tensile_entries_tensileId_fkey" FOREIGN KEY ("tensileId") REFERENCES "tensile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tensile_entries" ADD CONSTRAINT "tensile_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impact_entries" ADD CONSTRAINT "impact_entries_impactId_fkey" FOREIGN KEY ("impactId") REFERENCES "impact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impact_entries" ADD CONSTRAINT "impact_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "micro_tensile_saved_disas" ADD CONSTRAINT "micro_tensile_saved_disas_microTensileId_fkey" FOREIGN KEY ("microTensileId") REFERENCES "micro_tensile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "micro_tensile_entries" ADD CONSTRAINT "micro_tensile_entries_microTensileId_fkey" FOREIGN KEY ("microTensileId") REFERENCES "micro_tensile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "micro_tensile_entries" ADD CONSTRAINT "micro_tensile_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "micro_structure_saved_disas" ADD CONSTRAINT "micro_structure_saved_disas_microStructureId_fkey" FOREIGN KEY ("microStructureId") REFERENCES "micro_structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "micro_structure_entries" ADD CONSTRAINT "micro_structure_entries_microStructureId_fkey" FOREIGN KEY ("microStructureId") REFERENCES "micro_structure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "micro_structure_entries" ADD CONSTRAINT "micro_structure_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_production_details" ADD CONSTRAINT "qc_production_details_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_production_values" ADD CONSTRAINT "qc_production_values_qcProductionId_fkey" FOREIGN KEY ("qcProductionId") REFERENCES "qc_production_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

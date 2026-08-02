-- CreateTable
CREATE TABLE "melting_logs" (
    "id" VARCHAR(36) NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "melting_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "melting_log_primaries" (
    "id" VARCHAR(36) NOT NULL,
    "meltingLogId" VARCHAR(36) NOT NULL,
    "shift" VARCHAR(16) NOT NULL,
    "furnaceNo" VARCHAR(16) NOT NULL,
    "panel" VARCHAR(16) NOT NULL,
    "cumulativeLiquidMetal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalKwhr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "initialKwhr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUnits" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cumulativeUnits" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "melting_log_primaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "melting_log_entries" (
    "id" VARCHAR(36) NOT NULL,
    "primaryId" VARCHAR(36) NOT NULL,
    "heatno" VARCHAR(32) NOT NULL DEFAULT '-',
    "grade" VARCHAR(32) NOT NULL DEFAULT '-',
    "chargingTime" VARCHAR(16) NOT NULL DEFAULT '-',
    "chargingIfBath" VARCHAR(32) NOT NULL DEFAULT '-',
    "chargingLiquidMetalPressPour" VARCHAR(32) NOT NULL DEFAULT '-',
    "chargingLiquidMetalHolder" VARCHAR(32) NOT NULL DEFAULT '-',
    "chargingSgMsSteel" VARCHAR(32) NOT NULL DEFAULT '-',
    "chargingGreyMsSteel" VARCHAR(32) NOT NULL DEFAULT '-',
    "chargingReturnsSg" VARCHAR(32) NOT NULL DEFAULT '-',
    "chargingPigIron" VARCHAR(32) NOT NULL DEFAULT '-',
    "chargingBorings" VARCHAR(32) NOT NULL DEFAULT '-',
    "chargingFinalBath" VARCHAR(32) NOT NULL DEFAULT '-',
    "charCoal" VARCHAR(32) NOT NULL DEFAULT '-',
    "cpcFur" VARCHAR(32) NOT NULL DEFAULT '-',
    "cpcLc" VARCHAR(32) NOT NULL DEFAULT '-',
    "siliconCarbideFur" VARCHAR(32) NOT NULL DEFAULT '-',
    "ferrosiliconFur" VARCHAR(32) NOT NULL DEFAULT '-',
    "ferrosiliconLc" VARCHAR(32) NOT NULL DEFAULT '-',
    "ferroManganeseFur" VARCHAR(32) NOT NULL DEFAULT '-',
    "ferroManganeseLc" VARCHAR(32) NOT NULL DEFAULT '-',
    "cu" VARCHAR(32) NOT NULL DEFAULT '-',
    "cr" VARCHAR(32) NOT NULL DEFAULT '-',
    "pureMg" VARCHAR(32) NOT NULL DEFAULT '-',
    "ironPyrite" VARCHAR(32) NOT NULL DEFAULT '-',
    "labCoinTime" VARCHAR(16) NOT NULL DEFAULT '-',
    "labCoinTempC" VARCHAR(32) NOT NULL DEFAULT '-',
    "deslagingTimeFrom" VARCHAR(16) NOT NULL DEFAULT '-',
    "deslagingTimeTo" VARCHAR(16) NOT NULL DEFAULT '-',
    "metalReadyTime" VARCHAR(16) NOT NULL DEFAULT '-',
    "waitingForTappingFrom" VARCHAR(16) NOT NULL DEFAULT '-',
    "waitingForTappingTo" VARCHAR(16) NOT NULL DEFAULT '-',
    "reason" VARCHAR(200) NOT NULL DEFAULT '-',
    "metalTappingTime" VARCHAR(16) NOT NULL DEFAULT '-',
    "metalTappingTempCSg" VARCHAR(32) NOT NULL DEFAULT '-',
    "directFurnace" VARCHAR(32) NOT NULL DEFAULT '-',
    "holderToFurnace" VARCHAR(32) NOT NULL DEFAULT '-',
    "furnaceToHolder" VARCHAR(32) NOT NULL DEFAULT '-',
    "disaNo" VARCHAR(16) NOT NULL DEFAULT '-',
    "item" VARCHAR(64) NOT NULL DEFAULT '-',
    "furnace1Kw" VARCHAR(16) NOT NULL DEFAULT '-',
    "furnace1A" VARCHAR(16) NOT NULL DEFAULT '-',
    "furnace1V" VARCHAR(16) NOT NULL DEFAULT '-',
    "furnace2Kw" VARCHAR(16) NOT NULL DEFAULT '-',
    "furnace2A" VARCHAR(16) NOT NULL DEFAULT '-',
    "furnace2V" VARCHAR(16) NOT NULL DEFAULT '-',
    "furnace3Kw" VARCHAR(16) NOT NULL DEFAULT '-',
    "furnace3A" VARCHAR(16) NOT NULL DEFAULT '-',
    "furnace3V" VARCHAR(16) NOT NULL DEFAULT '-',
    "furnace4Hz" VARCHAR(16) NOT NULL DEFAULT '-',
    "furnace4Gld" VARCHAR(16) NOT NULL DEFAULT '-',
    "furnace4KwHr" VARCHAR(16) NOT NULL DEFAULT '-',
    "createdBy" VARCHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "melting_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cupola_logs" (
    "id" VARCHAR(36) NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cupola_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cupola_log_primaries" (
    "id" VARCHAR(36) NOT NULL,
    "cupolaLogId" VARCHAR(36) NOT NULL,
    "shift" VARCHAR(16) NOT NULL,
    "holderNumber" VARCHAR(16) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cupola_log_primaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cupola_log_entries" (
    "id" VARCHAR(36) NOT NULL,
    "primaryId" VARCHAR(36) NOT NULL,
    "heatNo" VARCHAR(32) NOT NULL DEFAULT '-',
    "cpc" VARCHAR(32) NOT NULL DEFAULT '-',
    "feSl" VARCHAR(32) NOT NULL DEFAULT '-',
    "feMn" VARCHAR(32) NOT NULL DEFAULT '-',
    "sic" VARCHAR(32) NOT NULL DEFAULT '-',
    "pureMg" VARCHAR(32) NOT NULL DEFAULT '-',
    "cu" VARCHAR(32) NOT NULL DEFAULT '-',
    "feCr" VARCHAR(32) NOT NULL DEFAULT '-',
    "actualTime" VARCHAR(16) NOT NULL DEFAULT '-',
    "tappingTime" VARCHAR(16) NOT NULL DEFAULT '-',
    "tappingTemp" VARCHAR(32) NOT NULL DEFAULT '-',
    "metalKg" VARCHAR(32) NOT NULL DEFAULT '-',
    "disaLine" VARCHAR(16) NOT NULL DEFAULT '-',
    "indFur" VARCHAR(16) NOT NULL DEFAULT '-',
    "bailNo" VARCHAR(16) NOT NULL DEFAULT '-',
    "tap" VARCHAR(16) NOT NULL DEFAULT '-',
    "kw" VARCHAR(16) NOT NULL DEFAULT '-',
    "remarks" VARCHAR(200) NOT NULL DEFAULT '-',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cupola_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disa_reports" (
    "id" VARCHAR(36) NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "shift" VARCHAR(16) NOT NULL,
    "incharge" VARCHAR(64),
    "ppOperator" VARCHAR(64),
    "significantEvent" VARCHAR(500),
    "maintenance" VARCHAR(500),
    "supervisorName" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disa_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disa_report_members" (
    "id" VARCHAR(36) NOT NULL,
    "disaReportId" VARCHAR(36) NOT NULL,
    "position" INTEGER NOT NULL,
    "name" VARCHAR(64) NOT NULL,

    CONSTRAINT "disa_report_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disa_production_entries" (
    "id" VARCHAR(36) NOT NULL,
    "disaReportId" VARCHAR(36) NOT NULL,
    "sNo" INTEGER NOT NULL,
    "counterNo" VARCHAR(32) NOT NULL DEFAULT '',
    "componentName" VARCHAR(64) NOT NULL DEFAULT '',
    "produced" INTEGER NOT NULL DEFAULT 0,
    "poured" INTEGER NOT NULL DEFAULT 0,
    "cycleTime" VARCHAR(16) NOT NULL DEFAULT '',
    "mouldsPerHour" INTEGER NOT NULL DEFAULT 0,
    "remarks" VARCHAR(200) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disa_production_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disa_next_shift_plan_entries" (
    "id" VARCHAR(36) NOT NULL,
    "disaReportId" VARCHAR(36) NOT NULL,
    "sNo" INTEGER NOT NULL,
    "componentName" VARCHAR(64) NOT NULL DEFAULT '',
    "plannedMoulds" INTEGER NOT NULL DEFAULT 0,
    "remarks" VARCHAR(200) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disa_next_shift_plan_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disa_delay_entries" (
    "id" VARCHAR(36) NOT NULL,
    "disaReportId" VARCHAR(36) NOT NULL,
    "sNo" INTEGER NOT NULL,
    "delays" VARCHAR(200) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disa_delay_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disa_delay_intervals" (
    "id" VARCHAR(36) NOT NULL,
    "delayEntryId" VARCHAR(36) NOT NULL,
    "position" INTEGER NOT NULL,
    "durationMinutes" VARCHAR(16) NOT NULL DEFAULT '',
    "fromTime" VARCHAR(16) NOT NULL DEFAULT '',
    "toTime" VARCHAR(16) NOT NULL DEFAULT '',

    CONSTRAINT "disa_delay_intervals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disa_mould_hardness_entries" (
    "id" VARCHAR(36) NOT NULL,
    "disaReportId" VARCHAR(36) NOT NULL,
    "sNo" INTEGER NOT NULL,
    "componentName" VARCHAR(64) NOT NULL DEFAULT '',
    "remarks" VARCHAR(200) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disa_mould_hardness_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disa_mould_hardness_readings" (
    "id" VARCHAR(36) NOT NULL,
    "entryId" VARCHAR(36) NOT NULL,
    "kind" VARCHAR(4) NOT NULL,
    "position" INTEGER NOT NULL,
    "fromValue" VARCHAR(16) NOT NULL DEFAULT '',
    "toValue" VARCHAR(16) NOT NULL DEFAULT '',

    CONSTRAINT "disa_mould_hardness_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disa_pattern_temp_entries" (
    "id" VARCHAR(36) NOT NULL,
    "disaReportId" VARCHAR(36) NOT NULL,
    "sNo" INTEGER NOT NULL,
    "item" VARCHAR(64) NOT NULL DEFAULT '',
    "pp" INTEGER NOT NULL DEFAULT 0,
    "sp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disa_pattern_temp_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dmm_logs" (
    "id" VARCHAR(36) NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dmm_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dmm_machine_shifts" (
    "id" VARCHAR(36) NOT NULL,
    "dmmLogId" VARCHAR(36) NOT NULL,
    "machine" VARCHAR(32) NOT NULL,
    "shift" VARCHAR(4) NOT NULL,
    "operatorName" VARCHAR(64) NOT NULL DEFAULT '',
    "checkedBy" VARCHAR(64) NOT NULL DEFAULT '',

    CONSTRAINT "dmm_machine_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dmm_parameter_entries" (
    "id" VARCHAR(36) NOT NULL,
    "machineShiftId" VARCHAR(36) NOT NULL,
    "sNo" INTEGER NOT NULL,
    "customer" VARCHAR(64) NOT NULL DEFAULT '',
    "itemDescription" VARCHAR(128) NOT NULL DEFAULT '',
    "time" VARCHAR(16) NOT NULL DEFAULT '',
    "ppThickness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ppHeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spThickness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spHeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coreMaskThickness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coreMaskHeightOutside" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coreMaskHeightInside" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sandShotPressureBar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "correctionShotTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "squeezePressure" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ppStrippingAcceleration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ppStrippingDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spStrippingAcceleration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spStrippingDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mouldThicknessPlus10" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closeUpForceMouldCloseUpPressure" VARCHAR(32) NOT NULL DEFAULT '',
    "remarks" VARCHAR(200) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dmm_parameter_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sand_note_days" (
    "id" VARCHAR(36) NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sand_note_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sand_note_entries" (
    "id" VARCHAR(36) NOT NULL,
    "sandNoteDayId" VARCHAR(36) NOT NULL,
    "shift" VARCHAR(16) NOT NULL,
    "sandPlant" VARCHAR(32) NOT NULL,
    "compactibilitySetting" VARCHAR(32) NOT NULL DEFAULT '',
    "shearStrengthSetting" VARCHAR(32) NOT NULL DEFAULT '',
    "remarks" VARCHAR(500) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sand_note_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sand_note_fields" (
    "id" VARCHAR(36) NOT NULL,
    "entryId" VARCHAR(36) NOT NULL,
    "section" VARCHAR(20) NOT NULL,
    "testNo" INTEGER NOT NULL,
    "fieldPath" VARCHAR(40) NOT NULL,
    "value" VARCHAR(64) NOT NULL,

    CONSTRAINT "sand_note_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sand_record_days" (
    "id" VARCHAR(36) NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "plant" VARCHAR(16) NOT NULL,
    "sandLump" VARCHAR(32) NOT NULL DEFAULT '',
    "newSandWt" VARCHAR(32) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sand_record_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sand_record_values" (
    "id" VARCHAR(36) NOT NULL,
    "recordId" VARCHAR(36) NOT NULL,
    "section" VARCHAR(20) NOT NULL,
    "shiftKey" VARCHAR(10) NOT NULL,
    "field" VARCHAR(30) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "value" VARCHAR(64) NOT NULL,

    CONSTRAINT "sand_record_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sand_record_test_parameters" (
    "id" VARCHAR(36) NOT NULL,
    "recordId" VARCHAR(36) NOT NULL,
    "sno" INTEGER NOT NULL,
    "time" VARCHAR(16) NOT NULL DEFAULT '',
    "mixno" VARCHAR(16) NOT NULL DEFAULT '',
    "permeability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gcsFdyA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gcsFdyB" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wts" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "moisture" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "compactability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "compressibility" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waterLitre" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sandTempBC" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sandTempWU" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sandTempSSUmax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "newSandKgs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mould" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bentoniteWithPremixKgs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bentoniteWithPremixPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bentoniteKgs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bentonitePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "premixKgs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "premixPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coalDustKgs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coalDustPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "compactabilitySettings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mouldStrength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shearStrengthSetting" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "preparedSandlumps" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "itemName" VARCHAR(64) NOT NULL DEFAULT '',
    "remarks" VARCHAR(200) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sand_record_test_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "melting_logs_date_key" ON "melting_logs"("date");

-- CreateIndex
CREATE UNIQUE INDEX "melting_log_primaries_meltingLogId_shift_furnaceNo_panel_key" ON "melting_log_primaries"("meltingLogId", "shift", "furnaceNo", "panel");

-- CreateIndex
CREATE INDEX "melting_log_entries_primaryId_idx" ON "melting_log_entries"("primaryId");

-- CreateIndex
CREATE UNIQUE INDEX "cupola_logs_date_key" ON "cupola_logs"("date");

-- CreateIndex
CREATE UNIQUE INDEX "cupola_log_primaries_cupolaLogId_shift_holderNumber_key" ON "cupola_log_primaries"("cupolaLogId", "shift", "holderNumber");

-- CreateIndex
CREATE INDEX "cupola_log_entries_primaryId_idx" ON "cupola_log_entries"("primaryId");

-- CreateIndex
CREATE UNIQUE INDEX "disa_reports_date_shift_key" ON "disa_reports"("date", "shift");

-- CreateIndex
CREATE UNIQUE INDEX "disa_report_members_disaReportId_position_key" ON "disa_report_members"("disaReportId", "position");

-- CreateIndex
CREATE INDEX "disa_production_entries_disaReportId_idx" ON "disa_production_entries"("disaReportId");

-- CreateIndex
CREATE INDEX "disa_next_shift_plan_entries_disaReportId_idx" ON "disa_next_shift_plan_entries"("disaReportId");

-- CreateIndex
CREATE INDEX "disa_delay_entries_disaReportId_idx" ON "disa_delay_entries"("disaReportId");

-- CreateIndex
CREATE UNIQUE INDEX "disa_delay_intervals_delayEntryId_position_key" ON "disa_delay_intervals"("delayEntryId", "position");

-- CreateIndex
CREATE INDEX "disa_mould_hardness_entries_disaReportId_idx" ON "disa_mould_hardness_entries"("disaReportId");

-- CreateIndex
CREATE UNIQUE INDEX "disa_mould_hardness_readings_entryId_kind_position_key" ON "disa_mould_hardness_readings"("entryId", "kind", "position");

-- CreateIndex
CREATE INDEX "disa_pattern_temp_entries_disaReportId_idx" ON "disa_pattern_temp_entries"("disaReportId");

-- CreateIndex
CREATE UNIQUE INDEX "dmm_logs_date_key" ON "dmm_logs"("date");

-- CreateIndex
CREATE UNIQUE INDEX "dmm_machine_shifts_dmmLogId_machine_shift_key" ON "dmm_machine_shifts"("dmmLogId", "machine", "shift");

-- CreateIndex
CREATE INDEX "dmm_parameter_entries_machineShiftId_idx" ON "dmm_parameter_entries"("machineShiftId");

-- CreateIndex
CREATE UNIQUE INDEX "sand_note_days_date_key" ON "sand_note_days"("date");

-- CreateIndex
CREATE UNIQUE INDEX "sand_note_entries_sandNoteDayId_shift_sandPlant_key" ON "sand_note_entries"("sandNoteDayId", "shift", "sandPlant");

-- CreateIndex
CREATE UNIQUE INDEX "sand_note_fields_entryId_section_testNo_fieldPath_key" ON "sand_note_fields"("entryId", "section", "testNo", "fieldPath");

-- CreateIndex
CREATE UNIQUE INDEX "sand_record_days_date_plant_key" ON "sand_record_days"("date", "plant");

-- CreateIndex
CREATE UNIQUE INDEX "sand_record_values_recordId_section_shiftKey_field_position_key" ON "sand_record_values"("recordId", "section", "shiftKey", "field", "position");

-- CreateIndex
CREATE INDEX "sand_record_test_parameters_recordId_idx" ON "sand_record_test_parameters"("recordId");

-- AddForeignKey
ALTER TABLE "melting_log_primaries" ADD CONSTRAINT "melting_log_primaries_meltingLogId_fkey" FOREIGN KEY ("meltingLogId") REFERENCES "melting_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "melting_log_entries" ADD CONSTRAINT "melting_log_entries_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "melting_log_primaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "melting_log_entries" ADD CONSTRAINT "melting_log_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cupola_log_primaries" ADD CONSTRAINT "cupola_log_primaries_cupolaLogId_fkey" FOREIGN KEY ("cupolaLogId") REFERENCES "cupola_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cupola_log_entries" ADD CONSTRAINT "cupola_log_entries_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "cupola_log_primaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disa_report_members" ADD CONSTRAINT "disa_report_members_disaReportId_fkey" FOREIGN KEY ("disaReportId") REFERENCES "disa_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disa_production_entries" ADD CONSTRAINT "disa_production_entries_disaReportId_fkey" FOREIGN KEY ("disaReportId") REFERENCES "disa_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disa_next_shift_plan_entries" ADD CONSTRAINT "disa_next_shift_plan_entries_disaReportId_fkey" FOREIGN KEY ("disaReportId") REFERENCES "disa_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disa_delay_entries" ADD CONSTRAINT "disa_delay_entries_disaReportId_fkey" FOREIGN KEY ("disaReportId") REFERENCES "disa_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disa_delay_intervals" ADD CONSTRAINT "disa_delay_intervals_delayEntryId_fkey" FOREIGN KEY ("delayEntryId") REFERENCES "disa_delay_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disa_mould_hardness_entries" ADD CONSTRAINT "disa_mould_hardness_entries_disaReportId_fkey" FOREIGN KEY ("disaReportId") REFERENCES "disa_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disa_mould_hardness_readings" ADD CONSTRAINT "disa_mould_hardness_readings_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "disa_mould_hardness_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disa_pattern_temp_entries" ADD CONSTRAINT "disa_pattern_temp_entries_disaReportId_fkey" FOREIGN KEY ("disaReportId") REFERENCES "disa_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dmm_machine_shifts" ADD CONSTRAINT "dmm_machine_shifts_dmmLogId_fkey" FOREIGN KEY ("dmmLogId") REFERENCES "dmm_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dmm_parameter_entries" ADD CONSTRAINT "dmm_parameter_entries_machineShiftId_fkey" FOREIGN KEY ("machineShiftId") REFERENCES "dmm_machine_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sand_note_entries" ADD CONSTRAINT "sand_note_entries_sandNoteDayId_fkey" FOREIGN KEY ("sandNoteDayId") REFERENCES "sand_note_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sand_note_fields" ADD CONSTRAINT "sand_note_fields_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "sand_note_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sand_record_values" ADD CONSTRAINT "sand_record_values_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "sand_record_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sand_record_test_parameters" ADD CONSTRAINT "sand_record_test_parameters_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "sand_record_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

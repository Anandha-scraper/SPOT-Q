-- AlterTable
-- Existing non-null rows currently hold the old "unselected checkpoint"
-- Float placeholder 0 (see frontend.md's 2026-08-08 changelog for the bug
-- this fixes going forward) — the USING cast below preserves those as the
-- string "0" rather than retroactively guessing "-", since a heuristic
-- backfill could wrongly blank out a legitimately-measured zero reading.
ALTER TABLE "sand_record_test_parameters"
  ALTER COLUMN "gcsFdyA" DROP DEFAULT,
  ALTER COLUMN "gcsFdyA" TYPE VARCHAR(16) USING "gcsFdyA"::VARCHAR(16),
  ALTER COLUMN "gcsFdyA" SET DEFAULT '-',
  ALTER COLUMN "gcsFdyB" DROP DEFAULT,
  ALTER COLUMN "gcsFdyB" TYPE VARCHAR(16) USING "gcsFdyB"::VARCHAR(16),
  ALTER COLUMN "gcsFdyB" SET DEFAULT '-',
  ALTER COLUMN "bentoniteKgs" DROP DEFAULT,
  ALTER COLUMN "bentoniteKgs" TYPE VARCHAR(16) USING "bentoniteKgs"::VARCHAR(16),
  ALTER COLUMN "bentoniteKgs" SET DEFAULT '-',
  ALTER COLUMN "bentonitePercent" DROP DEFAULT,
  ALTER COLUMN "bentonitePercent" TYPE VARCHAR(16) USING "bentonitePercent"::VARCHAR(16),
  ALTER COLUMN "bentonitePercent" SET DEFAULT '-',
  ALTER COLUMN "premixKgs" DROP DEFAULT,
  ALTER COLUMN "premixKgs" TYPE VARCHAR(16) USING "premixKgs"::VARCHAR(16),
  ALTER COLUMN "premixKgs" SET DEFAULT '-',
  ALTER COLUMN "premixPercent" DROP DEFAULT,
  ALTER COLUMN "premixPercent" TYPE VARCHAR(16) USING "premixPercent"::VARCHAR(16),
  ALTER COLUMN "premixPercent" SET DEFAULT '-',
  ALTER COLUMN "coalDustKgs" DROP DEFAULT,
  ALTER COLUMN "coalDustKgs" TYPE VARCHAR(16) USING "coalDustKgs"::VARCHAR(16),
  ALTER COLUMN "coalDustKgs" SET DEFAULT '-',
  ALTER COLUMN "coalDustPercent" DROP DEFAULT,
  ALTER COLUMN "coalDustPercent" TYPE VARCHAR(16) USING "coalDustPercent"::VARCHAR(16),
  ALTER COLUMN "coalDustPercent" SET DEFAULT '-',
  ADD COLUMN "bentoniteCheckpoint" VARCHAR(16) NOT NULL DEFAULT '-';

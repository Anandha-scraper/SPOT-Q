-- CreateTable
CREATE TABLE "download_logs" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "employeeId" VARCHAR(32) NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "department" VARCHAR(32) NOT NULL,
    "reportType" VARCHAR(64) NOT NULL DEFAULT '',
    "rangeLabel" VARCHAR(128) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "download_logs_userId_createdAt_idx" ON "download_logs"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "download_logs_createdAt_idx" ON "download_logs"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "download_logs" ADD CONSTRAINT "download_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(36) NOT NULL,
    "employeeId" VARCHAR(32) NOT NULL,
    "name" TEXT NOT NULL,
    "department" VARCHAR(32) NOT NULL,
    "role" VARCHAR(16) NOT NULL DEFAULT 'employee',
    "passwordHash" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_activities" (
    "id" VARCHAR(36) NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "employeeId" VARCHAR(32) NOT NULL,
    "department" VARCHAR(32) NOT NULL,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" VARCHAR(64),
    "userAgent" TEXT,

    CONSTRAINT "login_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- CreateIndex
CREATE INDEX "users_department_idx" ON "users"("department");

-- CreateIndex
CREATE INDEX "login_activities_userId_loginAt_idx" ON "login_activities"("userId", "loginAt" DESC);

-- CreateIndex
CREATE INDEX "login_activities_employeeId_loginAt_idx" ON "login_activities"("employeeId", "loginAt" DESC);

-- AddForeignKey
ALTER TABLE "login_activities" ADD CONSTRAINT "login_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

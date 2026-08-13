-- CreateTable
CREATE TABLE "ScoreLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "change" INTEGER NOT NULL,
    "scoreAfter" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "performedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScoreLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScoreLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WaitlistEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WaitlistEntry_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrumentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceRecord_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScoreSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "initialScore" INTEGER NOT NULL DEFAULT 100,
    "minToBook" INTEGER NOT NULL DEFAULT 50,
    "earlyReturnBonus" INTEGER NOT NULL DEFAULT 5,
    "evidenceBonus" INTEGER NOT NULL DEFAULT 5,
    "unlockScore" INTEGER NOT NULL DEFAULT 100,
    "updatedById" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "evidenceUrl" TEXT,
    "reminderOffsetMinutes" INTEGER,
    "reminderSentAt" DATETIME,
    "recurrence" TEXT NOT NULL DEFAULT 'NONE',
    "recurrenceEndDate" DATETIME,
    "recurrenceGroupId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("approvedAt", "approvedById", "createdAt", "date", "endTime", "evidenceUrl", "id", "instrumentId", "purpose", "reminderOffsetMinutes", "reminderSentAt", "startTime", "status", "updatedAt", "userId") SELECT "approvedAt", "approvedById", "createdAt", "date", "endTime", "evidenceUrl", "id", "instrumentId", "purpose", "reminderOffsetMinutes", "reminderSentAt", "startTime", "status", "updatedAt", "userId" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX "Booking_date_idx" ON "Booking"("date");
CREATE INDEX "Booking_instrumentId_date_idx" ON "Booking"("instrumentId", "date");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "className" TEXT,
    "studentId" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "score" INTEGER NOT NULL DEFAULT 100,
    "telegramUserId" TEXT,
    "telegramAlertStyle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatarUrl", "className", "createdAt", "email", "id", "isActive", "name", "passwordHash", "phone", "role", "studentId", "updatedAt") SELECT "avatarUrl", "className", "createdAt", "email", "id", "isActive", "name", "passwordHash", "phone", "role", "studentId", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_telegramUserId_key" ON "User"("telegramUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ScoreLog_userId_createdAt_idx" ON "ScoreLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ScoreLog_performedById_idx" ON "ScoreLog"("performedById");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_instrumentId_date_status_idx" ON "WaitlistEntry"("instrumentId", "date", "status");

-- CreateIndex
CREATE INDEX "WaitlistEntry_userId_idx" ON "WaitlistEntry"("userId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_instrumentId_date_idx" ON "MaintenanceRecord"("instrumentId", "date");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_instrumentId_status_idx" ON "MaintenanceRecord"("instrumentId", "status");

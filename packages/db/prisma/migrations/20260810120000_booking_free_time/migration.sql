/*
  Convert fixed school-period slots (P1-P10) into free-form start/end times.

  - Booking gains `startTime` and `endTime` (HH:MM), derived from its slots
  - BookingSlot table is dropped
*/

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '08:00',
    "endTime" TEXT NOT NULL DEFAULT '16:50',
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "evidenceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Booking" ("approvedAt", "approvedById", "createdAt", "date", "endTime", "id", "instrumentId", "purpose", "startTime", "status", "updatedAt", "userId")
SELECT
    "approvedAt",
    "approvedById",
    "createdAt",
    "date",
    COALESCE(
        (SELECT MAX(
            CASE "timeSlot"
                WHEN 'P1' THEN '08:50' WHEN 'P2' THEN '09:40' WHEN 'P3' THEN '10:40'
                WHEN 'P4' THEN '11:30' WHEN 'P5' THEN '12:20' WHEN 'P6' THEN '13:20'
                WHEN 'P7' THEN '14:10' WHEN 'P8' THEN '15:10' WHEN 'P9' THEN '16:00'
                WHEN 'P10' THEN '16:50'
            END)
        FROM "BookingSlot" WHERE "BookingSlot"."bookingId" = "Booking"."id"),
        '16:50'
    ),
    "id",
    "instrumentId",
    "purpose",
    COALESCE(
        (SELECT MIN(
            CASE "timeSlot"
                WHEN 'P1' THEN '08:00' WHEN 'P2' THEN '08:50' WHEN 'P3' THEN '09:50'
                WHEN 'P4' THEN '10:40' WHEN 'P5' THEN '11:30' WHEN 'P6' THEN '12:30'
                WHEN 'P7' THEN '13:20' WHEN 'P8' THEN '14:20' WHEN 'P9' THEN '15:10'
                WHEN 'P10' THEN '16:00'
            END)
        FROM "BookingSlot" WHERE "BookingSlot"."bookingId" = "Booking"."id"),
        '08:00'
    ),
    "status",
    "updatedAt",
    "userId"
FROM "Booking";

DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX "Booking_date_idx" ON "Booking"("date");
CREATE INDEX "Booking_instrumentId_date_idx" ON "Booking"("instrumentId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

DROP TABLE "BookingSlot";

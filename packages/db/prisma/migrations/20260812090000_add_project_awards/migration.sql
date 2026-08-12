-- CreateTable
CREATE TABLE "ProjectAward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'OTHER',
    "year" INTEGER NOT NULL DEFAULT 2026,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectAward_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate existing single-award text into ProjectAward rows (per project year)
INSERT INTO "ProjectAward" ("id", "projectId", "title", "level", "year", "createdAt", "updatedAt")
SELECT
    'aw_' || lower(hex(randomblob(10))),
    "id",
    "award",
    CASE
        WHEN "award" LIKE '%รองชนะเลิศ%' THEN 'SILVER'
        WHEN "award" LIKE '%ชนะเลิศ%' THEN 'GOLD'
        WHEN "award" LIKE '%ชมเชย%' THEN 'HONORABLE'
        ELSE 'OTHER'
    END,
    "year",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Project"
WHERE "award" IS NOT NULL AND "award" <> '';

-- RedefineTables: drop the single "award" column
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "studentNames" TEXT NOT NULL,
    "className" TEXT,
    "teacherName" TEXT,
    "imageUrl" TEXT,
    "year" INTEGER NOT NULL DEFAULT 2026,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("className", "createdAt", "createdById", "displayOrder", "featured", "id", "imageUrl", "published", "studentNames", "summary", "teacherName", "title", "updatedAt", "year") SELECT "className", "createdAt", "createdById", "displayOrder", "featured", "id", "imageUrl", "published", "studentNames", "summary", "teacherName", "title", "updatedAt", "year" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_published_featured_idx" ON "Project"("published", "featured");
CREATE INDEX "Project_year_idx" ON "Project"("year");
CREATE INDEX "Project_displayOrder_idx" ON "Project"("displayOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ProjectAward_projectId_idx" ON "ProjectAward"("projectId");
CREATE INDEX "ProjectAward_level_idx" ON "ProjectAward"("level");
CREATE INDEX "ProjectAward_year_idx" ON "ProjectAward"("year");

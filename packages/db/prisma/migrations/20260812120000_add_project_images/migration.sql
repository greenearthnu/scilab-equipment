-- CreateTable
CREATE TABLE "ProjectImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectImage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate existing cover image into ProjectImage rows
INSERT INTO "ProjectImage" ("id", "projectId", "url", "displayOrder", "createdAt")
SELECT
    'pi_' || lower(hex(randomblob(10))),
    "id",
    "imageUrl",
    0,
    CURRENT_TIMESTAMP
FROM "Project"
WHERE "imageUrl" IS NOT NULL AND "imageUrl" <> '';

-- RedefineTables: drop "imageUrl", make "className"/"teacherName" required
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "studentNames" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "year" INTEGER NOT NULL DEFAULT 2026,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("className", "createdAt", "createdById", "displayOrder", "featured", "id", "published", "studentNames", "summary", "teacherName", "title", "updatedAt", "year") SELECT COALESCE("className", ''), "createdAt", "createdById", "displayOrder", "featured", "id", "published", "studentNames", "summary", COALESCE("teacherName", ''), "title", "updatedAt", "year" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_published_featured_idx" ON "Project"("published", "featured");
CREATE INDEX "Project_year_idx" ON "Project"("year");
CREATE INDEX "Project_displayOrder_idx" ON "Project"("displayOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ProjectImage_projectId_idx" ON "ProjectImage"("projectId");

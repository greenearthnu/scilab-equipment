-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "studentNames" TEXT NOT NULL,
    "className" TEXT,
    "teacherName" TEXT,
    "award" TEXT,
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
INSERT INTO "new_Project" ("award", "className", "createdAt", "createdById", "displayOrder", "featured", "id", "imageUrl", "published", "studentNames", "summary", "teacherName", "title", "updatedAt") SELECT "award", "className", "createdAt", "createdById", "displayOrder", "featured", "id", "imageUrl", "published", "studentNames", "summary", "teacherName", "title", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_published_featured_idx" ON "Project"("published", "featured");
CREATE INDEX "Project_year_idx" ON "Project"("year");
CREATE INDEX "Project_displayOrder_idx" ON "Project"("displayOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

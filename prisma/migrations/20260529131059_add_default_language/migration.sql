-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SALES',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "department" TEXT,
    "employee_id" TEXT,
    "job_title" TEXT,
    "region" TEXT,
    "default_language" TEXT NOT NULL DEFAULT 'zh-TW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "department", "email", "employee_id", "id", "job_title", "name", "password", "region", "role", "status", "updatedAt") SELECT "createdAt", "department", "email", "employee_id", "id", "job_title", "name", "password", "region", "role", "status", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_employee_id_key" ON "User"("employee_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

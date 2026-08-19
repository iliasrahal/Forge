-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'PARTICULIER',
    "firstName" TEXT,
    "lastName" TEXT,
    "companyName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "street" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Client" ("city", "companyName", "createdAt", "email", "firstName", "id", "lastName", "notes", "phone", "postalCode", "street", "type", "updatedAt") SELECT "city", "companyName", "createdAt", "email", "firstName", "id", "lastName", "notes", "phone", "postalCode", "street", "type", "updatedAt" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

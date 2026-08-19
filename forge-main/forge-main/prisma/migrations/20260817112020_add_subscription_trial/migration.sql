-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "trialEndsAt" DATETIME,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIAL',
    "job" TEXT,
    "workMode" TEXT,
    "birthDate" DATETIME,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("birthDate", "createdAt", "email", "firstName", "id", "job", "onboardingCompleted", "passwordHash", "phone", "updatedAt", "workMode") SELECT "birthDate", "createdAt", "email", "firstName", "id", "job", "onboardingCompleted", "passwordHash", "phone", "updatedAt", "workMode" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

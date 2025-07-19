/*
  Warnings:

  - You are about to drop the column `scheduled_date` on the `scheduled_activities` table. All the data in the column will be lost.
  - You are about to drop the column `scheduled_time` on the `scheduled_activities` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `scheduled_activities` table. All the data in the column will be lost.
  - Added the required column `scheduled_at` to the `scheduled_activities` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "meal_type" TEXT NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "instructions" TEXT NOT NULL,
    "prep_time" INTEGER,
    "cook_time" INTEGER,
    "total_time" INTEGER,
    "difficulty" TEXT,
    "cuisine" TEXT,
    "tags" TEXT,
    "photo_url" TEXT,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "original_query" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "recipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipe_id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_scheduled_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "scheduled_at" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "intensity" TEXT NOT NULL DEFAULT 'MODERATE',
    "notes" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "scheduled_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "scheduled_activities_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_scheduled_activities" ("created_at", "duration", "exercise_id", "id", "intensity", "is_completed", "notes", "updated_at", "user_id") SELECT "created_at", "duration", "exercise_id", "id", "intensity", "is_completed", "notes", "updated_at", "user_id" FROM "scheduled_activities";
DROP TABLE "scheduled_activities";
ALTER TABLE "new_scheduled_activities" RENAME TO "scheduled_activities";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

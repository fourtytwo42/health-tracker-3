/*
  Warnings:

  - You are about to drop the `exercise_preferences` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "exercise_preferences_user_id_exercise_id_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "exercise_preferences";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ingredient_mappings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ingredient_mappings_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "show_extra_ingredient_data" BOOLEAN NOT NULL DEFAULT true,
    "use_metric_units" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "totalCalories" INTEGER,
    "targetMuscleGroups" TEXT,
    "equipment" TEXT,
    "instructions" TEXT,
    "photoUrl" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "originalQuery" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workout_exercises" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workout_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER,
    "duration" INTEGER,
    "restPeriod" INTEGER NOT NULL DEFAULT 60,
    "order" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "workout_exercises_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workout_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workout_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "workout_id" TEXT NOT NULL,
    "completed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL,
    "calories" INTEGER,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "workout_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workout_logs_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_exercises" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activity" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "met" REAL NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "intensity" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_exercises" ("activity", "category", "code", "created_at", "description", "id", "intensity", "is_active", "met", "updated_at") SELECT "activity", "category", "code", "created_at", "description", "id", "intensity", "is_active", "met", "updated_at" FROM "exercises";
DROP TABLE "exercises";
ALTER TABLE "new_exercises" RENAME TO "exercises";
CREATE UNIQUE INDEX "exercises_code_key" ON "exercises"("code");
CREATE TABLE "new_ingredients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serving_size" TEXT NOT NULL DEFAULT '100g',
    "calories" REAL NOT NULL DEFAULT 0,
    "protein" REAL NOT NULL DEFAULT 0,
    "carbs" REAL NOT NULL DEFAULT 0,
    "fat" REAL NOT NULL DEFAULT 0,
    "fiber" REAL NOT NULL DEFAULT 0,
    "sugar" REAL NOT NULL DEFAULT 0,
    "sodium" REAL NOT NULL DEFAULT 0,
    "category" TEXT,
    "aisle" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "allergens" TEXT,
    "cholesterol" REAL NOT NULL DEFAULT 0,
    "dietary_flags" TEXT,
    "glycemic_index" REAL,
    "glycemic_load" REAL,
    "monounsaturated_fat" REAL,
    "net_carbs" REAL,
    "polyunsaturated_fat" REAL,
    "saturated_fat" REAL,
    "trans_fat" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_ingredients" ("aisle", "allergens", "calories", "carbs", "category", "cholesterol", "created_at", "description", "dietary_flags", "fat", "fiber", "glycemic_index", "glycemic_load", "id", "is_active", "monounsaturated_fat", "name", "net_carbs", "polyunsaturated_fat", "protein", "saturated_fat", "serving_size", "sodium", "sugar", "trans_fat", "updated_at") SELECT "aisle", "allergens", "calories", "carbs", "category", coalesce("cholesterol", 0) AS "cholesterol", "created_at", "description", "dietary_flags", "fat", coalesce("fiber", 0) AS "fiber", "glycemic_index", "glycemic_load", "id", "is_active", "monounsaturated_fat", "name", "net_carbs", "polyunsaturated_fat", "protein", "saturated_fat", "serving_size", coalesce("sodium", 0) AS "sodium", coalesce("sugar", 0) AS "sugar", "trans_fat", "updated_at" FROM "ingredients";
DROP TABLE "ingredients";
ALTER TABLE "new_ingredients" RENAME TO "ingredients";
CREATE UNIQUE INDEX "ingredients_name_key" ON "ingredients"("name");
CREATE TABLE "new_recipe_ingredients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipe_id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_recipe_ingredients" ("amount", "created_at", "id", "ingredient_id", "is_optional", "notes", "order", "recipe_id", "unit", "updated_at") SELECT "amount", "created_at", "id", "ingredient_id", "is_optional", "notes", "order", "recipe_id", "unit", "updated_at" FROM "recipe_ingredients";
DROP TABLE "recipe_ingredients";
ALTER TABLE "new_recipe_ingredients" RENAME TO "recipe_ingredients";
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
    CONSTRAINT "scheduled_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_scheduled_activities" ("completed_at", "created_at", "duration", "exercise_id", "id", "intensity", "is_completed", "notes", "scheduled_at", "updated_at", "user_id") SELECT "completed_at", "created_at", "duration", "exercise_id", "id", "intensity", "is_completed", "notes", "scheduled_at", "updated_at", "user_id" FROM "scheduled_activities";
DROP TABLE "scheduled_activities";
ALTER TABLE "new_scheduled_activities" RENAME TO "scheduled_activities";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_mappings_keyword_key" ON "ingredient_mappings"("keyword");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

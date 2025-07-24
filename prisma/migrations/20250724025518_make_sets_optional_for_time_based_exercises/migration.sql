-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_workout_exercises" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workout_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "sets" INTEGER,
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
INSERT INTO "new_workout_exercises" ("created_at", "duration", "exercise_id", "id", "notes", "order", "reps", "restPeriod", "sets", "updated_at", "workout_id") SELECT "created_at", "duration", "exercise_id", "id", "notes", "order", "reps", "restPeriod", "sets", "updated_at", "workout_id" FROM "workout_exercises";
DROP TABLE "workout_exercises";
ALTER TABLE "new_workout_exercises" RENAME TO "workout_exercises";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

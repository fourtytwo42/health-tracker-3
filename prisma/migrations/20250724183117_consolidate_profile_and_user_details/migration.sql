/*
  Warnings:

  - You are about to drop the `user_details` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "alcohol_consumption" TEXT;
ALTER TABLE "profiles" ADD COLUMN "allergies" TEXT;
ALTER TABLE "profiles" ADD COLUMN "blood_type" TEXT;
ALTER TABLE "profiles" ADD COLUMN "bmi" REAL;
ALTER TABLE "profiles" ADD COLUMN "body_fat_percentage" REAL;
ALTER TABLE "profiles" ADD COLUMN "dietary_goals" TEXT;
ALTER TABLE "profiles" ADD COLUMN "disabilities" TEXT;
ALTER TABLE "profiles" ADD COLUMN "exercise_limitations" TEXT;
ALTER TABLE "profiles" ADD COLUMN "fitness_goals" TEXT;
ALTER TABLE "profiles" ADD COLUMN "injury_history" TEXT;
ALTER TABLE "profiles" ADD COLUMN "medical_conditions" TEXT;
ALTER TABLE "profiles" ADD COLUMN "medications" TEXT;
ALTER TABLE "profiles" ADD COLUMN "mobility_issues" TEXT;
ALTER TABLE "profiles" ADD COLUMN "muscle_mass" REAL;
ALTER TABLE "profiles" ADD COLUMN "sleep_quality" TEXT;
ALTER TABLE "profiles" ADD COLUMN "smoking_status" TEXT;
ALTER TABLE "profiles" ADD COLUMN "stress_level" TEXT;
ALTER TABLE "profiles" ADD COLUMN "weight_goals" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "user_details";
PRAGMA foreign_keys=on;

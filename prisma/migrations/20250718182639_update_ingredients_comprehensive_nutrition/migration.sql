-- AlterTable
ALTER TABLE "ingredients" ADD COLUMN "allergens" TEXT;
ALTER TABLE "ingredients" ADD COLUMN "cholesterol" REAL;
ALTER TABLE "ingredients" ADD COLUMN "dietary_flags" TEXT;
ALTER TABLE "ingredients" ADD COLUMN "glycemic_index" REAL;
ALTER TABLE "ingredients" ADD COLUMN "glycemic_load" REAL;
ALTER TABLE "ingredients" ADD COLUMN "monounsaturated_fat" REAL;
ALTER TABLE "ingredients" ADD COLUMN "net_carbs" REAL;
ALTER TABLE "ingredients" ADD COLUMN "polyunsaturated_fat" REAL;
ALTER TABLE "ingredients" ADD COLUMN "saturated_fat" REAL;
ALTER TABLE "ingredients" ADD COLUMN "trans_fat" REAL;

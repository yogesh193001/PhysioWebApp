-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "defaultHoldSecs" INTEGER,
ADD COLUMN     "defaultRepDelay" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "defaultReps" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "defaultSides" TEXT;

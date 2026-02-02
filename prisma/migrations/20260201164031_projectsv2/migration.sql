/*
  Warnings:

  - Made the column `budget` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `locationId` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ministryId` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_locationId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_ministryId_fkey";

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "budget" SET NOT NULL,
ALTER COLUMN "locationId" SET NOT NULL,
ALTER COLUMN "ministryId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "Ministry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

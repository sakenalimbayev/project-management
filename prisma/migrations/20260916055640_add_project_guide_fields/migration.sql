-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('NEW_SYSTEM', 'MODERNIZATION', 'INTEGRATION', 'SERVICE_DIGITALIZATION', 'AI_SYSTEM', 'INFRASTRUCTURE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectScale" AS ENUM ('NATIONWIDE', 'MULTIPLE_REGIONS', 'SINGLE_REGION', 'SINGLE_LOCALITY');

-- CreateEnum
CREATE TYPE "FundingSource" AS ENUM ('REPUBLICAN_BUDGET', 'LOCAL_BUDGET', 'ORGANIZATION_FUNDS', 'PPP', 'GRANT', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectVisibility" AS ENUM ('DRAFT', 'IN_MODERATION', 'PUBLISHED', 'UNPUBLISHED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProjectStatus" ADD VALUE 'INITIATED';
ALTER TYPE "ProjectStatus" ADD VALUE 'DELAYED';
ALTER TYPE "ProjectStatus" ADD VALUE 'SUSPENDED';
ALTER TYPE "ProjectStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_locationId_fkey";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "actualEndDate" DATE,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "fundingSources" "FundingSource"[],
ADD COLUMN     "goal" TEXT,
ADD COLUMN     "infoAsOfDate" DATE,
ADD COLUMN     "nextUpdateDate" DATE,
ADD COLUMN     "officialContactEmail" TEXT,
ADD COLUMN     "plannedEndDate" DATE,
ADD COLUMN     "projectManagerName" TEXT,
ADD COLUMN     "projectType" "ProjectType",
ADD COLUMN     "responsibleOrganization" TEXT,
ADD COLUMN     "scale" "ProjectScale",
ADD COLUMN     "shortName" TEXT,
ADD COLUMN     "startDate" DATE,
ADD COLUMN     "visibility" "ProjectVisibility" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "locationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProjectDocument" ADD COLUMN     "documentType" TEXT;

-- CreateTable
CREATE TABLE "ProjectKpi" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baselineValue" TEXT NOT NULL,
    "targetValue" TEXT NOT NULL,
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectKpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectYearlyBudget" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "plannedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "actualAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectYearlyBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectKpi_projectId_idx" ON "ProjectKpi"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectYearlyBudget_projectId_year_key" ON "ProjectYearlyBudget"("projectId", "year");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectKpi" ADD CONSTRAINT "ProjectKpi_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectYearlyBudget" ADD CONSTRAINT "ProjectYearlyBudget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

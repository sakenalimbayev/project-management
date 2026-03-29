-- Rename budget to totalBudget and track spend
ALTER TABLE "Project" RENAME COLUMN "budget" TO "totalBudget";
ALTER TABLE "Project" ADD COLUMN "spentAmount" DECIMAL(15,2) NOT NULL DEFAULT 0;

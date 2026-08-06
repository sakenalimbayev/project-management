-- CreateEnum
CREATE TYPE "AuditLogAction" AS ENUM ('PROJECT_ATTRIBUTE_CHANGED', 'QUESTION_ADDED', 'QUESTION_ANSWERED');

-- CreateTable
CREATE TABLE "AuditLogEntry" (
    "id" TEXT NOT NULL,
    "action" "AuditLogAction" NOT NULL,
    "attribute" TEXT,
    "summary" TEXT NOT NULL,
    "actorLabel" TEXT NOT NULL,
    "actorId" TEXT,
    "projectId" TEXT NOT NULL,
    "questionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLogEntry_projectId_createdAt_idx" ON "AuditLogEntry"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLogEntry_action_createdAt_idx" ON "AuditLogEntry"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLogEntry_attribute_idx" ON "AuditLogEntry"("attribute");

-- AddForeignKey
ALTER TABLE "AuditLogEntry" ADD CONSTRAINT "AuditLogEntry_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogEntry" ADD CONSTRAINT "AuditLogEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogEntry" ADD CONSTRAINT "AuditLogEntry_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

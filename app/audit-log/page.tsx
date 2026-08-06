import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canViewAuditLog } from "@/lib/audit-log-auth";
import { AuditLogPageClient } from "@/components/audit-log/audit-log-page-client";

export default async function AuditLogPage() {
    const session = await auth();
    const userId = (session?.user as { id?: string })?.id;
    const globalRole = (session?.user as { role?: string })?.role;

    if (!(await canViewAuditLog(userId, globalRole))) {
        redirect("/");
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-6">
                    <Suspense>
                        <AuditLogPageClient />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

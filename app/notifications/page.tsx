import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NotificationsPageClient } from "@/components/notifications/notifications-page-client";

export default async function NotificationsPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/");
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-6">
                    <Suspense>
                        <NotificationsPageClient />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

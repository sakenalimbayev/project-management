import { auth } from "@/auth";
import { LoginDialog } from "../dialog/login-dialog";
import { UserPanelHeader } from "../user-panel-header/user-panel-header";
import { NotificationBell } from "./notification-bell";
import { ProjectSearch } from "./project-search";

export const Header = async () => {
  const session = await auth();
  const displayName =
    session?.user?.name || session?.user?.email?.split("@")[0] || "Гость";

  return (
    <div className="flex h-16 items-center gap-4 border-b px-6 bg-white">
      <div className="flex flex-1 justify-center">
        <ProjectSearch />
      </div>
      <div className="flex items-center gap-3">
        {session?.user ? (
          <>
            <NotificationBell userEmail={session.user.email} />
            <UserPanelHeader userName={displayName} />
          </>
        ) : (
          <LoginDialog />
        )}
      </div>
    </div>
  );
};

import { auth } from "@/auth";
import { Bell, Search } from "lucide-react";
import { Input } from "../ui/input";
import { LoginDialog } from "../dialog/login-dialog";
import { UserPanelHeader } from "../user-panel-header/user-panel-header";

export const Header = async () => {
  const session = await auth();
  const displayName =
    session?.user?.name || session?.user?.email?.split("@")[0] || "Гость";

  return (
    <div className="flex h-16 items-center gap-4 border-b px-6 bg-white">
      <div className="flex flex-1 justify-center">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            type="text"
            placeholder="Поиск по проектам..."
            className="h-10 rounded-full pl-9"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-accent"
          aria-label="Уведомления"
        >
          <Bell className="h-4 w-4" />
        </button>
        {session?.user ? (
          <UserPanelHeader userName={displayName} />
        ) : (
          <LoginDialog />
        )}
      </div>
    </div>
  );
};

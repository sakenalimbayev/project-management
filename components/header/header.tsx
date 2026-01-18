import { auth } from "@/auth";
import { FieldSet, FieldGroup, Field } from "../ui/field";
import { Input } from "../ui/input";
import { LoginDialog } from "../dialog/login-dialog";
import { UserPanelHeader } from "../user-panel-header/user-panel-header";
import { SidebarTrigger } from "../ui/sidebar";
import { Separator } from "../ui/separator";

export const Header = async () => {
  const session = await auth();
  return (
    <div className="flex h-16 items-center border-b px-4 relative justify-between bg-white">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
      </div>
      <div className="w-75">
        <FieldSet>
          <FieldGroup>
            <Field>
              <Input id="search" type="text" placeholder="Search anything..." />
            </Field>
          </FieldGroup>
        </FieldSet>
      </div>
      <div>
        {session?.user ? (
          <UserPanelHeader userName={session.user.name || ""} />
        ) : (
          <LoginDialog />
        )}
      </div>
    </div>
  );
};

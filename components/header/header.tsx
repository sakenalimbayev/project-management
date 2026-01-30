import { auth } from "@/auth";
import { FieldSet, FieldGroup, Field } from "../ui/field";
import { Input } from "../ui/input";
import { LoginDialog } from "../dialog/login-dialog";
import { UserPanelHeader } from "../user-panel-header/user-panel-header";

export const Header = async () => {
  const session = await auth();
  return (
    <div className="flex h-16 items-center border-b px-4 relative justify-between bg-white">
      <div className="w-75 m-auto">
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

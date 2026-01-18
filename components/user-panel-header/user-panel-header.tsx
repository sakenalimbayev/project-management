"use client";

import { signOut } from "next-auth/react";
import { Button } from "../ui/button";
import { FC } from "react";

export type UserPanelHeaderProps = {
  userName: string;
};

export const UserPanelHeader: FC<UserPanelHeaderProps> = ({ userName }) => {
  return (
    <div className="flex items-center gap-4">
      <span>Welcome, {userName}</span>
      <Button variant="outline" type="button" onClick={() => signOut()}>
        Logout
      </Button>
    </div>
  );
};

"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "../ui/button";
import { FC } from "react";

export type UserPanelHeaderProps = {
  userName: string;
};

export const UserPanelHeader: FC<UserPanelHeaderProps> = ({ userName }) => {
  return (
    <div className="flex items-center gap-4">
      <span>Welcome, {userName}</span>
      <Button variant="outline" type="button" asChild>
        <Link href="/profile">Profile</Link>
      </Button>
      <Button variant="outline" type="button" onClick={() => signOut()}>
        Logout
      </Button>
    </div>
  );
};

"use client";

import { createContext, useContext, ReactNode } from "react";

export interface CurrentUserData {
  employeeId: number;
  clerkUserId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  isOwner: boolean;
  membershipRole: "OWNER" | "ADMIN" | "MEMBER";
  role: {
    id: number;
    name: string;
    label: string;
  };
  organization: {
    id: string;
    slug: string;
    name: string;
    plan: "FREE" | "STARTER" | "TEAM";
    status: "ACTIVE" | "SUSPENDED" | "CANCELLED" | "TRIAL";
    seatLimit: number;
    trialEndsAt: string | null;
    memberCount: number;
  };
}

const CurrentUserContext = createContext<CurrentUserData | null>(null);

export function CurrentUserProvider({
  user,
  children,
}: {
  user: CurrentUserData;
  children: ReactNode;
}) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): CurrentUserData {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  }
  return ctx;
}

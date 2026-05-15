import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      roleLabel: string;
      permissions: Record<string, unknown>;
      department?: string | null;
      avatarUrl?: string | null;
      locale?: string;
    };
  }

  interface User {
    id: string;
    role: string;
    roleLabel: string;
    permissions: Record<string, unknown>;
    department?: string | null;
    avatarUrl?: string | null;
    status: string;
    locale?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    roleLabel: string;
    permissions: Record<string, unknown>;
    department?: string | null;
    avatarUrl?: string | null;
    status: string;
    locale?: string;
  }
}

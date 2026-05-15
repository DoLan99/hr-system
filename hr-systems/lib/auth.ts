import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 giờ
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const employee = await prisma.employee.findUnique({
          where: { emailCompany: credentials.email },
          include: { role: true },
        });

        if (!employee || employee.status === "INACTIVE") return null;

        const isValid = await bcrypt.compare(credentials.password, employee.passwordHash);
        if (!isValid) return null;

        return {
          id: String(employee.id),
          email: employee.emailCompany,
          name: employee.fullName,
          role: employee.role.name,
          roleLabel: employee.role.label,
          permissions: (employee.role.permissions ?? {}) as Record<string, unknown>,
          department: employee.department,
          avatarUrl: employee.avatarUrl,
          status: employee.status,
          locale: (employee as any).locale ?? "en",
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.roleLabel = (user as any).roleLabel;
        token.permissions = (user as any).permissions;
        token.department = (user as any).department;
        token.avatarUrl = (user as any).avatarUrl;
        token.status = (user as any).status;
        token.locale = (user as any).locale ?? "en";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.roleLabel = token.roleLabel;
        session.user.permissions = token.permissions;
        session.user.department = token.department;
        session.user.avatarUrl = token.avatarUrl;
        session.user.locale = token.locale as string ?? "en";
      }
      return session;
    },
  },
};

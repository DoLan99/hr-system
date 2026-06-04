import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const existing = await prisma.employee.findFirst({
    where: { clerkUserId: user.id },
  });

  if (existing) {
    redirect("/welcome");
  }

  const defaultName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username ||
    undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
        <OnboardingForm defaultName={defaultName} />
      </div>
    </div>
  );
}

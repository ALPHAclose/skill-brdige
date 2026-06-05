import type { User } from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function displayName(user: Pick<User, "email" | "firstName" | "lastName"> | null | undefined) {
  if (!user) return "Unknown user";

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email;
}

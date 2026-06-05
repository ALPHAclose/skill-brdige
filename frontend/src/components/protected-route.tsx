"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { useAuthStore } from "@/store/auth-store";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.tokens?.accessToken);

  useEffect(() => {
    if (hasHydrated && !accessToken) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [accessToken, hasHydrated, pathname, router]);

  if (!hasHydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-700">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      </main>
    );
  }

  if (!accessToken) return null;

  return children;
}

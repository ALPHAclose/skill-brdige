"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { ApiError, login } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const accessToken = useAuthStore((state) => state.tokens?.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [nextPath, setNextPath] = useState("/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next?.startsWith("/")) {
      setNextPath(next);
    }
  }, []);

  useEffect(() => {
    if (hasHydrated && accessToken) {
      router.replace(nextPath);
    }
  }, [accessToken, hasHydrated, nextPath, router]);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (payload) => {
      setSession(payload);
      router.replace(nextPath);
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({
      email,
      password
    });
  };

  const errorMessage = mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <main className="grid min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:place-items-center">
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-soft">
        <div className="mb-8">
          <div className="mb-5 grid h-12 w-12 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white">SB</div>
          <h1 className="text-2xl font-semibold text-zinc-950">Login</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          {errorMessage ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p> : null}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            Login
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-600">
          New here?{" "}
          <Link href="/register" className="font-medium text-emerald-700 hover:text-emerald-800">
            Register
          </Link>
        </p>
      </section>
    </main>
  );
}

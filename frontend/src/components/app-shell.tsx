"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  BookOpen,
  Check,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";

import { getCurrentUser, listNotifications, logout, markNotificationAsRead } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Notification } from "@/lib/types";
import { cn, displayName, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationStore } from "@/store/notification-store";
import { SocketBridge } from "@/components/socket-bridge";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/reports", label: "Reports", icon: BarChart3 }
];

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const tokens = useAuthStore((state) => state.tokens);
  const onlineCount = useNotificationStore((state) => state.onlineCount);
  const socketStatus = useNotificationStore((state) => state.socketStatus);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    },
    enabled: Boolean(tokens?.accessToken)
  });

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications({ page: 1, limit: 20 }),
    queryFn: () => listNotifications({ page: 1, limit: 20 }),
    enabled: Boolean(tokens?.accessToken)
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: (notification) => {
      queryClient.setQueriesData<{ items: Notification[] }>({ queryKey: ["notifications"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item) => (item.id === notification.id ? notification : item))
        };
      });
    }
  });

  const unreadCount = useMemo(
    () => notificationsQuery.data?.items.filter((notification) => !notification.isRead).length ?? 0,
    [notificationsQuery.data]
  );

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <SocketBridge />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-zinc-200 bg-white px-4 py-5 transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              SB
            </span>
            <span>
              <span className="block text-base font-semibold">SkillBridge</span>
              <span className="block text-xs text-zinc-500">{user?.role ?? "STUDENT"}</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close navigation"
            title="Close navigation"
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <Users className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            {onlineCount} online
          </div>
          <div className="mt-2 text-xs uppercase tracking-wide text-zinc-500">{socketStatus}</div>
        </div>
      </aside>

      {mobileOpen ? <div className="fixed inset-0 z-30 bg-zinc-950/30 lg:hidden" onClick={() => setMobileOpen(false)} /> : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              aria-label="Open navigation"
              title="Open navigation"
              className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900">{displayName(user)}</p>
              <p className="truncate text-xs text-zinc-500">{user?.email}</p>
            </div>

            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                title="Notifications"
                className="relative rounded-md border border-zinc-200 bg-white p-2 text-zinc-700 shadow-sm hover:bg-zinc-50"
                onClick={() => setNotificationsOpen((value) => !value)}
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-semibold text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </button>

              {notificationsOpen ? (
                <div className="absolute right-0 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-zinc-200 bg-white p-3 shadow-soft">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-900">Notifications</p>
                    <button
                      type="button"
                      aria-label="Close notifications"
                      title="Close notifications"
                      className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="max-h-96 space-y-2 overflow-auto">
                    {notificationsQuery.data?.items.length ? (
                      notificationsQuery.data.items.map((notification) => (
                        <div key={notification.id} className="rounded-lg border border-zinc-200 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-zinc-900">{notification.title}</p>
                              <p className="mt-1 text-sm text-zinc-600">{notification.message}</p>
                              <p className="mt-2 text-xs text-zinc-500">{formatDate(notification.createdAt)}</p>
                            </div>
                            {!notification.isRead ? (
                              <button
                                type="button"
                                aria-label="Mark as read"
                                title="Mark as read"
                                className="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => markReadMutation.mutate(notification.id)}
                              >
                                <Check className="h-4 w-4" aria-hidden="true" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">No notifications</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
              onClick={() => void handleLogout()}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

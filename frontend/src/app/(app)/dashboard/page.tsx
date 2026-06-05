"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BarChart3, Bell, BookOpen, Loader2, Users } from "lucide-react";
import Link from "next/link";

import { listNotifications, listUsers } from "@/lib/api-client";
import { getMyCourses, getReports } from "@/lib/graphql-client";
import { queryKeys } from "@/lib/query-keys";
import { displayName, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationStore } from "@/store/notification-store";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const onlineCount = useNotificationStore((state) => state.onlineCount);
  const latestCourseEvent = useNotificationStore((state) => state.latestCourseEvent);
  const isReportsUser = user?.role === "ADMIN" || user?.role === "INSTRUCTOR";

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications({ page: 1, limit: 5 }),
    queryFn: () => listNotifications({ page: 1, limit: 5 })
  });

  const myCoursesQuery = useQuery({
    queryKey: queryKeys.myCourses,
    queryFn: getMyCourses
  });

  const reportsQuery = useQuery({
    queryKey: queryKeys.reports,
    queryFn: getReports,
    enabled: isReportsUser
  });

  const usersQuery = useQuery({
    queryKey: queryKeys.users({ page: 1, limit: 5 }),
    queryFn: () => listUsers({ page: 1, limit: 5 }),
    enabled: user?.role === "ADMIN"
  });

  const unreadCount = notificationsQuery.data?.items.filter((notification) => !notification.isRead).length ?? 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">{user?.role}</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-950 sm:text-3xl">{displayName(user)}</h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm">
          <span className="font-semibold text-zinc-950">{onlineCount}</span> online
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BookOpen} label="My courses" value={myCoursesQuery.data?.length ?? 0} loading={myCoursesQuery.isLoading} />
        <MetricCard icon={Bell} label="Unread" value={unreadCount} loading={notificationsQuery.isLoading} />
        <MetricCard icon={BarChart3} label="Reports" value={reportsQuery.data?.length ?? 0} loading={reportsQuery.isLoading && isReportsUser} />
        <MetricCard icon={Users} label="Users" value={usersQuery.data?.pagination.total ?? 0} loading={usersQuery.isLoading && user?.role === "ADMIN"} />
      </section>

      {latestCourseEvent?.courseId ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Course enrollment received for <span className="font-semibold">{latestCourseEvent.courseId}</span>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-950">My courses</h2>
            <Link href="/courses" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
              Open
            </Link>
          </div>

          {myCoursesQuery.isLoading ? (
            <LoadingRow />
          ) : myCoursesQuery.isError ? (
            <ErrorRow message="Courses unavailable" />
          ) : myCoursesQuery.data?.length ? (
            <div className="space-y-2">
              {myCoursesQuery.data.slice(0, 5).map((course) => (
                <div key={course.id} className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-zinc-950">{course.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{course.description ?? "No description"}</p>
                    </div>
                    <span className="w-fit rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                      {course.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyRow label="No courses" />
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-950">Notifications</h2>
            <span className="text-sm text-zinc-500">{notificationsQuery.data?.pagination.total ?? 0}</span>
          </div>

          {notificationsQuery.isLoading ? (
            <LoadingRow />
          ) : notificationsQuery.isError ? (
            <ErrorRow message="Notifications unavailable" />
          ) : notificationsQuery.data?.items.length ? (
            <div className="space-y-2">
              {notificationsQuery.data.items.map((notification) => (
                <div key={notification.id} className="rounded-lg border border-zinc-200 p-3">
                  <p className="text-sm font-medium text-zinc-950">{notification.title}</p>
                  <p className="mt-1 text-sm text-zinc-600">{notification.message}</p>
                  <p className="mt-2 text-xs text-zinc-500">{formatDate(notification.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyRow label="No notifications" />
          )}
        </div>
      </section>

      {user?.role === "ADMIN" ? (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-950">Users</h2>
            <span className="text-sm text-zinc-500">{usersQuery.data?.pagination.total ?? 0}</span>
          </div>

          {usersQuery.isLoading ? (
            <LoadingRow />
          ) : usersQuery.isError ? (
            <ErrorRow message="Users unavailable" />
          ) : usersQuery.data?.items.length ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {usersQuery.data.items.map((item) => (
                <div key={item.id} className="rounded-lg border border-zinc-200 p-3">
                  <p className="text-sm font-medium text-zinc-950">{displayName(item)}</p>
                  <p className="mt-1 text-sm text-zinc-600">{item.email}</p>
                  <p className="mt-2 text-xs font-medium uppercase text-zinc-500">{item.role}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyRow label="No users" />
          )}
        </section>
      ) : null}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  loading
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-950">{loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : value}</p>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      Loading
    </div>
  );
}

function ErrorRow({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      {message}
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">{label}</p>;
}

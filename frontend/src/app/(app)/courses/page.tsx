"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, Eye, Loader2, Plus, Radio, Send, ToggleLeft, ToggleRight } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { ApiError } from "@/lib/api-client";
import { createCourse, enrollCourse, getCourses, getMyCourses, getReports, publishCourse, trackEvent } from "@/lib/graphql-client";
import { queryKeys } from "@/lib/query-keys";
import type { Course, Report } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const canCreate = user?.role === "ADMIN" || user?.role === "INSTRUCTOR";
  const canViewReports = user?.role === "ADMIN" || user?.role === "INSTRUCTOR";

  const coursesQuery = useQuery({
    queryKey: queryKeys.courses,
    queryFn: getCourses
  });

  const myCoursesQuery = useQuery({
    queryKey: queryKeys.myCourses,
    queryFn: getMyCourses
  });

  const reportsQuery = useQuery({
    queryKey: queryKeys.reports,
    queryFn: getReports,
    enabled: canViewReports
  });

  const myCourseIds = useMemo(() => new Set(myCoursesQuery.data?.map((course) => course.id) ?? []), [myCoursesQuery.data]);
  const reportsByCourseId = useMemo(() => {
    return (reportsQuery.data ?? []).reduce<Record<string, Report[]>>((groups, report) => {
      groups[report.courseId] = [...(groups[report.courseId] ?? []), report];
      return groups;
    }, {});
  }, [reportsQuery.data]);

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: async () => {
      setTitle("");
      setDescription("");
      setActionMessage("Course created");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.courses }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myCourses })
      ]);
    }
  });

  const publishMutation = useMutation({
    mutationFn: publishCourse,
    onSuccess: async (course) => {
      setActionMessage(course.isPublished ? "Course published" : "Course unpublished");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.courses }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myCourses })
      ]);
    }
  });

  const enrollMutation = useMutation({
    mutationFn: enrollCourse,
    onSuccess: async () => {
      setActionMessage("Enrollment saved");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.courses }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myCourses }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
      ]);
    }
  });

  const trackMutation = useMutation({
    mutationFn: trackEvent,
    onSuccess: async (_event, variables) => {
      setActionMessage("Course view tracked");
      if (variables.courseId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.courseAnalytics(variables.courseId) });
      }
    }
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate({
      title,
      description: description.trim() || undefined
    });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">Courses</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-950 sm:text-3xl">Course catalog</h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm">
          <span className="font-semibold text-zinc-950">{coursesQuery.data?.length ?? 0}</span> available
        </div>
      </section>

      {canCreate ? (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            <h2 className="text-base font-semibold text-zinc-950">Create course</h2>
          </div>

          <form className="grid gap-4 lg:grid-cols-[1fr_1.4fr_auto]" onSubmit={handleCreate}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-700">Title</span>
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-700">Description</span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 lg:w-auto"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                Create
              </button>
            </div>
          </form>

          <MutationMessage error={createMutation.error} />
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {actionMessage ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {actionMessage}
            </p>
          ) : null}

          {coursesQuery.isLoading ? (
            <LoadingPanel label="Loading courses" />
          ) : coursesQuery.isError ? (
            <ErrorPanel message={errorText(coursesQuery.error, "Courses unavailable")} />
          ) : coursesQuery.data?.length ? (
            coursesQuery.data.map((course) => (
              <CourseItem
                key={course.id}
                course={course}
                isMine={myCourseIds.has(course.id)}
                isEnrolled={course.enrollments.some((enrollment) => enrollment.userId === user?.id)}
                canPublish={user?.role === "ADMIN" || course.instructorId === user?.id}
                canEnroll={user?.role === "STUDENT" && course.isPublished && !course.enrollments.some((enrollment) => enrollment.userId === user?.id)}
                reports={reportsByCourseId[course.id] ?? []}
                showReports={canViewReports}
                publishPending={publishMutation.isPending}
                enrollPending={enrollMutation.isPending}
                trackPending={trackMutation.isPending}
                onPublish={() => publishMutation.mutate({ id: course.id, publish: !course.isPublished })}
                onEnroll={() => enrollMutation.mutate(course.id)}
                onTrack={() =>
                  trackMutation.mutate({
                    courseId: course.id,
                    eventType: "course_viewed",
                    metadata: { source: "courses" }
                  })
                }
              />
            ))
          ) : (
            <EmptyPanel label="No courses" />
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            <h2 className="text-base font-semibold text-zinc-950">My courses</h2>
          </div>

          {myCoursesQuery.isLoading ? (
            <LoadingPanel label="Loading my courses" />
          ) : myCoursesQuery.isError ? (
            <ErrorPanel message={errorText(myCoursesQuery.error, "My courses unavailable")} />
          ) : myCoursesQuery.data?.length ? (
            <div className="space-y-2">
              {myCoursesQuery.data.map((course) => (
                <div key={course.id} className="rounded-lg border border-zinc-200 p-3">
                  <p className="text-sm font-medium text-zinc-950">{course.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {course.isPublished ? "Published" : "Draft"}
                    {canViewReports ? ` · ${reportsByCourseId[course.id]?.length ?? 0} reports` : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel label="No courses" />
          )}
        </div>
      </section>

      <MutationMessage error={publishMutation.error ?? enrollMutation.error ?? trackMutation.error} />
    </div>
  );
}

function CourseItem({
  course,
  isMine,
  isEnrolled,
  canPublish,
  canEnroll,
  reports,
  showReports,
  publishPending,
  enrollPending,
  trackPending,
  onPublish,
  onEnroll,
  onTrack
}: {
  course: Course;
  isMine: boolean;
  isEnrolled: boolean;
  canPublish: boolean;
  canEnroll: boolean;
  reports: Report[];
  showReports: boolean;
  publishPending: boolean;
  enrollPending: boolean;
  trackPending: boolean;
  onPublish: () => void;
  onEnroll: () => void;
  onTrack: () => void;
}) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-950">{course.title}</h2>
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
              {course.isPublished ? "Published" : "Draft"}
            </span>
            {isMine ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Mine
              </span>
            ) : null}
            {isEnrolled ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Enrolled
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-zinc-600">{course.description ?? "No description"}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
            <span>{course.enrollments.length} enrolled</span>
            <span>Created {formatDate(course.createdAt)}</span>
            {showReports ? <span>{reports.length} reports</span> : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <button
            type="button"
            disabled={trackPending}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            onClick={onTrack}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Viewed
          </button>

          {canEnroll ? (
            <button
              type="button"
              disabled={enrollPending}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              onClick={onEnroll}
            >
              {enrollPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              Enroll
            </button>
          ) : null}

          {canPublish ? (
            <button
              type="button"
              disabled={publishPending}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              onClick={onPublish}
            >
              {course.isPublished ? <ToggleRight className="h-4 w-4 text-emerald-700" aria-hidden="true" /> : <ToggleLeft className="h-4 w-4" aria-hidden="true" />}
              {course.isPublished ? "Unpublish" : "Publish"}
            </button>
          ) : null}
        </div>
      </div>

      {showReports && reports.length ? (
        <div className="mt-4 border-t border-zinc-200 pt-4">
          <p className="mb-2 text-sm font-semibold text-zinc-950">Reports for this course</p>
          <div className="grid gap-2 md:grid-cols-2">
            {reports.slice(0, 4).map((report) => {
              const content = typeof report.data.content === "string" ? report.data.content : "";
              return (
                <div key={report.id} className="rounded-lg border border-zinc-200 p-3">
                  <p className="text-sm font-medium text-zinc-950">{report.title}</p>
                  {content ? <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{content}</p> : null}
                  <p className="mt-2 text-xs text-zinc-500">{formatDate(report.createdAt)}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500">{label}</p>;
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      <Radio className="h-4 w-4" aria-hidden="true" />
      {message}
    </div>
  );
}

function MutationMessage({ error }: { error: unknown }) {
  if (!error) return null;
  return <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorText(error, "Request failed")}</p>;
}

function errorText(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return fallback;
}

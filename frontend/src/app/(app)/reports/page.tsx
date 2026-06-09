"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, FilePlus2, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { ApiError } from "@/lib/api-client";
import { deleteReport, generateReport, getCourseAnalytics, getMyCourses, getReports, trackEvent } from "@/lib/graphql-client";
import { queryKeys } from "@/lib/query-keys";
import type { AnalyticsEvent, Report } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const canUseReports = user?.role === "ADMIN" || user?.role === "INSTRUCTOR";

  const coursesQuery = useQuery({
    queryKey: queryKeys.myCourses,
    queryFn: getMyCourses,
    enabled: canUseReports
  });

  const reportsQuery = useQuery({
    queryKey: queryKeys.reports,
    queryFn: getReports,
    enabled: canUseReports
  });

  useEffect(() => {
    if (!selectedCourseId && coursesQuery.data?.length) {
      setSelectedCourseId(coursesQuery.data[0].id);
    }
  }, [coursesQuery.data, selectedCourseId]);

  const analyticsQuery = useQuery({
    queryKey: queryKeys.courseAnalytics(selectedCourseId || null),
    queryFn: () => getCourseAnalytics(selectedCourseId),
    enabled: canUseReports && Boolean(selectedCourseId)
  });

  const generateMutation = useMutation({
    mutationFn: generateReport,
    onSuccess: async () => {
      setReportTitle("");
      setReportContent("");
      setActionMessage("Report generated");
      await queryClient.invalidateQueries({ queryKey: queryKeys.reports });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReport,
    onSuccess: async () => {
      setActionMessage("Report deleted");
      await queryClient.invalidateQueries({ queryKey: queryKeys.reports });
    }
  });

  const analysisMutation = useMutation({
    mutationFn: trackEvent,
    onSuccess: async () => {
      setActionMessage("Analysis created");
      await queryClient.invalidateQueries({ queryKey: queryKeys.courseAnalytics(selectedCourseId || null) });
    }
  });

  const selectedCourse = useMemo(
    () => coursesQuery.data?.find((course) => course.id === selectedCourseId),
    [coursesQuery.data, selectedCourseId]
  );

  const handleGenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCourseId) return;

    generateMutation.mutate({
      courseId: selectedCourseId,
      title: reportTitle.trim() || `${selectedCourse?.title ?? "Course"} report`,
      content: reportContent.trim() || undefined
    });
  };

  if (!canUseReports) {
    return (
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">Reports</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-950 sm:text-3xl">Reports</h1>
        <p className="mt-4 text-sm text-zinc-600">Reports are available for instructors and admins.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">Reports</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-950 sm:text-3xl">Reports and analytics</h1>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm">
          <span className="font-semibold text-zinc-950">{reportsQuery.data?.length ?? 0}</span> reports
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FilePlus2 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-zinc-950">Generate report</h2>
        </div>

        <form className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]" onSubmit={handleGenerate}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">Course</span>
            <select
              required
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              {coursesQuery.data?.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">Title</span>
            <input
              value={reportTitle}
              onChange={(event) => setReportTitle(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700">Report content</span>
            <textarea
              value={reportContent}
              onChange={(event) => setReportContent(event.target.value)}
              rows={4}
              placeholder="Write your report summary, recommendations, or notes for this course."
              className="w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={generateMutation.isPending || !selectedCourseId}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 lg:w-auto"
            >
              {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FilePlus2 className="h-4 w-4" aria-hidden="true" />}
              Generate
            </button>
          </div>
        </form>

        {actionMessage ? (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{actionMessage}</p>
        ) : null}
        <MutationMessage error={generateMutation.error} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-950">Reports</h2>
            {reportsQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin text-zinc-500" aria-hidden="true" /> : null}
          </div>

          {reportsQuery.isError ? (
            <ErrorPanel message={errorText(reportsQuery.error, "Reports unavailable")} />
          ) : reportsQuery.data?.length ? (
            <div className="space-y-3">
              {reportsQuery.data.map((report) => (
                <ReportItem
                  key={report.id}
                  report={report}
                  deleting={deleteMutation.isPending}
                  onDelete={() => deleteMutation.mutate(report.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyPanel label="No reports" />
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-zinc-950">Analytics</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!selectedCourseId || analysisMutation.isPending}
                onClick={() =>
                  analysisMutation.mutate({
                    courseId: selectedCourseId,
                    eventType: "manual_analysis",
                    metadata: { source: "reports", courseTitle: selectedCourse?.title ?? null }
                  })
                }
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {analysisMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
                Make analysis
              </button>
              <button
                type="button"
                disabled={!selectedCourseId || analyticsQuery.isFetching}
                onClick={() => void analyticsQuery.refetch()}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={analyticsQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
                Refresh
              </button>
            </div>
          </div>

          {analyticsQuery.isLoading ? (
            <LoadingPanel label="Loading analytics" />
          ) : analyticsQuery.isError ? (
            <ErrorPanel message={errorText(analyticsQuery.error, "Analytics unavailable")} />
          ) : analyticsQuery.data?.length ? (
            <AnalyticsList items={analyticsQuery.data} />
          ) : (
            <EmptyPanel label="No analytics" />
          )}
        </div>
      </section>

      <MutationMessage error={deleteMutation.error ?? analysisMutation.error} />
    </div>
  );
}

function ReportItem({ report, deleting, onDelete }: { report: Report; deleting: boolean; onDelete: () => void }) {
  const enrollmentCount = numberValue(report.data.enrollment_count);
  const eventCount = numberValue(report.data.total_analytics_events);
  const content = typeof report.data.content === "string" ? report.data.content : "";

  return (
    <article className="rounded-lg border border-zinc-200 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium text-zinc-950">{report.title}</p>
          <p className="mt-1 text-sm text-zinc-600">{String(report.data.course_title ?? report.courseId)}</p>
          {content ? <p className="mt-2 text-sm text-zinc-700">{content}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
            <span>{enrollmentCount} enrollments</span>
            <span>{eventCount} events</span>
            <span>{formatDate(report.createdAt)}</span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Delete report"
          title="Delete report"
          disabled={deleting}
          className="inline-flex w-fit items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          onClick={onDelete}
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
          Delete
        </button>
      </div>
    </article>
  );
}

function AnalyticsList({ items }: { items: AnalyticsEvent[] }) {
  const grouped = items.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.eventType] = (accumulator[item.eventType] ?? 0) + 1;
    return accumulator;
  }, {});
  const uniqueUsers = new Set(items.map((item) => item.userId).filter(Boolean)).size;
  const latestEvent = [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 p-3">
          <p className="text-sm font-medium text-zinc-950">Total events</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-950">{items.length}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-3">
          <p className="text-sm font-medium text-zinc-950">Active users</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-950">{uniqueUsers}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-3">
          <p className="text-sm font-medium text-zinc-950">Latest</p>
          <p className="mt-1 text-sm text-zinc-600">{latestEvent ? latestEvent.eventType : "None"}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(grouped).map(([eventType, count]) => (
          <div key={eventType} className="rounded-lg border border-zinc-200 p-3">
            <p className="text-sm font-medium text-zinc-950">{eventType}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-950">{count}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {items.slice(0, 8).map((item) => (
          <div key={item.id} className="rounded-lg border border-zinc-200 p-3">
            <p className="text-sm font-medium text-zinc-950">{item.eventType}</p>
            <p className="mt-1 text-xs text-zinc-500">{formatDate(item.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">{label}</p>;
}

function ErrorPanel({ message }: { message: string }) {
  return <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{message}</p>;
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

function numberValue(value: unknown) {
  return typeof value === "number" ? value : 0;
}

export const queryKeys = {
  me: ["auth", "me"] as const,
  notifications: (params?: { page?: number; limit?: number; isRead?: boolean }) =>
    ["notifications", params ?? {}] as const,
  users: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
    ["users", params ?? {}] as const,
  courses: ["graphql", "courses"] as const,
  myCourses: ["graphql", "my-courses"] as const,
  reports: ["graphql", "reports"] as const,
  courseAnalytics: (courseId: string | null) => ["graphql", "course-analytics", courseId] as const
};

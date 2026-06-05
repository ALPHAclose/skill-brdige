export type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT";

export type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: string;
};

export type AuthPayload = {
  user: User;
  tokens: TokenPair;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationList = {
  items: Notification[];
  pagination: Pagination;
};

export type UserList = {
  items: User[];
  pagination: Pagination;
};

export type Enrollment = {
  id: string;
  courseId: string;
  userId: string;
  enrolledAt: string;
};

export type Course = {
  id: string;
  title: string;
  description: string | null;
  instructorId: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  enrollments: Enrollment[];
};

export type AnalyticsEvent = {
  id: string;
  courseId: string | null;
  userId: string | null;
  eventType: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type Report = {
  id: string;
  title: string;
  courseId: string;
  generatedBy: string;
  data: Record<string, unknown>;
  createdAt: string;
};

export type CourseEnrolledEvent = {
  userId?: string;
  role?: Role;
  courseId?: string;
  [key: string]: unknown;
};

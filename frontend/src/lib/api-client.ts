import { useAuthStore } from "@/store/auth-store";
import type { AuthPayload, Notification, NotificationList, User, UserList } from "@/lib/types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    statusCode?: number;
    details?: unknown;
  };
};

type ApiRequestInit = RequestInit & {
  auth?: boolean;
  retry?: boolean;
};

export class ApiError extends Error {
  statusCode?: number;
  details?: unknown;

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { auth = true, retry = true, headers: initHeaders, ...requestInit } = init;
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type") && requestInit.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = useAuthStore.getState().tokens?.accessToken;
  if (auth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestInit,
    headers
  });

  if (response.status === 401 && auth && retry) {
    const refreshedToken = await refreshSession();
    if (refreshedToken) {
      return apiRequest<T>(path, { ...init, retry: false });
    }
  }

  const envelope = await readEnvelope<T>(response);

  if (!response.ok || envelope.success === false) {
    throw new ApiError(
      envelope.error?.message ?? response.statusText,
      envelope.error?.statusCode ?? response.status,
      envelope.error?.details
    );
  }

  return envelope.data as T;
}

export async function refreshSession() {
  const refreshToken = useAuthStore.getState().tokens?.refreshToken;
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ refreshToken })
  });

  const envelope = await readEnvelope<AuthPayload>(response);

  if (!response.ok || envelope.success === false || !envelope.data) {
    useAuthStore.getState().clearSession();
    return null;
  }

  useAuthStore.getState().setSession(envelope.data);
  return envelope.data.tokens.accessToken;
}

export async function login(input: { email: string; password: string }) {
  return apiRequest<AuthPayload>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify(input)
  });
}

export async function register(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: "INSTRUCTOR" | "STUDENT";
}) {
  return apiRequest<AuthPayload>("/auth/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify(input)
  });
}

export async function logout() {
  const refreshToken = useAuthStore.getState().tokens?.refreshToken;

  try {
    await apiRequest<undefined>("/auth/logout", {
      method: "POST",
      retry: false,
      body: JSON.stringify({ refreshToken })
    });
  } finally {
    useAuthStore.getState().clearSession();
  }
}

export async function getCurrentUser() {
  const data = await apiRequest<{ user: User }>("/auth/me");
  return data.user;
}

export async function listNotifications(params: { page?: number; limit?: number; isRead?: boolean } = {}) {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 20));
  if (typeof params.isRead === "boolean") {
    query.set("isRead", String(params.isRead));
  }

  return apiRequest<NotificationList>(`/notifications?${query.toString()}`);
}

export async function markNotificationAsRead(notificationId: string) {
  const data = await apiRequest<{ notification: Notification }>(`/notifications/${notificationId}/read`, {
    method: "PUT"
  });
  return data.notification;
}

export async function deleteNotification(notificationId: string) {
  return apiRequest<undefined>(`/notifications/${notificationId}`, {
    method: "DELETE"
  });
}

export async function listUsers(params: { page?: number; limit?: number; role?: string; search?: string } = {}) {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 20));
  if (params.role) query.set("role", params.role);
  if (params.search) query.set("search", params.search);

  return apiRequest<UserList>(`/users?${query.toString()}`);
}

async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const text = await response.text();
  if (!text) {
    return { success: response.ok };
  }

  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    return {
      success: false,
      error: {
        message: text,
        statusCode: response.status
      }
    };
  }
}

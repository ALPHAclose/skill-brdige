"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io } from "socket.io-client";

import { API_BASE_URL } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { CourseEnrolledEvent, Notification, NotificationList } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationStore } from "@/store/notification-store";

export function SocketBridge() {
  const accessToken = useAuthStore((state) => state.tokens?.accessToken);
  const queryClient = useQueryClient();
  const setOnlineCount = useNotificationStore((state) => state.setOnlineCount);
  const setSocketStatus = useNotificationStore((state) => state.setSocketStatus);
  const setLatestCourseEvent = useNotificationStore((state) => state.setLatestCourseEvent);

  useEffect(() => {
    if (!accessToken) {
      setSocketStatus("idle");
      return;
    }

    setSocketStatus("connecting");

    const socket = io(API_BASE_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      query: {
        access_token: accessToken
      }
    });

    socket.on("connect", () => {
      setSocketStatus("connected");
      socket.emit("presence:ping", (response: { onlineCount: number }) => {
        setOnlineCount(response.onlineCount);
      });
    });

    socket.on("disconnect", () => {
      setSocketStatus("disconnected");
    });

    socket.on("connect_error", () => {
      setSocketStatus("error");
    });

    socket.on("online:update", (data: { onlineCount: number }) => {
      setOnlineCount(data.onlineCount);
    });

    socket.on("notification:new", (notification: Notification) => {
      queryClient.setQueriesData<NotificationList>({ queryKey: ["notifications"] }, (old) => {
        if (!old) return old;
        const exists = old.items.some((item) => item.id === notification.id);
        const items = exists
          ? old.items.map((item) => (item.id === notification.id ? notification : item))
          : [notification, ...old.items].slice(0, old.pagination.limit);

        return {
          items,
          pagination: {
            ...old.pagination,
            total: exists ? old.pagination.total : old.pagination.total + 1
          }
        };
      });
    });

    socket.on("notification:read", (notification: Notification) => {
      queryClient.setQueriesData<NotificationList>({ queryKey: ["notifications"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item) => (item.id === notification.id ? notification : item))
        };
      });
    });

    socket.on("course:enrolled", (payload: CourseEnrolledEvent) => {
      setLatestCourseEvent(payload);
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myCourses });
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, queryClient, setLatestCourseEvent, setOnlineCount, setSocketStatus]);

  return null;
}

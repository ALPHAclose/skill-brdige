"use client";

import { create } from "zustand";

import type { CourseEnrolledEvent } from "@/lib/types";

type SocketStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

type NotificationState = {
  onlineCount: number;
  socketStatus: SocketStatus;
  latestCourseEvent: CourseEnrolledEvent | null;
  setOnlineCount: (onlineCount: number) => void;
  setSocketStatus: (socketStatus: SocketStatus) => void;
  setLatestCourseEvent: (latestCourseEvent: CourseEnrolledEvent | null) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  onlineCount: 0,
  socketStatus: "idle",
  latestCourseEvent: null,
  setOnlineCount: (onlineCount) => set({ onlineCount }),
  setSocketStatus: (socketStatus) => set({ socketStatus }),
  setLatestCourseEvent: (latestCourseEvent) => set({ latestCourseEvent })
}));

import { API_BASE_URL, ApiError, refreshSession } from "@/lib/api-client";
import type { AnalyticsEvent, Course, Enrollment, Report } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";

type GraphQLErrorPayload = {
  message: string;
};

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: GraphQLErrorPayload[];
};

const COURSE_FIELDS = `
  id
  title
  description
  instructorId
  isPublished
  createdAt
  updatedAt
  enrollments {
    id
    courseId
    userId
    enrolledAt
  }
`;

const REPORT_FIELDS = `
  id
  title
  courseId
  generatedBy
  data
  createdAt
`;

const ANALYTICS_FIELDS = `
  id
  courseId
  userId
  eventType
  metadata
  createdAt
`;

export async function graphqlRequest<TData, TVariables extends Record<string, unknown> = Record<string, never>>(
  query: string,
  variables?: TVariables,
  retry = true
) {
  const token = useAuthStore.getState().tokens?.accessToken;
  const response = await fetch(`${API_BASE_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      query,
      variables: variables ?? {}
    })
  });

  if (response.status === 401 && retry) {
    const refreshedToken = await refreshSession();
    if (refreshedToken) {
      return graphqlRequest<TData, TVariables>(query, variables, false);
    }
  }

  const payload = (await response.json()) as GraphQLResponse<TData>;

  if (!response.ok || payload.errors?.length) {
    throw new ApiError(payload.errors?.map((error) => error.message).join("\n") || response.statusText, response.status);
  }

  if (!payload.data) {
    throw new ApiError("GraphQL response did not include data", response.status);
  }

  return payload.data;
}

export async function getCourses() {
  const data = await graphqlRequest<{ courses: Course[] }>(`
    query Courses {
      courses {
        ${COURSE_FIELDS}
      }
    }
  `);

  return data.courses;
}

export async function getMyCourses() {
  const data = await graphqlRequest<{ myCourses: Course[] }>(`
    query MyCourses {
      myCourses {
        ${COURSE_FIELDS}
      }
    }
  `);

  return data.myCourses;
}

export async function createCourse(input: { title: string; description?: string }) {
  const data = await graphqlRequest<{ createCourse: Course }, { title: string; description?: string }>(
    `
      mutation CreateCourse($title: String!, $description: String) {
        createCourse(title: $title, description: $description) {
          ${COURSE_FIELDS}
        }
      }
    `,
    input
  );

  return data.createCourse;
}

export async function publishCourse(input: { id: string; publish: boolean }) {
  const data = await graphqlRequest<{ publishCourse: Course }, { id: string; publish: boolean }>(
    `
      mutation PublishCourse($id: ID!, $publish: Boolean!) {
        publishCourse(id: $id, publish: $publish) {
          ${COURSE_FIELDS}
        }
      }
    `,
    input
  );

  return data.publishCourse;
}

export async function enrollCourse(courseId: string) {
  const data = await graphqlRequest<{ enrollCourse: Enrollment }, { courseId: string }>(
    `
      mutation EnrollCourse($courseId: ID!) {
        enrollCourse(courseId: $courseId) {
          id
          courseId
          userId
          enrolledAt
        }
      }
    `,
    { courseId }
  );

  return data.enrollCourse;
}

export async function trackEvent(input: {
  courseId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  const data = await graphqlRequest<
    { trackEvent: AnalyticsEvent },
    { courseId?: string | null; eventType: string; metadata?: Record<string, unknown> }
  >(
    `
      mutation TrackEvent($courseId: ID, $eventType: String!, $metadata: JSON) {
        trackEvent(courseId: $courseId, eventType: $eventType, metadata: $metadata) {
          ${ANALYTICS_FIELDS}
        }
      }
    `,
    input
  );

  return data.trackEvent;
}

export async function getReports() {
  const data = await graphqlRequest<{ reports: Report[] }>(`
    query Reports {
      reports {
        ${REPORT_FIELDS}
      }
    }
  `);

  return data.reports;
}

export async function generateReport(input: { courseId: string; title: string }) {
  const data = await graphqlRequest<{ generateReport: Report }, { courseId: string; title: string }>(
    `
      mutation GenerateReport($courseId: ID!, $title: String!) {
        generateReport(courseId: $courseId, title: $title) {
          ${REPORT_FIELDS}
        }
      }
    `,
    input
  );

  return data.generateReport;
}

export async function deleteReport(id: string) {
  const data = await graphqlRequest<{ deleteReport: boolean }, { id: string }>(
    `
      mutation DeleteReport($id: ID!) {
        deleteReport(id: $id)
      }
    `,
    { id }
  );

  return data.deleteReport;
}

export async function getCourseAnalytics(courseId: string) {
  const data = await graphqlRequest<{ courseAnalytics: AnalyticsEvent[] }, { courseId: string }>(
    `
      query CourseAnalytics($courseId: ID!) {
        courseAnalytics(courseId: $courseId) {
          ${ANALYTICS_FIELDS}
        }
      }
    `,
    { courseId }
  );

  return data.courseAnalytics;
}

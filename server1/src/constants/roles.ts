export const USER_ROLES = ['ADMIN', 'INSTRUCTOR', 'STUDENT'] as const;

export type UserRole = (typeof USER_ROLES)[number];

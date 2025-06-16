export const validRoles = ['student', 'tutor', 'admin'] as const;
export type Role = typeof validRoles[number]; 
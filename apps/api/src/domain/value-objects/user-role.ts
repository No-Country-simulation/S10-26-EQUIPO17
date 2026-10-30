const USER_ROLES = ["company"] as const;

/** What a user is in the platform; decides which features the frontend shows. */
export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

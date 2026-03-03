import { auth, currentUser } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * 權限矩陣定義
 * 
 * | 功能         | MANAGER | ADMIN | STAFF |
 * |--------------|---------|-------|-------|
 * | Dashboard    | ✅      | ✅    | ❌    |
 * | 場次管理     | ✅      | ✅    | ❌    |
 * | 排班管理     | ✅      | ✅    | ❌    |
 * | 員工管理     | ✅      | ✅    | ❌    |
 * | 薪資管理     | ✅      | ❌    | ❌    |
 * | 通知管理     | ✅      | ✅    | ❌    |
 * | 行事曆管理   | ✅      | ✅    | ❌    |
 * | 請假管理     | ✅      | ✅    | ❌    |
 * | 數據分析     | ✅      | ✅    | ❌    |
 * | 我的排班     | ✅      | ✅    | ✅    |
 * | GPS 打卡     | ❌      | ❌    | ✅    |
 * | 員工薪資數字 | ✅      | ❌    | ❌    |
 */

export type Permission = 
  | "dashboard"
  | "events"
  | "scheduling"
  | "staff"
  | "salary"
  | "notifications"
  | "availability"
  | "leave"
  | "analytics"
  | "my-schedule"
  | "view-salary-numbers";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  MANAGER: [
    "dashboard", "events", "scheduling", "staff", "salary",
    "notifications", "availability", "leave", "analytics",
    "my-schedule", "view-salary-numbers"
  ],
  ADMIN: [
    "dashboard", "events", "scheduling", "staff",
    "notifications", "availability", "leave", "analytics",
    "my-schedule"
  ],
  STAFF: [
    "my-schedule"
  ],
};

/**
 * Get the current user's Clerk session
 */
export async function getCurrentSession() {
  return await auth();
}

/**
 * Get the current user's full profile
 */
export async function getCurrentUser() {
  return await currentUser();
}

/**
 * Get the current user's role from their Clerk metadata
 * Roles are stored in Clerk's publicMetadata as { role: "MANAGER" | "ADMIN" | "STAFF" }
 */
export async function getCurrentUserRole(): Promise<Role | null> {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }
  
  const role = user.publicMetadata?.role as Role | undefined;
  return role || null;
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { userId } = await auth();
  return !!userId;
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: Role): Promise<boolean> {
  const userRole = await getCurrentUserRole();
  return userRole === role;
}

/**
 * Check if the current user is a manager
 */
export async function isManager(): Promise<boolean> {
  return await hasRole("MANAGER");
}

/**
 * Check if the current user is admin or higher
 */
export async function isAdminOrAbove(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "MANAGER" || role === "ADMIN";
}

/**
 * Check if the current user is staff
 */
export async function isStaff(): Promise<boolean> {
  return await hasRole("STAFF");
}

/**
 * Check if the current user has a specific permission
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const role = await getCurrentUserRole();
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Require authentication (throw error if not authenticated)
 */
export async function requireAuth() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    throw new Error("Unauthorized: Authentication required");
  }
}

/**
 * Require a specific role (throw error if user doesn't have role)
 */
export async function requireRole(role: Role) {
  await requireAuth();
  
  const userHasRole = await hasRole(role);
  
  if (!userHasRole) {
    throw new Error(`Forbidden: ${role} role required`);
  }
}

/**
 * Require manager role
 */
export async function requireManager() {
  await requireRole("MANAGER");
}

/**
 * Require admin or manager role
 */
export async function requireAdminOrAbove() {
  await requireAuth();
  
  const role = await getCurrentUserRole();
  if (role !== "MANAGER" && role !== "ADMIN") {
    throw new Error("Forbidden: Admin or Manager role required");
  }
}

/**
 * Require a specific permission
 */
export async function requirePermission(permission: Permission) {
  await requireAuth();
  
  const permitted = await hasPermission(permission);
  if (!permitted) {
    throw new Error(`Forbidden: ${permission} permission required`);
  }
}

/**
 * Get current user's staff record (if they are linked to one)
 */
export async function getCurrentStaff() {
  const { userId } = await auth();
  if (!userId) return null;

  const staff = await prisma.staff.findUnique({
    where: { userId },
  });
  return staff;
}

/**
 * Require staff role and return staff record
 */
export async function requireStaff() {
  await requireAuth();
  
  const staff = await getCurrentStaff();
  if (!staff) {
    throw new Error("Forbidden: Staff account required");
  }
  return staff;
}

/**
 * Get permissions list for current user (for frontend)
 */
export async function getMyPermissions(): Promise<Permission[]> {
  const role = await getCurrentUserRole();
  if (!role) return [];
  return ROLE_PERMISSIONS[role] || [];
}

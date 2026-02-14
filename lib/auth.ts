import { auth, currentUser } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";

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
 * Roles are stored in Clerk's publicMetadata as { role: "MANAGER" | "STAFF" }
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
 * Check if the current user is staff
 */
export async function isStaff(): Promise<boolean> {
  return await hasRole("STAFF");
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

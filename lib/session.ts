import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
  phone?: string | null
  username?: string | null
}

export async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession()
  if (!session?.user) return null
  return session.user as unknown as SessionUser
}

export async function requireUserId(): Promise<string> {
  const session = await getSession()
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

export function isAdminRole(role?: string | null): boolean {
  return role === "admin" || role === "superadmin"
}

export function isSuperAdminRole(role?: string | null): boolean {
  return role === "superadmin"
}

export async function requireAdminId(): Promise<string> {
  const session = await getSession()
  if (!session?.user || !isAdminRole(session.user.role)) throw new Error("Unauthorized")
  return session.user.id
}

export async function requireSuperAdminId(): Promise<string> {
  const session = await getSession()
  if (!session?.user || !isSuperAdminRole(session.user.role)) throw new Error("Unauthorized")
  return session.user.id
}

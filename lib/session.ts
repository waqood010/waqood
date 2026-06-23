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

import { db } from "@/lib/db"
import { auditLog } from "@/lib/db/schema"
import { getSession } from "@/lib/session"

export async function logAction(
  action: "create" | "update" | "delete" | "login" | "logout",
  tableName: string,
  recordId: string | number,
  beforeData?: any,
  afterData?: any
) {
  try {
    const session = await getSession()
    if (!session?.user) return

    await db.insert(auditLog).values({
      userId: session.user.id,
      userName: session.user.name,
      action,
      tableName,
      recordId: recordId.toString(),
      beforeData,
      afterData,
    })
  } catch (err) {
    console.error("Failed to log action:", err)
  }
}

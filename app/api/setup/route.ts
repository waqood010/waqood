import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { count } from "drizzle-orm"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const usersCount = await db.select({ count: count() }).from(user)
    
    if (usersCount[0].count > 0) {
      return NextResponse.json(
        { message: "Users already exist. Setup can only run on an empty database." },
        { status: 400 }
      )
    }

    // Call better-auth API to create the admin user
    // We pass a mock request to satisfy the context requirement
    const adminPassword = process.env.SETUP_ADMIN_PASSWORD ?? "adminadmin123"

    const res = await auth.api.signUpEmail({
      body: {
        email: "admin@transport.gov.eg",
        password: adminPassword,
        name: "مدير النظام",
        username: "admin",
      },
    })

    await db.update(user).set({ role: "admin" }).where(eq(user.id, res.user.id))

    return NextResponse.json({
      message: "Admin user created successfully",
      credentials: {
        username: "admin",
        password: adminPassword,
      },
      user: {
        ...res.user,
        role: "admin",
      },
    })
  } catch (error: any) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: error.message || "Failed to create admin" }, { status: 500 })
  }
}

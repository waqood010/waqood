import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { AuthForm } from "@/components/auth-form"

export default async function SignUpPage() {
  const session = await getSession()
  if (session?.user) redirect("/dashboard")

  return (
    <main className="flex min-h-svh items-center justify-center bg-secondary px-4 py-12">
      <AuthForm mode="sign-up" />
    </main>
  )
}

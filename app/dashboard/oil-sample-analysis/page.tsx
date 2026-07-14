import { getSession } from "@/lib/session"
import { getOilSampleAnalyses, getOils } from "./actions"
import { OilSampleAnalysisTable } from "@/components/oil-sample-analysis/oil-sample-analysis-table"
import { FileSearch } from "lucide-react"

export default async function OilSampleAnalysisPage() {
  const session = await getSession()
  const isAdmin = session?.user?.role !== "user"
  const analyses = await getOilSampleAnalyses()
  const oils = await getOils()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileSearch className="size-6" />
          </div>
          تحليل عينات الزيوت
        </h2>
        <p className="text-muted-foreground mt-2">
          سجل جميع تحليلات العينات مع حالة التحليل، التكلفة، والمواعيد.
        </p>
      </div>

      <div className="mt-4">
        <OilSampleAnalysisTable initialData={analyses} oils={oils} isAdmin={isAdmin} />
      </div>
    </div>
  )
}

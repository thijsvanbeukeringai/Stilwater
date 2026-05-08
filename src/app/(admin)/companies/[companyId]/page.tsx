import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { GROUPS, PROJECT, PROJECT_ID } from "@/lib/mock/data"
import { CompanyDetailClient } from "./_components/CompanyDetailClient"

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>
}) {
  const { companyId } = await params
  const allDays = [...PROJECT.build_days, ...PROJECT.show_days].sort()

  return (
    <div className="space-y-4">
      <Link
        href={`/companies`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-3" />
        Terug naar bedrijven
      </Link>

      <CompanyDetailClient companyId={companyId} allDays={allDays} project={PROJECT} />
    </div>
  )
}

export function generateStaticParams() {
  return GROUPS.map((g) => ({ companyId: g.id }))
}

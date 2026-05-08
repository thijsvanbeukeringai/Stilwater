import { PROJECT_ID } from "@/lib/mock/data"
import { CompaniesPageClient } from "./_components/CompaniesPageClient"

export default function CompaniesPage() {
  return <CompaniesPageClient projectId={PROJECT_ID} />
}

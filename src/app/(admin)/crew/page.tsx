import { PROJECT, GROUPS, BRIEFINGS } from "@/lib/mock/data"
import { PersonsClient } from "./_components/PersonsClient"

export default function PersonsPage() {
  const allDays = [...PROJECT.build_days, ...PROJECT.show_days]
  return (
    <PersonsClient
      allDays={allDays}
      seedGroupsCount={GROUPS.length}
      seedBriefingsCount={BRIEFINGS.length}
    />
  )
}

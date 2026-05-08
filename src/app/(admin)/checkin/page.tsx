import { PROJECT } from "@/lib/mock/data"
import { CheckinPageClient } from "./_components/CheckinPageClient"

export default function CheckinPage() {
  // Today: pick the first show day for demo purposes
  const today = PROJECT.show_days[0]
  return <CheckinPageClient today={today} />
}

import { PROJECT } from "@/lib/mock/data"
import { ApprovalQueueClient } from "./_components/ApprovalQueueClient"

export default function ApprovalsPage() {
  const allDays = [...PROJECT.build_days, ...PROJECT.show_days]
  return <ApprovalQueueClient allDays={allDays} />
}

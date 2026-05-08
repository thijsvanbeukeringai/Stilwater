import { PROJECT } from "@/lib/mock/data"
import { PortalCrewClient } from "./_components/PortalCrewClient"

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const allDays = [...PROJECT.build_days, ...PROJECT.show_days].sort()
  return <PortalCrewClient inviteToken={token} allDays={allDays} project={PROJECT} />
}

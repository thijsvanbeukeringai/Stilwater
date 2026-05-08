import { TicketClient } from "./_components/TicketClient"

export const dynamic = "force-dynamic"

export default async function TicketPage({
  params,
}: {
  params: Promise<{ qrToken: string }>
}) {
  const { qrToken } = await params
  return <TicketClient qrToken={qrToken} />
}

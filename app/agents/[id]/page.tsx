import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AgentDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/agents?agent=${encodeURIComponent(id)}`)
}

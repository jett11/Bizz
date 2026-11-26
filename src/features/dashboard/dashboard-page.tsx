import { useQuery } from '@tanstack/react-query'
import { Banknote, Receipt, ShoppingCart, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/features/dashboard/stat-card'
import { InviteTeammateDialog } from '@/features/dashboard/invite-teammate-dialog'
import { useBusiness } from '@/providers/business-provider'
import { supabase } from '@/lib/supabase'
import { useFinanceSummary } from '@/features/finance/finance-queries'
import type { Profile } from '@/types/database'

function formatMoney(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface TeamRow {
  id: string
  role: string
  status: string
  invited_email: string | null
  profile: Profile | null
}

export function DashboardPage() {
  const { currentBusiness, currentRole } = useBusiness()
  const { data: summary, isLoading: summaryLoading } = useFinanceSummary(currentBusiness?.id)

  const { data: team, isLoading } = useQuery({
    queryKey: ['team-members', currentBusiness?.id],
    enabled: !!currentBusiness,
    queryFn: async (): Promise<TeamRow[]> => {
      const { data: memberships, error } = await supabase
        .from('business_memberships')
        .select('id, user_id, role, status, invited_email')
        .eq('business_id', currentBusiness!.id)
      if (error) throw error

      const userIds = (memberships ?? []).map((m) => m.user_id).filter((id): id is string => !!id)
      let profiles: Profile[] = []
      if (userIds.length > 0) {
        const { data, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds)
        if (profilesError) throw profilesError
        profiles = data ?? []
      }
      const profileById = new Map(profiles.map((p) => [p.id, p]))

      return (memberships ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        status: m.status,
        invited_email: m.invited_email,
        profile: m.user_id ? (profileById.get(m.user_id) ?? null) : null,
      }))
    },
  })

  if (!currentBusiness) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{currentBusiness.name}</h1>
          <p className="text-sm text-muted-foreground">
            Here's what's happening with your business today.
          </p>
        </div>
        {(currentRole === 'owner' || currentRole === 'admin') && (
          <InviteTeammateDialog businessId={currentBusiness.id} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={summaryLoading ? '…' : formatMoney(summary?.revenue ?? 0)}
          icon={Banknote}
          hint={summary?.revenue ? `${summary.orderCount} orders counted` : 'No sales recorded yet'}
          muted={!summary?.revenue}
        />
        <StatCard
          label="Expenses"
          value={summaryLoading ? '…' : formatMoney(summary?.expenses ?? 0)}
          icon={Receipt}
          hint={summary?.expenses ? 'From the Finance module' : 'No expenses recorded yet'}
          muted={!summary?.expenses}
        />
        <StatCard
          label="Orders"
          value={summaryLoading ? '…' : String(summary?.orderCount ?? 0)}
          icon={ShoppingCart}
          hint={summary?.orderCount ? `${formatMoney(summary.pendingPayments)} pending payment` : 'No orders recorded yet'}
          muted={!summary?.orderCount}
        />
        <StatCard
          label="Team members"
          value={String((team ?? []).filter((t) => t.status === 'active').length)}
          icon={Users}
          hint={`${(team ?? []).filter((t) => t.status === 'invited').length} pending invite(s)`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          )}
          {!isLoading && team?.length === 0 && (
            <p className="text-sm text-muted-foreground">No team members yet.</p>
          )}
          {team?.map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-accent text-accent-foreground">
                  {(member.profile?.full_name ?? member.invited_email ?? '?')
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {member.profile?.full_name ?? member.invited_email ?? 'Unknown'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {member.profile?.email ?? member.invited_email}
                </p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {member.role}
              </Badge>
              {member.status === 'invited' && <Badge variant="outline">Invited</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

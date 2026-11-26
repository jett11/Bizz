import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types/database'

export function useNotifications(businessId: string | undefined, limit = 15) {
  return useQuery({
    queryKey: ['notifications', businessId, limit],
    enabled: !!businessId,
    refetchInterval: 30_000,
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as Notification[]
    },
  })
}

export function useRecentNotificationCount(businessId: string | undefined) {
  const { data } = useNotifications(businessId, 50)
  const since = Date.now() - 24 * 60 * 60 * 1000
  return (data ?? []).filter((n) => new Date(n.created_at).getTime() > since).length
}

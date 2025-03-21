import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '../utils/format'
import api from '../utils/api'
import { Fine, Player } from '../types'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { data: totalAmount, isLoading: isLoadingTotal } = useQuery({
    queryKey: ['totalAmount'],
    queryFn: async () => {
      const { data } = await api.get<{ total: number }>('/totaal-boetes')
      return data.total
    },
  })

  const { data: recentFines, isLoading: isLoadingFines } = useQuery({
    queryKey: ['recentFines'],
    queryFn: async () => {
      const { data } = await api.get<Fine[]>('/recent-fines')
      return data
    },
  })

  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data } = await api.get<Player[]>('/player-totals')
      return data
    },
  })

  const isLoading = isLoadingTotal || isLoadingFines || isLoadingLeaderboard

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-lg font-medium text-muted-foreground">Laden...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Total Amount */}
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold">Totaal Bedrag</h2>
        <div className="text-3xl font-bold text-primary">{formatCurrency(totalAmount || 0)}</div>
      </section>

      {/* Recent Fines */}
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Recente Boetes</h2>
        <div className="space-y-4">
          {recentFines?.map((fine) => (
            <div
              key={fine.id}
              className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm"
            >
              <div>
                <div className="font-medium">{fine.player_name}</div>
                <div className="text-sm text-muted-foreground">{fine.reason_description}</div>
                <div className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                  {formatCurrency(fine.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Leaderboard</h2>
        <div className="space-y-4">
          {leaderboard?.map((player, index) => (
            <div
              key={player.name}
              className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground">
                  {index + 1}
                </div>
                <div className="font-medium">{player.name}</div>
              </div>
              <div className="font-medium text-blue-600 dark:text-blue-400">
                {formatCurrency(player.total || 0)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
} 
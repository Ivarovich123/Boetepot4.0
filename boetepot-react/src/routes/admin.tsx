import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { formatCurrency } from '../utils/format'
import api from '../utils/api'
import { Fine, Player, Reason } from '../types'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

function AdminPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient()
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  const [amount, setAmount] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newReasonDescription, setNewReasonDescription] = useState('')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, navigate]);

  // If not authenticated, don't render anything
  if (!isAuthenticated) {
    return null;
  }

  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const { data } = await api.get<Player[]>('/players')
      return data
    },
  })

  const { data: reasons, isLoading: isLoadingReasons } = useQuery({
    queryKey: ['reasons'],
    queryFn: async () => {
      const { data } = await api.get<Reason[]>('/reasons')
      return data
    },
  })

  const { data: recentFines, isLoading: isLoadingFines } = useQuery({
    queryKey: ['recentFines'],
    queryFn: async () => {
      const { data } = await api.get<Fine[]>('/recent-fines')
      return data
    },
  })

  const addFineMutation = useMutation({
    mutationFn: async (data: { player_id: string; reason_id: string; amount: number }) => {
      await api.post('/fines', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentFines'] })
      queryClient.invalidateQueries({ queryKey: ['totalAmount'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      setSelectedPlayer('')
      setSelectedReason('')
      setAmount('')
      toast.success('Boete succesvol toegevoegd')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const addPlayerMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      await api.post('/players', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
      setNewPlayerName('')
      toast.success('Speler succesvol toegevoegd')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const addReasonMutation = useMutation({
    mutationFn: async (data: { description: string }) => {
      await api.post('/reasons', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reasons'] })
      setNewReasonDescription('')
      toast.success('Reden succesvol toegevoegd')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteFineMutation = useMutation({
    mutationFn: async (fineId: number) => {
      await api.delete(`/fines/${fineId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentFines'] })
      queryClient.invalidateQueries({ queryKey: ['totalAmount'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      toast.success('Boete succesvol verwijderd')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleAddFine = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlayer || !selectedReason || !amount) return

    addFineMutation.mutate({
      player_id: selectedPlayer,
      reason_id: selectedReason,
      amount: parseFloat(amount),
    })
  }

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlayerName) return

    addPlayerMutation.mutate({
      name: newPlayerName,
    })
  }

  const handleAddReason = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReasonDescription) return

    addReasonMutation.mutate({
      description: newReasonDescription,
    })
  }

  const isLoading = isLoadingPlayers || isLoadingReasons || isLoadingFines

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-lg font-medium text-muted-foreground">Laden...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Add Fine Form */}
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Nieuwe Boete</h2>
        <form onSubmit={handleAddFine} className="space-y-4">
          <div>
            <label htmlFor="player" className="mb-2 block text-sm font-medium">
              Speler
            </label>
            <select
              id="player"
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2"
              required
            >
              <option value="">Selecteer een speler</option>
              {players?.map((player: Player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="reason" className="mb-2 block text-sm font-medium">
              Reden
            </label>
            <select
              id="reason"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2"
              required
            >
              <option value="">Selecteer een reden</option>
              {reasons?.map((reason: Reason) => (
                <option key={reason.id} value={reason.id}>
                  {reason.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="amount" className="mb-2 block text-sm font-medium">
              Bedrag
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-md border bg-background pl-8 pr-3 py-2"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
            disabled={addFineMutation.isPending}
          >
            {addFineMutation.isPending ? 'Toevoegen...' : 'Toevoegen'}
          </button>
        </form>
      </section>

      {/* Add Player Form */}
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Nieuwe Speler</h2>
        <form onSubmit={handleAddPlayer} className="space-y-4">
          <div>
            <label htmlFor="playerName" className="mb-2 block text-sm font-medium">
              Naam
            </label>
            <input
              type="text"
              id="playerName"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
            disabled={addPlayerMutation.isPending}
          >
            {addPlayerMutation.isPending ? 'Toevoegen...' : 'Toevoegen'}
          </button>
        </form>
      </section>

      {/* Add Reason Form */}
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Nieuwe Reden</h2>
        <form onSubmit={handleAddReason} className="space-y-4">
          <div>
            <label htmlFor="reasonDescription" className="mb-2 block text-sm font-medium">
              Omschrijving
            </label>
            <input
              type="text"
              id="reasonDescription"
              value={newReasonDescription}
              onChange={(e) => setNewReasonDescription(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
            disabled={addReasonMutation.isPending}
          >
            {addReasonMutation.isPending ? 'Toevoegen...' : 'Toevoegen'}
          </button>
        </form>
      </section>

      {/* Recent Fines */}
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Recente Boetes</h2>
        <div className="space-y-4">
          {recentFines?.map((fine: Fine) => (
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
              <button
                onClick={() => deleteFineMutation.mutate(fine.id)}
                className="rounded-md bg-destructive px-3 py-1 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteFineMutation.isPending}
              >
                Verwijderen
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
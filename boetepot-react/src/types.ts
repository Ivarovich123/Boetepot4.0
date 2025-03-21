export interface Fine {
  id: number
  player_name: string
  reason_description: string
  amount: number
  date: string
}

export interface Player {
  id: number
  name: string
  total?: number
}

export interface Reason {
  id: number
  description: string
}

export interface ApiError {
  message: string
  status: number
} 
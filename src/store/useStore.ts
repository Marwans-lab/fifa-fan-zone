import { useState, useEffect, useCallback } from 'react'

export interface FanCard {
  teamId: string | null
  photoDataUrl: string | null
  answers: Record<string, string>
  completedAt: string | null
}

export interface AppState {
  fanCard: FanCard
  points: number
}

const STORAGE_KEY = 'fanzone_state'

const defaultState: AppState = {
  fanCard: {
    teamId: null,
    photoDataUrl: null,
    answers: {},
    completedAt: null,
  },
  points: 0,
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    return { ...defaultState, ...JSON.parse(raw) }
  } catch {
    return defaultState
  }
}

function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage quota exceeded — non-fatal
  }
}

export function useStore() {
  const [state, setState] = useState<AppState>(loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  const updateFanCard = useCallback((patch: Partial<FanCard>) => {
    setState(prev => ({
      ...prev,
      fanCard: { ...prev.fanCard, ...patch },
    }))
  }, [])

  const addPoints = useCallback((n: number) => {
    setState(prev => ({ ...prev, points: prev.points + n }))
  }, [])

  const resetState = useCallback(() => {
    setState(defaultState)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { state, updateFanCard, addPoints, resetState }
}

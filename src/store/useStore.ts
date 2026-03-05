import { useState, useEffect, useCallback } from 'react'

export interface FanCard {
  teamId: string | null
  photoDataUrl: string | null
  answers: Record<string, string>
  completedAt: string | null
}

export interface QuizResult {
  score: number
  total: number
  completedAt: string
}

export interface AppState {
  fanCard: FanCard
  points: number
  quizResults: Record<string, QuizResult>
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
  quizResults: {},
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
    setState(prev => {
      const next = { ...prev, fanCard: { ...prev.fanCard, ...patch } }
      saveState(next) // persist synchronously so navigating away doesn't lose state
      return next
    })
  }, [])

  const addPoints = useCallback((n: number) => {
    setState(prev => {
      const next = { ...prev, points: prev.points + n }
      saveState(next)
      return next
    })
  }, [])

  const recordQuizResult = useCallback((quizId: string, score: number, total: number) => {
    setState(prev => {
      const next = {
        ...prev,
        quizResults: {
          ...prev.quizResults,
          [quizId]: { score, total, completedAt: new Date().toISOString() },
        },
      }
      saveState(next)
      return next
    })
  }, [])

  const resetState = useCallback(() => {
    setState(defaultState)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { state, updateFanCard, addPoints, recordQuizResult, resetState }
}

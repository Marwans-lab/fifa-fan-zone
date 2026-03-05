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

// ─── Module-level singleton ────────────────────────────────────────────────────
// All useStore() calls share this single instance so updates in one component
// (e.g. Identity) are immediately visible in another (e.g. Card) without
// relying on localStorage round-trips between renders.

let _state: AppState = loadState()
const _listeners = new Set<() => void>()

function _setState(updater: (prev: AppState) => AppState): void {
  _state = updater(_state)
  saveState(_state)
  _listeners.forEach(l => l())
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useStore() {
  // Local counter only used to trigger re-renders when singleton state changes
  const [, forceRender] = useState(0)

  useEffect(() => {
    const notify = () => forceRender(n => n + 1)
    _listeners.add(notify)
    return () => { _listeners.delete(notify) }
  }, [])

  const updateFanCard = useCallback((patch: Partial<FanCard>) => {
    _setState(prev => ({ ...prev, fanCard: { ...prev.fanCard, ...patch } }))
  }, [])

  const addPoints = useCallback((n: number) => {
    _setState(prev => ({ ...prev, points: prev.points + n }))
  }, [])

  const recordQuizResult = useCallback((quizId: string, score: number, total: number) => {
    _setState(prev => ({
      ...prev,
      quizResults: {
        ...prev.quizResults,
        [quizId]: { score, total, completedAt: new Date().toISOString() },
      },
    }))
  }, [])

  const resetState = useCallback(() => {
    _setState(() => defaultState)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { state: _state, updateFanCard, addPoints, recordQuizResult, resetState }
}

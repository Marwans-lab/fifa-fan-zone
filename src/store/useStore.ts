import { useState, useEffect, useCallback } from 'react'
import { FLOWS } from '../data/flows'

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
  /** Flow IDs that have been unlocked — flow 1 is always unlocked */
  unlockedFlows: string[]
  /** Flow IDs that have been completed */
  completedFlows: string[]
}

const STORAGE_KEY = 'fanzone_state'

// Clear persisted state on every page reload so a hard refresh always starts fresh
const _nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
if (_nav?.type === 'reload') {
  localStorage.removeItem(STORAGE_KEY)
}

const defaultState: AppState = {
  fanCard: {
    teamId: null,
    photoDataUrl: null,
    answers: {},
    completedAt: null,
  },
  points: 0,
  quizResults: {},
  unlockedFlows: [FLOWS[0].id],
  completedFlows: [],
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const saved = JSON.parse(raw) as Partial<AppState>
    return {
      ...defaultState,
      ...saved,
      // deep-merge fanCard so missing fields fall back to defaults
      fanCard: { ...defaultState.fanCard, ...(saved.fanCard ?? {}) },
      // Ensure flow arrays exist (migration from older state shape)
      unlockedFlows: saved.unlockedFlows ?? defaultState.unlockedFlows,
      completedFlows: saved.completedFlows ?? defaultState.completedFlows,
    }
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

  const completeFlow = useCallback((flowId: string) => {
    _setState(prev => {
      const alreadyCompleted = prev.completedFlows.includes(flowId)
      const newCompleted = alreadyCompleted ? prev.completedFlows : [...prev.completedFlows, flowId]

      // Unlock the next flow in sequence
      const currentFlow = FLOWS.find(f => f.id === flowId)
      const nextFlow = currentFlow ? FLOWS.find(f => f.order === currentFlow.order + 1) : undefined
      const newUnlocked = nextFlow && !prev.unlockedFlows.includes(nextFlow.id)
        ? [...prev.unlockedFlows, nextFlow.id]
        : prev.unlockedFlows

      return { ...prev, completedFlows: newCompleted, unlockedFlows: newUnlocked }
    })
  }, [])

  const resetState = useCallback(() => {
    _setState(() => defaultState)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { state: _state, updateFanCard, addPoints, recordQuizResult, completeFlow, resetState }
}

import { Injectable, computed, signal, type WritableSignal } from '@angular/core'

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

export const FLOW_IDS = [
  'the-connector',
  'the-architect',
  'the-historian',
  'the-referee',
  'the-retrospective',
] as const

export type FlowId = (typeof FLOW_IDS)[number]

export interface AppState {
  fanCard: FanCard
  points: number
  quizResults: Record<string, QuizResult>
  completedFlows: FlowId[]
  hasVisitedLeaderboard: boolean
}

export const STORE_STORAGE_KEY = 'fanzone_state'

function buildDefaultState(): AppState {
  return {
    fanCard: {
      teamId: null,
      photoDataUrl: null,
      answers: {},
      completedAt: null,
    },
    points: 0,
    quizResults: {},
    completedFlows: [],
    hasVisitedLeaderboard: false,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isFlowId(value: unknown): value is FlowId {
  return typeof value === 'string' && FLOW_IDS.includes(value as FlowId)
}

function getStorage(): Storage | null {
  if (typeof localStorage === 'undefined') {
    return null
  }
  return localStorage
}

function loadState(): AppState {
  const defaults = buildDefaultState()
  const storage = getStorage()

  if (!storage) {
    return defaults
  }

  try {
    const raw = storage.getItem(STORE_STORAGE_KEY)
    if (!raw) {
      return defaults
    }

    const saved = JSON.parse(raw) as Partial<AppState>

    const fanCard = isRecord(saved.fanCard) ? saved.fanCard : {}
    const quizResults = isRecord(saved.quizResults)
      ? (saved.quizResults as Record<string, QuizResult>)
      : {}
    const completedFlows = Array.isArray(saved.completedFlows)
      ? saved.completedFlows.filter(isFlowId)
      : []

    return {
      ...defaults,
      ...saved,
      fanCard: {
        ...defaults.fanCard,
        ...fanCard,
      },
      quizResults,
      completedFlows,
    }
  } catch {
    return defaults
  }
}

function saveState(state: AppState): void {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    storage.setItem(STORE_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage quota exceeded — non-fatal.
  }
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly _state: WritableSignal<AppState> = signal(loadState())
  readonly state = computed(() => this._state())

  constructor() {
    const navigation = globalThis.performance?.getEntriesByType?.('navigation')?.[0] as
      | { type?: string }
      | undefined

    // Match the React store behavior where hard refresh starts a fresh session.
    if (navigation?.type === 'reload') {
      this.resetState()
    }
  }

  updateFanCard(patch: Partial<FanCard>): void {
    this.setState(prev => ({
      ...prev,
      fanCard: {
        ...prev.fanCard,
        ...patch,
      },
    }))
  }

  addPoints(points: number): void {
    this.setState(prev => ({
      ...prev,
      points: prev.points + points,
    }))
  }

  recordQuizResult(quizId: string, score: number, total: number): void {
    this.setState(prev => ({
      ...prev,
      quizResults: {
        ...prev.quizResults,
        [quizId]: {
          score,
          total,
          completedAt: new Date().toISOString(),
        },
      },
    }))
  }

  completeFlow(flowId: FlowId): void {
    this.setState(prev => {
      if (prev.completedFlows.includes(flowId)) {
        return prev
      }

      return {
        ...prev,
        completedFlows: [...prev.completedFlows, flowId],
      }
    })
  }

  isFlowUnlocked(flowId: FlowId): boolean {
    const index = FLOW_IDS.indexOf(flowId)
    if (index < 0) {
      return false
    }
    if (index === 0) {
      return true
    }

    const previousFlow = FLOW_IDS[index - 1]
    return this._state().completedFlows.includes(previousFlow)
  }

  isFlowCompleted(flowId: FlowId): boolean {
    return this._state().completedFlows.includes(flowId)
  }

  markLeaderboardVisited(): void {
    this.setState(prev => {
      if (prev.hasVisitedLeaderboard) {
        return prev
      }
      return {
        ...prev,
        hasVisitedLeaderboard: true,
      }
    })
  }

  resetState(): void {
    const nextState = buildDefaultState()
    this._state.set(nextState)

    const storage = getStorage()
    if (!storage) {
      return
    }

    storage.removeItem(STORE_STORAGE_KEY)
  }

  private setState(updater: (previous: AppState) => AppState): void {
    const nextState = updater(this._state())
    this._state.set(nextState)
    saveState(nextState)
  }
}

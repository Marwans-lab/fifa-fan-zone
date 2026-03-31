import { Injectable, computed, signal } from '@angular/core';

export interface FanCard {
  teamId: string | null;
  photoDataUrl: string | null;
  answers: Record<string, string>;
  completedAt: string | null;
}

export interface QuizResult {
  score: number;
  total: number;
  completedAt: string;
}

export const FLOW_IDS = [
  'the-connector',
  'the-architect',
  'the-historian',
  'the-referee',
  'the-retrospective',
] as const;

export type FlowId = (typeof FLOW_IDS)[number];

export interface AppState {
  fanCard: FanCard;
  points: number;
  quizResults: Record<string, QuizResult>;
  completedFlows: FlowId[];
}

const STORAGE_KEY = 'fanzone_state';

function createDefaultState(): AppState {
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
  };
}

function getStorage(): Storage | null {
  if (typeof globalThis.localStorage === 'undefined') {
    return null;
  }

  return globalThis.localStorage;
}

function clearPersistedStateOnReload(): void {
  try {
    const navEntries = globalThis.performance?.getEntriesByType?.('navigation');
    const nav = navEntries?.[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type === 'reload') {
      getStorage()?.removeItem(STORAGE_KEY);
    }
  } catch {
    // Non-fatal browser API read errors.
  }
}

function loadState(): AppState {
  const defaultState = createDefaultState();

  clearPersistedStateOnReload();

  try {
    const raw = getStorage()?.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }

    const saved = JSON.parse(raw) as Partial<AppState>;
    return {
      ...defaultState,
      ...saved,
      fanCard: {
        ...defaultState.fanCard,
        ...(saved.fanCard ?? {}),
      },
    };
  } catch {
    return defaultState;
  }
}

function saveState(state: AppState): void {
  try {
    getStorage()?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded or unavailable storage — non-fatal.
  }
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly _state = signal<AppState>(loadState());
  readonly state = computed(() => this._state());

  updateFanCard(patch: Partial<FanCard>): void {
    this.setState((prev) => ({
      ...prev,
      fanCard: { ...prev.fanCard, ...patch },
    }));
  }

  addPoints(pointsToAdd: number): void {
    this.setState((prev) => ({
      ...prev,
      points: prev.points + pointsToAdd,
    }));
  }

  recordQuizResult(quizId: string, score: number, total: number): void {
    this.setState((prev) => ({
      ...prev,
      quizResults: {
        ...prev.quizResults,
        [quizId]: {
          score,
          total,
          completedAt: new Date().toISOString(),
        },
      },
    }));
  }

  completeFlow(flowId: FlowId): void {
    this.setState((prev) => {
      if (prev.completedFlows.includes(flowId)) {
        return prev;
      }

      return {
        ...prev,
        completedFlows: [...prev.completedFlows, flowId],
      };
    });
  }

  isFlowUnlocked(flowId: FlowId): boolean {
    const flowIndex = FLOW_IDS.indexOf(flowId);
    if (flowIndex === 0) {
      return true;
    }

    const previousFlow = FLOW_IDS[flowIndex - 1];
    return this._state().completedFlows.includes(previousFlow);
  }

  isFlowCompleted(flowId: FlowId): boolean {
    return this._state().completedFlows.includes(flowId);
  }

  resetState(): void {
    this._state.set(createDefaultState());
    try {
      getStorage()?.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable — non-fatal.
    }
  }

  private setState(updater: (prev: AppState) => AppState): void {
    const nextState = updater(this._state());
    this._state.set(nextState);
    saveState(nextState);
  }
}

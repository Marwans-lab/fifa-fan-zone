import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest'
import { StoreService, STORE_STORAGE_KEY } from './store.service'

describe('StoreService', () => {
  const originalPerformance = globalThis.performance

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()

    Object.defineProperty(globalThis, 'performance', {
      configurable: true,
      writable: true,
      value: {
        getEntriesByType: vi.fn().mockReturnValue([{ type: 'navigate' }]),
      },
    })
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'performance', {
      configurable: true,
      writable: true,
      value: originalPerformance,
    })
  })

  it('initializes from defaults when localStorage is empty', () => {
    const store = new StoreService()

    expect(store.state()).toEqual({
      fanCard: {
        teamId: null,
        photoDataUrl: null,
        answers: {},
        completedAt: null,
      },
      points: 0,
      quizResults: {},
      completedFlows: [],
    })
  })

  it('updates fan card and persists the state', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const store = new StoreService()

    store.updateFanCard({
      teamId: 'argentina',
      photoDataUrl: 'data:image/png;base64,abc',
    })

    expect(store.state().fanCard.teamId).toBe('argentina')
    expect(store.state().fanCard.photoDataUrl).toBe('data:image/png;base64,abc')
    expect(setItemSpy).toHaveBeenCalled()

    const raw = localStorage.getItem(STORE_STORAGE_KEY)
    expect(raw).not.toBeNull()
    const saved = JSON.parse(raw ?? '{}') as { fanCard?: { teamId?: string } }
    expect(saved.fanCard?.teamId).toBe('argentina')
  })

  it('adds points and records quiz results', () => {
    const store = new StoreService()

    store.addPoints(12)
    store.recordQuizResult('quiz-1', 8, 10)

    expect(store.state().points).toBe(12)
    expect(store.state().quizResults['quiz-1']).toMatchObject({
      score: 8,
      total: 10,
    })
    expect(typeof store.state().quizResults['quiz-1']?.completedAt).toBe('string')
  })

  it('completes a flow only once and unlocks next flow', () => {
    const store = new StoreService()

    expect(store.isFlowUnlocked('the-connector')).toBe(true)
    expect(store.isFlowUnlocked('the-architect')).toBe(false)

    store.completeFlow('the-connector')
    store.completeFlow('the-connector')

    expect(store.state().completedFlows).toEqual(['the-connector'])
    expect(store.isFlowCompleted('the-connector')).toBe(true)
    expect(store.isFlowUnlocked('the-architect')).toBe(true)
  })

  it('resetState clears localStorage and restores defaults', () => {
    const removeSpy = vi.spyOn(Storage.prototype, 'removeItem')
    const store = new StoreService()

    store.addPoints(5)
    store.updateFanCard({ teamId: 'spain' })

    expect(store.state().points).toBe(5)

    store.resetState()

    expect(store.state().points).toBe(0)
    expect(store.state().fanCard.teamId).toBeNull()
    expect(removeSpy).toHaveBeenCalledWith(STORE_STORAGE_KEY)
    expect(localStorage.getItem(STORE_STORAGE_KEY)).toBeNull()
  })

  it('clears persisted state on hard reload navigation', () => {
    localStorage.setItem(
      STORE_STORAGE_KEY,
      JSON.stringify({
        points: 99,
      }),
    )

    Object.defineProperty(globalThis, 'performance', {
      configurable: true,
      writable: true,
      value: {
        getEntriesByType: vi.fn().mockReturnValue([{ type: 'reload' }]),
      },
    })

    const store = new StoreService()

    expect(store.state().points).toBe(0)
    expect(localStorage.getItem(STORE_STORAGE_KEY)).toBeNull()
  })
})

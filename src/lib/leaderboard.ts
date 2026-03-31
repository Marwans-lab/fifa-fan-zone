/**
 * Leaderboard module — MAR-33
 *
 * Architecture:
 * - `buildLeaderboard()` produces a sorted list from mock data + the current user's score.
 * - In production: replace `MOCK_OTHERS` with data fetched from the backend API.
 * - Scoring basis: cumulative score across all quizzes (= appState.points).
 * - Refresh cadence: every LEADERBOARD_REFRESH_MS milliseconds (default 5 min).
 *   Real-time leaderboards would use a WebSocket / SSE subscription instead.
 *
 * Tamper note: this client-side score is display-only.
 * The authoritative score lives server-side; top-5 Avios prizes must be
 * validated against the server record, not this local value.
 */
import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store/useStore'

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  rank:        number
  name:        string
  pts:         number
  durationMins: number
  isMe?:       boolean
}

// ─── Config ────────────────────────────────────────────────────────────────────
/** Refresh every 5 minutes. Swap for real-time (WebSocket/SSE) when backend is live. */
export const LEADERBOARD_REFRESH_MS = 5 * 60 * 1_000

// ─── Mock data ─────────────────────────────────────────────────────────────────
// TODO: replace with `GET /api/leaderboard` when backend is available.
const MOCK_OTHERS: Omit<LeaderboardEntry, 'rank' | 'isMe'>[] = [
  { name: 'Chris',   pts: 49, durationMins: 2 },
  { name: 'Simon',   pts: 45, durationMins: 3 },
  { name: 'Alex',    pts: 42, durationMins: 2 },
  { name: 'Jordan',  pts: 38, durationMins: 4 },
  { name: 'Taylor',  pts: 35, durationMins: 3 },
  { name: 'Morgan',  pts: 30, durationMins: 5 },
  { name: 'Avery',   pts: 25, durationMins: 2 },
  { name: 'Quinn',   pts: 20, durationMins: 3 },
  { name: 'Skyler',  pts: 15, durationMins: 4 },
]

// ─── Core logic ────────────────────────────────────────────────────────────────
/**
 * Build a ranked leaderboard by inserting the current user's score into
 * the sorted list of other players. Sort: pts desc, then durationMins asc
 * (faster time wins tiebreaker, as is standard in timed quiz competitions).
 */
export function buildLeaderboard(
  myPts: number,
  myName: string = 'You',
  myDurationMins = 2,
): LeaderboardEntry[] {
  const all: (Omit<LeaderboardEntry, 'rank'> & { isMe: boolean })[] = [
    ...MOCK_OTHERS.map(e => ({ ...e, isMe: false })),
    { name: myName, pts: myPts, durationMins: myDurationMins, isMe: true },
  ]

  all.sort((a, b) => b.pts - a.pts || a.durationMins - b.durationMins)
  return all.map((e, i) => ({ ...e, rank: i + 1 }))
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export interface UseLeaderboardResult {
  entries:     LeaderboardEntry[]
  myRank:      number | null
  lastRefresh: Date
  refresh:     () => void
}

/** Returns a sorted leaderboard based on the current user's accumulated points. */
export function useLeaderboard(): UseLeaderboardResult {
  const { state } = useStore()

  const compute = useCallback(
    () => buildLeaderboard(state.points),
    [state.points],
  )

  const [entries,     setEntries]     = useState<LeaderboardEntry[]>(compute)
  const [lastRefresh, setLastRefresh] = useState(() => new Date())

  const refresh = useCallback(() => {
    setEntries(compute())
    setLastRefresh(new Date())
  }, [compute])

  // Auto-refresh every LEADERBOARD_REFRESH_MS
  useEffect(() => {
    refresh()
    const t = setInterval(refresh, LEADERBOARD_REFRESH_MS)
    return () => clearInterval(t)
  }, [refresh])

  const myRank = entries.find(e => e.isMe)?.rank ?? null

  return { entries, myRank, lastRefresh, refresh }
}

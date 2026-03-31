export interface LeaderboardEntry {
  rank: number
  name: string
  pts: number
  durationMins: number
  isMe?: boolean
}

const MOCK_OTHERS: Omit<LeaderboardEntry, 'rank' | 'isMe'>[] = [
  { name: 'Chris', pts: 49, durationMins: 2 },
  { name: 'Simon', pts: 45, durationMins: 3 },
  { name: 'Alex', pts: 42, durationMins: 2 },
  { name: 'Jordan', pts: 38, durationMins: 4 },
  { name: 'Taylor', pts: 35, durationMins: 3 },
  { name: 'Morgan', pts: 30, durationMins: 5 },
  { name: 'Avery', pts: 25, durationMins: 2 },
  { name: 'Quinn', pts: 20, durationMins: 3 },
  { name: 'Skyler', pts: 15, durationMins: 4 },
]

export function buildLeaderboard(
  myPts: number,
  myName = 'You',
  myDurationMins = 2,
): LeaderboardEntry[] {
  const all: (Omit<LeaderboardEntry, 'rank'> & { isMe: boolean })[] = [
    ...MOCK_OTHERS.map(entry => ({ ...entry, isMe: false })),
    { name: myName, pts: myPts, durationMins: myDurationMins, isMe: true },
  ]

  all.sort((a, b) => b.pts - a.pts || a.durationMins - b.durationMins)
  return all.map((entry, index) => ({ ...entry, rank: index + 1 }))
}

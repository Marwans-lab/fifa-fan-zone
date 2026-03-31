import { Injectable, computed, signal } from '@angular/core';
import { AppStoreService } from './app-store.service';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  pts: number;
  durationMins: number;
  teamId: string;
  isMe: boolean;
}

export const LEADERBOARD_REFRESH_MS = 5 * 60 * 1_000;

const MOCK_OTHERS: Array<
  Omit<LeaderboardEntry, 'rank' | 'isMe'> & { isMe?: boolean }
> = [
  { name: 'Chris', pts: 49, durationMins: 2, teamId: 'arg' },
  { name: 'Simon', pts: 45, durationMins: 3, teamId: 'bra' },
  { name: 'Alex', pts: 42, durationMins: 2, teamId: 'fra' },
  { name: 'Jordan', pts: 38, durationMins: 4, teamId: 'usa' },
  { name: 'Taylor', pts: 35, durationMins: 3, teamId: 'eng' },
  { name: 'Morgan', pts: 30, durationMins: 5, teamId: 'esp' },
  { name: 'Avery', pts: 25, durationMins: 2, teamId: 'ger' },
  { name: 'Quinn', pts: 20, durationMins: 3, teamId: 'jpn' },
  { name: 'Skyler', pts: 15, durationMins: 4, teamId: 'mex' },
];

export function buildLeaderboard(
  myPts: number,
  myName = 'You',
  myDurationMins = 2,
  myTeamId = 'usa'
): LeaderboardEntry[] {
  const all: Array<Omit<LeaderboardEntry, 'rank'>> = [
    ...MOCK_OTHERS.map((entry) => ({ ...entry, isMe: false })),
    {
      name: myName,
      pts: myPts,
      durationMins: myDurationMins,
      teamId: myTeamId,
      isMe: true,
    },
  ];

  all.sort((first, second) => {
    if (second.pts !== first.pts) {
      return second.pts - first.pts;
    }
    return first.durationMins - second.durationMins;
  });

  return all.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly _entries = signal<LeaderboardEntry[]>([]);
  readonly entries = this._entries.asReadonly();

  private readonly _lastRefresh = signal(new Date());
  readonly lastRefresh = this._lastRefresh.asReadonly();

  readonly myRank = computed(() => {
    return this._entries().find((entry) => entry.isMe)?.rank ?? null;
  });

  constructor(private readonly store: AppStoreService) {
    this.refresh();
    setInterval(() => {
      this.refresh();
    }, LEADERBOARD_REFRESH_MS);
  }

  refresh(): void {
    const appState = this.store.state();
    const nextEntries = buildLeaderboard(
      appState.points,
      'You',
      2,
      appState.fanCard.teamId ?? 'usa'
    );
    this._entries.set(nextEntries);
    this._lastRefresh.set(new Date());
  }
}

import { computed, Injectable, signal } from '@angular/core';

import { StoreService } from './store.service';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  pts: number;
  durationMins: number;
  isMe?: boolean;
}

/** Refresh every 5 minutes to mirror the React leaderboard cadence. */
export const LEADERBOARD_REFRESH_MS = 5 * 60 * 1_000;

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
];

export function buildLeaderboard(
  myPts: number,
  myName = 'You',
  myDurationMins = 2
): LeaderboardEntry[] {
  const all: (Omit<LeaderboardEntry, 'rank'> & { isMe: boolean })[] = [
    ...MOCK_OTHERS.map(entry => ({ ...entry, isMe: false })),
    { name: myName, pts: myPts, durationMins: myDurationMins, isMe: true },
  ];

  all.sort((a, b) => b.pts - a.pts || a.durationMins - b.durationMins);
  return all.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly entriesSignal = signal<LeaderboardEntry[]>([]);
  private readonly lastRefreshSignal = signal<Date>(new Date());
  private refreshIntervalId: number | null = null;

  readonly entries = computed(() => this.entriesSignal());
  readonly myRank = computed(() => this.entriesSignal().find(entry => entry.isMe)?.rank ?? null);
  readonly lastRefresh = computed(() => this.lastRefreshSignal());

  constructor(private readonly store: StoreService) {}

  startAutoRefresh(): void {
    this.refresh();
    if (this.refreshIntervalId !== null) {
      return;
    }

    this.refreshIntervalId = window.setInterval(() => {
      this.refresh();
    }, LEADERBOARD_REFRESH_MS);
  }

  stopAutoRefresh(): void {
    if (this.refreshIntervalId === null) {
      return;
    }

    window.clearInterval(this.refreshIntervalId);
    this.refreshIntervalId = null;
  }

  refresh(): void {
    this.entriesSignal.set(buildLeaderboard(this.store.state().points));
    this.lastRefreshSignal.set(new Date());
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { ButtonComponent } from '../../components/button/button.component';
import { ScreenComponent } from '../../components/screen/screen.component';
import { AnalyticsService } from '../../services/analytics.service';
import { StoreService } from '../../services/store.service';

interface ResultsRouteState {
  score: number;
  total: number;
  quizTitle: string;
}

@Component({
  standalone: true,
  imports: [ScreenComponent, ButtonComponent],
  templateUrl: './results.page.html',
  styleUrl: './results.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);
  readonly store = inject(StoreService);
  readonly trophyIcon = 'assets/icons/Trophy-white.svg';

  readonly ringSize = 204;
  readonly ringStroke = 6;
  readonly ringRadius = (this.ringSize - this.ringStroke * 2) / 2;
  readonly ringCenter = this.ringSize / 2;
  readonly ringCircumference = 2 * Math.PI * this.ringRadius;

  readonly result = signal<ResultsRouteState | null>(this.readRouteState());
  readonly ringProgress = signal(0);
  readonly displayPoints = signal(0);

  readonly homeRoute = computed(() => (this.store.state().fanCard.teamId ? '/card' : '/'));
  readonly scorePercent = computed(() => {
    const value = this.result();
    if (!value || value.total <= 0) return 0;
    return Math.min(1, Math.max(0, value.score / value.total));
  });
  readonly status = computed(() => this.getStatus(this.scorePercent()));
  readonly ringOffset = computed(() => this.ringCircumference * (1 - this.ringProgress()));
  readonly ringArcFilter = computed(
    () => `drop-shadow(0 0 var(--sp-2) ${this.status().tone}88)`,
  );
  readonly ringInnerShadow = computed(
    () =>
      `0 0 var(--sp-10) ${this.status().tone}22, inset 0 var(--f-brand-border-size-default) 0 var(--c-surface-raise)`,
  );

  private ringDelayId: number | null = null;
  private countDelayId: number | null = null;
  private countAnimationFrameId: number | null = null;

  ngOnInit(): void {
    const value = this.result();
    this.analytics.track('results_viewed', {
      score: value?.score ?? 0,
      total: value?.total ?? 0,
      quizTitle: value?.quizTitle ?? '',
    });

    this.startAnimations();
  }

  ngOnDestroy(): void {
    this.cleanupAnimations();
  }

  onViewLeaderboard(): void {
    this.analytics.track('results_leaderboard_tapped');
    void this.router.navigate(['/leaderboard']);
  }

  onReturnHome(): void {
    this.analytics.track('results_home_tapped');
    void this.router.navigateByUrl(this.homeRoute());
  }

  onPlayAgain(): void {
    this.analytics.track('results_play_again');
    void this.router.navigate(['/quiz']);
  }

  private startAnimations(): void {
    const targetPoints = this.store.state().points;
    if (this.prefersReducedMotion()) {
      this.ringProgress.set(this.scorePercent());
      this.displayPoints.set(targetPoints);
      return;
    }

    this.ringDelayId = window.setTimeout(() => {
      this.ringProgress.set(this.scorePercent());
    }, 60);

    this.countDelayId = window.setTimeout(() => {
      const startTime = performance.now();
      const durationMs = 900;
      const run = (now: number): void => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        this.displayPoints.set(Math.round(eased * targetPoints));
        if (progress < 1) {
          this.countAnimationFrameId = window.requestAnimationFrame(run);
        }
      };
      this.countAnimationFrameId = window.requestAnimationFrame(run);
    }, 60);
  }

  private cleanupAnimations(): void {
    if (this.ringDelayId !== null) {
      window.clearTimeout(this.ringDelayId);
      this.ringDelayId = null;
    }
    if (this.countDelayId !== null) {
      window.clearTimeout(this.countDelayId);
      this.countDelayId = null;
    }
    if (this.countAnimationFrameId !== null) {
      window.cancelAnimationFrame(this.countAnimationFrameId);
      this.countAnimationFrameId = null;
    }
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private getStatus(scorePercent: number): { label: string; tone: string } {
    if (scorePercent === 1) return { label: 'Perfect score', tone: 'var(--f-brand-color-accent)' };
    if (scorePercent >= 0.8) return { label: 'Top fan', tone: 'var(--f-brand-color-accent)' };
    if (scorePercent >= 0.6) return { label: 'Good try', tone: 'var(--f-brand-color-status-warning)' };
    if (scorePercent >= 0.4) {
      return { label: 'Keep learning', tone: 'var(--f-brand-color-status-warning)' };
    }
    return { label: 'Better luck next time', tone: 'var(--f-brand-color-status-warning)' };
  }

  private readRouteState(): ResultsRouteState | null {
    const state = (window.history.state ?? null) as Record<string, unknown> | null;
    if (!state) return null;
    const score = state['score'];
    const total = state['total'];
    const quizTitle = state['quizTitle'];
    if (
      typeof score !== 'number' ||
      typeof total !== 'number' ||
      typeof quizTitle !== 'string' ||
      total <= 0
    ) {
      return null;
    }
    return { score, total, quizTitle };
  }
}

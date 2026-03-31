import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppStoreService } from '../../services/app-store.service';
import { AnalyticsService } from '../../services/analytics.service';

interface QuizResultState {
  score: number;
  total: number;
  quizTitle: string;
}

interface ScoreStatus {
  label: string;
  color: string;
}

const RING_SIZE = 204;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE * 2) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function statusLabel(score: number, total: number): ScoreStatus {
  const percentage = total > 0 ? score / total : 0;
  if (percentage === 1) {
    return { label: 'Perfect score', color: 'var(--f-brand-color-background-success)' };
  }
  if (percentage >= 0.8) {
    return { label: 'Top fan', color: 'var(--f-brand-color-background-success)' };
  }
  if (percentage >= 0.6) {
    return { label: 'Good try', color: 'var(--f-brand-color-status-warning)' };
  }
  if (percentage >= 0.4) {
    return { label: 'Keep learning', color: 'var(--f-brand-color-status-warning)' };
  }
  return { label: 'Better luck next time', color: 'var(--f-brand-color-status-warning)' };
}

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly store = inject(AppStoreService);
  private readonly analytics = inject(AnalyticsService);

  private ringDelayId: number | null = null;
  private pointsDelayId: number | null = null;
  private pointsRafId: number | null = null;

  readonly ringSize = RING_SIZE;
  readonly ringStroke = RING_STROKE;
  readonly ringCenter = RING_SIZE / 2;
  readonly ringRadius = RING_RADIUS;
  readonly ringCircumference = RING_CIRCUMFERENCE;

  readonly result = signal<QuizResultState | null>(this.readNavigationState());
  readonly ringProgress = signal(0);
  readonly displayPoints = signal(0);

  readonly score = computed(() => this.result()?.score ?? 0);
  readonly total = computed(() => this.result()?.total ?? 0);
  readonly quizTitle = computed(() => this.result()?.quizTitle ?? 'Quiz complete');
  readonly points = computed(() => this.store.state().points);

  readonly scorePercentage = computed(() => {
    const total = this.total();
    if (total <= 0) {
      return 0;
    }
    return this.score() / total;
  });

  readonly status = computed(() => {
    if (!this.result()) {
      return { label: 'Quiz complete', color: 'var(--f-brand-color-text-light)' };
    }
    return statusLabel(this.score(), this.total());
  });

  readonly ringDashOffset = computed(
    () => this.ringCircumference * (1 - Math.min(Math.max(this.ringProgress(), 0), 1))
  );

  readonly homeRoute = computed(() => (this.store.state().fanCard.teamId ? '/identity' : '/'));

  ngOnInit(): void {
    this.analytics.track('results_viewed', {
      hasResult: Boolean(this.result()),
      points: this.store.state().points,
    });
    this.startAnimations();
  }

  ngOnDestroy(): void {
    if (this.ringDelayId !== null) {
      clearTimeout(this.ringDelayId);
    }
    if (this.pointsDelayId !== null) {
      clearTimeout(this.pointsDelayId);
    }
    if (this.pointsRafId !== null) {
      cancelAnimationFrame(this.pointsRafId);
    }
  }

  onViewLeaderboard(): void {
    this.analytics.track('results_leaderboard_tapped');
    void this.router.navigateByUrl('/leaderboard');
  }

  onReturnHome(): void {
    this.analytics.track('results_home_tapped');
    void this.router.navigateByUrl(this.homeRoute());
  }

  onPlayAgain(): void {
    this.analytics.track('results_play_again');
    void this.router.navigateByUrl('/team-selection');
  }

  private readNavigationState(): QuizResultState | null {
    const stateValue = history.state as Partial<QuizResultState> | undefined;
    if (
      typeof stateValue?.score !== 'number' ||
      typeof stateValue.total !== 'number' ||
      typeof stateValue.quizTitle !== 'string'
    ) {
      return null;
    }
    return {
      score: stateValue.score,
      total: stateValue.total,
      quizTitle: stateValue.quizTitle,
    };
  }

  private startAnimations(): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targetRing = this.scorePercentage();
    const targetPoints = this.store.state().points;

    if (prefersReducedMotion) {
      this.ringProgress.set(targetRing);
      this.displayPoints.set(targetPoints);
      return;
    }

    this.ringDelayId = window.setTimeout(() => {
      this.ringProgress.set(targetRing);
    }, 60);

    const durationMs = 900;
    this.pointsDelayId = window.setTimeout(() => {
      const startAt = performance.now();
      const animateCount = (now: number): void => {
        const elapsed = now - startAt;
        const progress = Math.min(elapsed / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        this.displayPoints.set(Math.round(eased * targetPoints));
        if (progress < 1) {
          this.pointsRafId = requestAnimationFrame(animateCount);
        }
      };
      this.pointsRafId = requestAnimationFrame(animateCount);
    }, 60);
  }
}

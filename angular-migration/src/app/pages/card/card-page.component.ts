import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FanCardPreviewComponent } from '../../components/fan-card-preview/fan-card-preview.component';
import { FLOW_IDS, FlowId } from '../../models/fan-card.model';
import { AnalyticsService } from '../../services/analytics.service';
import { AppStoreService } from '../../services/app-store.service';
import { CardExportService } from '../../services/card-export.service';
import { ShareService } from '../../services/share.service';

interface Milestone {
  key: 'fan-card' | 'first-quiz' | 'all-quizzes' | 'leaderboard';
  label: string;
  icon: string;
}

interface QuizFlow {
  id: FlowId;
  title: string;
  subtitle: string;
}

const MILESTONES: Milestone[] = [
  { key: 'fan-card', label: 'Fan card', icon: '🪪' },
  { key: 'first-quiz', label: '1st quiz', icon: '🎯' },
  { key: 'all-quizzes', label: 'All quizzes', icon: '🔥' },
  { key: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
];

const QUIZ_FLOWS: QuizFlow[] = [
  { id: 'the-connector', title: 'The Connector', subtitle: '5 questions · Quiz' },
  { id: 'the-architect', title: 'The Architect', subtitle: '5 rounds · Card match' },
  { id: 'the-historian', title: 'The Historian', subtitle: '10 statements · Swipe' },
  { id: 'the-referee', title: 'The Referee', subtitle: '5 questions · Quiz' },
  { id: 'the-retrospective', title: 'The Retrospective', subtitle: '5 questions · Ranking' },
];

@Component({
  selector: 'app-card-page',
  standalone: true,
  imports: [CommonModule, FanCardPreviewComponent],
  templateUrl: './card-page.component.html',
  styleUrl: './card-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardPageComponent {
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);
  private readonly cardExport = inject(CardExportService);
  private readonly shareService = inject(ShareService);
  readonly store = inject(AppStoreService);

  readonly milestones = MILESTONES;
  readonly flows = QUIZ_FLOWS;
  readonly busy = signal(false);
  readonly activeFlowId = signal<FlowId | null>(null);

  readonly appState = computed(() => this.store.state());
  readonly fanCard = computed(() => this.appState().fanCard);
  readonly cardComplete = computed(() => this.fanCard().completedAt !== null);
  readonly completedFlowSet = computed(() => new Set<FlowId>(this.appState().completedFlows));
  readonly quizCount = computed(() =>
    this.flows.filter((flow) => this.completedFlowSet().has(flow.id)).length
  );
  readonly allQuizzesDone = computed(() => this.quizCount() >= FLOW_IDS.length);
  readonly leaderboardVisited = computed(() => this.appState().hasVisitedLeaderboard);
  readonly achieved = computed(() => [
    this.cardComplete(),
    this.quizCount() >= 1,
    this.allQuizzesDone(),
    this.leaderboardVisited(),
  ]);
  readonly doneCount = computed(() => this.achieved().filter(Boolean).length);
  readonly allMilestonesComplete = computed(() => this.achieved().every(Boolean));
  readonly currentMilestoneIndex = computed(() => this.achieved().findIndex((item) => !item));
  readonly journeyStatus = computed(() => this.getJourneyStatus(this.doneCount()));
  readonly currentStep = computed(() => Math.min(this.doneCount() + 1, 4));
  readonly journeyCtaLabel = computed(() => {
    if (this.allMilestonesComplete()) {
      return 'Journey complete';
    }
    if (!this.cardComplete()) {
      return 'Complete fan card';
    }
    if (!this.allQuizzesDone()) {
      return 'Start quiz';
    }
    return 'View leaderboard';
  });

  constructor() {
    this.analytics.track('card_viewed', {
      cardComplete: this.cardComplete(),
      completedQuizzes: this.quizCount(),
    });
  }

  milestoneDone(index: number): boolean {
    return this.achieved()[index];
  }

  milestoneCurrent(index: number): boolean {
    return this.currentMilestoneIndex() === index;
  }

  quizLocked(flowId: FlowId): boolean {
    if (!this.cardComplete()) {
      return true;
    }
    return !this.store.isFlowUnlocked(flowId);
  }

  quizCompleted(flowId: FlowId): boolean {
    return this.completedFlowSet().has(flowId);
  }

  flowResult(flowId: FlowId) {
    return this.appState().quizResults[flowId];
  }

  quizSubtitle(flow: QuizFlow): string {
    const result = this.flowResult(flow.id);
    if (this.quizCompleted(flow.id)) {
      return result ? `Completed · ${result.score}/${result.total} correct` : 'Completed';
    }
    if (this.quizLocked(flow.id)) {
      return this.quizLockMessage(flow.id);
    }
    return flow.subtitle;
  }

  quizLockMessage(flowId: FlowId): string {
    if (!this.cardComplete()) {
      return 'Complete your fan card to unlock';
    }
    if (this.store.isFlowUnlocked(flowId)) {
      return '';
    }
    return 'Complete the previous quiz to unlock';
  }

  onEditCard(): void {
    this.analytics.track('card_edit_tapped');
    void this.router.navigateByUrl('/identity');
  }

  async onShare(): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    try {
      const blob = await this.cardExport.renderCardToBlob(this.fanCard());
      await this.shareService.shareFanCard(blob, this.fanCard());
      this.analytics.track('card_shared');
    } catch {
      this.analytics.track('card_share_failed');
    } finally {
      this.busy.set(false);
    }
  }

  async onSaveToDevice(): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    try {
      const blob = await this.cardExport.renderCardToBlob(this.fanCard());
      this.shareService.saveBlobToDevice(blob);
      this.analytics.track('card_saved_to_device');
    } catch {
      this.analytics.track('card_save_failed');
    } finally {
      this.busy.set(false);
    }
  }

  onJourneyCta(): void {
    if (this.allMilestonesComplete()) {
      return;
    }
    if (!this.cardComplete()) {
      this.analytics.track('complete_fan_card_journey_tapped');
      this.onEditCard();
      return;
    }
    if (this.allQuizzesDone()) {
      this.store.markLeaderboardVisited();
      this.analytics.track('card_journey_view_leaderboard_tapped');
      return;
    }

    this.analytics.track('card_start_quiz_tapped');
    this.startFirstUnlockedIncompleteFlow();
  }

  onQuizTap(flowId: FlowId): void {
    if (this.quizLocked(flowId) || this.activeFlowId() === flowId) {
      return;
    }
    this.activeFlowId.set(flowId);
    this.analytics.track('quiz_card_tapped', { quizId: flowId });

    // Stubbed completion flow while quiz routes are migrated.
    window.setTimeout(() => {
      this.store.recordQuizResult(flowId, { score: 5, total: 5 });
      this.store.completeFlow(flowId);
      this.store.addPoints(50);
      this.activeFlowId.set(null);
    }, 260);
  }

  private startFirstUnlockedIncompleteFlow(): void {
    for (const flow of this.flows) {
      if (this.quizCompleted(flow.id)) {
        continue;
      }
      if (this.store.isFlowUnlocked(flow.id)) {
        this.onQuizTap(flow.id);
      }
      return;
    }
  }

  private getJourneyStatus(done: number): string {
    if (done === 0) {
      return 'New arrival';
    }
    if (done === 1) {
      return 'Rising fan';
    }
    if (done === 2) {
      return 'Quiz taker';
    }
    if (done === 3) {
      return 'Top fan';
    }
    return 'Quiz champion';
  }
}

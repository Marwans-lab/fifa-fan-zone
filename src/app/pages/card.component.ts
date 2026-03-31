import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { getTeam } from '../../data/teams'
import { FLOW_IDS, StoreService, type FlowId } from '../../store/store.service'
import { track } from '../../lib/analytics'

interface FlowCard {
  id: FlowId
  title: string
  subtitle: string
  route: string
  state: Record<string, string>
}

@Component({
  selector: 'ffz-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  private readonly router = inject(Router)
  readonly store = inject(StoreService)

  readonly flowCards: FlowCard[] = [
    {
      id: 'the-connector',
      title: 'The Connector',
      subtitle: '5 questions · Quiz',
      route: '/quiz',
      state: { quizId: 'the-connector' },
    },
    {
      id: 'the-architect',
      title: 'The Architect',
      subtitle: '5 rounds · Card Match',
      route: '/card-match',
      state: { flowId: 'the-architect' },
    },
    {
      id: 'the-historian',
      title: 'The Historian',
      subtitle: '10 statements · Swipe',
      route: '/swipe-quiz',
      state: { quizId: 'the-historian' },
    },
    {
      id: 'the-referee',
      title: 'The Referee',
      subtitle: '5 questions · Quiz',
      route: '/quiz',
      state: { quizId: 'the-referee' },
    },
    {
      id: 'the-retrospective',
      title: 'The Retrospective',
      subtitle: '5 questions · Ranking',
      route: '/ranking-quiz',
      state: { quizId: 'the-retrospective' },
    },
  ]

  readonly cardCompleted = computed(() => this.store.state().fanCard.completedAt !== null)
  readonly quizCount = computed(() => this.store.state().completedFlows.length)
  readonly allQuizzesDone = computed(() => this.quizCount() >= FLOW_IDS.length)
  readonly leaderboardDone = computed(() => this.store.state().hasVisitedLeaderboard)
  readonly totalPoints = computed(() => this.store.state().points)
  readonly selectedTeam = computed(() => {
    const teamId = this.store.state().fanCard.teamId
    return teamId ? getTeam(teamId) ?? null : null
  })

  readonly flows = this.flowCards
  readonly state = computed(() => this.store.state())

  isFlowLocked(flowId: FlowId): boolean {
    return !this.cardCompleted() || !this.store.isFlowUnlocked(flowId)
  }

  isFlowCompleted(flowId: FlowId): boolean {
    return this.store.isFlowCompleted(flowId)
  }

  async onStartFlow(route: string, flowId: FlowId): Promise<void> {
    const flow = this.flowCards.find(candidate => candidate.id === flowId)
    if (!flow) {
      return
    }
    if (!this.cardCompleted()) {
      return
    }
    if (!this.store.isFlowUnlocked(flowId)) {
      return
    }
    track('quiz_card_tapped', { quizId: flowId })
    await this.router.navigate([route], { state: flow.state })
  }

  onCreateCard(): void {
    if (this.cardCompleted()) {
      return
    }
    void this.onEditIdentity()
  }

  async onEditIdentity(): Promise<void> {
    track('card_edit_identity_tapped')
    await this.router.navigateByUrl('/identity')
  }

  onSaveCard(): void {
    this.store.updateFanCard({ completedAt: new Date().toISOString() })
    track('card_saved')
  }

  async onShareCard(): Promise<void> {
    const shareText = this.store.state().fanCard.teamId
      ? `My FIFA fan card supports ${this.store.state().fanCard.teamId?.toUpperCase()}`
      : 'My FIFA fan card'
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My FIFA Fan Card',
          text: shareText,
        })
      } else {
        await window.QAApp?.openNativeShare({
          title: 'My FIFA Fan Card',
          text: shareText,
        })
      }
      track('card_shared')
    } catch {
      // User cancelled share or native share unavailable.
    }
  }

  onSaveToDevice(): void {
    const dataUrl = this.store.state().fanCard.photoDataUrl
    if (!dataUrl) {
      return
    }
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = 'my-fan-card.jpg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    track('card_saved_to_device')
  }

  async onLeaderboard(): Promise<void> {
    track('card_leaderboard_tapped')
    await this.router.navigateByUrl('/leaderboard')
  }
}

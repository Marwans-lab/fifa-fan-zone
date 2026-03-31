import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core'
import { NgFor, NgIf, NgStyle } from '@angular/common'
import { ButtonComponent } from '../button/button.component'
import type { FanCardModel, ProfileQuestion, QuestionId } from '../../models/fan-card.model'
import { getTeamCardBackground } from '../../utils/team-card-background'
import { track } from '../../../lib/analytics'
import stadiumIcon from '../../../assets/icons/stadium-white.svg'
import styleIcon from '../../../assets/icons/style-white.svg'
import devotionIcon from '../../../assets/icons/devotion-white.svg'
import vibesIcon from '../../../assets/icons/vibes-white.svg'
import prksIcon from '../../../assets/icons/prks-white.svg'

@Component({
  selector: 'app-fan-card',
  standalone: true,
  imports: [NgFor, NgIf, NgStyle, ButtonComponent],
  templateUrl: './fan-card.component.html',
  styleUrls: ['./fan-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FanCardComponent implements OnChanges {
  @Input({ required: true }) fanCard!: FanCardModel

  @Output() save = new EventEmitter<Record<string, string>>()
  @Output() share = new EventEmitter<void>()
  @Output() saveToDevice = new EventEmitter<void>()

  @ViewChild('frontFace', { static: false }) private frontFaceRef?: ElementRef<HTMLDivElement>

  readonly profileQuestions: readonly ProfileQuestion[] = [
    {
      id: 'playstyle',
      category: 'PLAYSTYLE',
      iconSrc: styleIcon,
      label: 'What kind of fan are you during a match?',
      options: ['The Analyst', 'The superstitious', 'The Hype Leader', 'The calm watcher'],
    },
    {
      id: 'devotion',
      category: 'DEVOTION',
      iconSrc: devotionIcon,
      label: 'How do you follow the World Cup?',
      options: ['Every game', 'My team + big games', 'Highlight only', "I'll catch what I can"],
    },
    {
      id: 'vibes',
      category: 'VIBES',
      iconSrc: vibesIcon,
      label: "What's your match vibes?",
      options: ['Loud and hype', 'Chill and focused', 'Social with friends', 'Family time'],
    },
    {
      id: 'perks',
      category: 'PERKS',
      iconSrc: prksIcon,
      label: `What's your World Cup "perk" goal?`,
      options: ['Win rewards', 'Collect badges & titles', 'Climb the leaderboard', 'Unlock exclusive benefits'],
    },
  ]

  readonly stadiumIconSrc = stadiumIcon

  isFlipped = false
  wizardActive = false
  step = 0
  isSaved = false
  answers: Partial<Record<QuestionId, string>> = {}

  ngOnChanges(): void {
    this.answers = { ...(this.fanCard?.answers ?? {}) } as Partial<Record<QuestionId, string>>
  }

  get currentQuestion(): ProfileQuestion {
    return this.profileQuestions[this.step]
  }

  get currentAnswer(): string | undefined {
    return this.answers[this.currentQuestion.id]
  }

  get isLastStep(): boolean {
    return this.step === this.profileQuestions.length - 1
  }

  get isComplete(): boolean {
    return Boolean(this.fanCard?.completedAt) || this.isSaved
  }

  get rootClassName(): string {
    return `f-fan-card${this.isFlipped ? ' f-fan-card--flipped' : ''}`
  }

  get frontStyle(): Record<string, string> {
    const bg = getTeamCardBackground(this.fanCard?.teamId)
    const isImage = bg.startsWith('url(')
    return {
      ...(isImage
        ? { backgroundImage: bg, backgroundSize: 'cover', backgroundPosition: 'top center' }
        : { background: bg }),
      border: '1px solid var(--c-card-border)',
      pointerEvents: this.isFlipped ? 'none' : 'auto',
    }
  }

  get frontPhotoStyle(): Record<string, string> {
    return {
      position: 'absolute',
      bottom: '0',
      left: '0',
      width: '100%',
      height: 'auto',
      zIndex: '0',
      pointerEvents: 'none',
      display: 'block',
    }
  }

  // Public methods exposed via template reference variable.
  startEditing(): void {
    this.answers = { ...(this.fanCard?.answers ?? {}) } as Partial<Record<QuestionId, string>>
    this.step = 0
    this.isFlipped = true
    this.wizardActive = true
    track('card_edit_tapped')
  }

  flipToBack(): void {
    this.isFlipped = true
    track('card_flipped_to_back')
  }

  getFrontFaceElement(): HTMLDivElement | null {
    return this.frontFaceRef?.nativeElement ?? null
  }

  onCardClick(): void {
    if (!this.isFlipped) {
      this.flipToBack()
    }
  }

  stopPropagation(event: Event): void {
    event.stopPropagation()
  }

  onBackFaceClick(): void {
    this.isFlipped = false
    this.wizardActive = false
    track('card_flipped_to_front')
  }

  startWizard(event: MouseEvent): void {
    event.stopPropagation()
    this.step = 0
    this.wizardActive = true
    track('card_wizard_started')
  }

  selectAnswer(questionId: QuestionId, value: string, event: MouseEvent): void {
    event.stopPropagation()
    this.answers = { ...this.answers, [questionId]: value }
  }

  next(event: MouseEvent): void {
    event.stopPropagation()
    if (this.step < this.profileQuestions.length - 1) {
      this.step += 1
      return
    }
    const filled = Object.fromEntries(
      this.profileQuestions.map((question) => [question.id, this.answers[question.id] ?? '']),
    ) as Record<string, string>
    this.save.emit(filled)
    this.isSaved = true
    this.wizardActive = false
    track('card_profile_saved')
    window.setTimeout(() => {
      this.isFlipped = false
    }, 400)
  }

  back(event: MouseEvent): void {
    event.stopPropagation()
    if (this.step > 0) {
      this.step -= 1
      return
    }
    this.wizardActive = false
  }

  edit(event: MouseEvent): void {
    event.stopPropagation()
    this.startEditing()
  }

  shareCard(event: MouseEvent): void {
    event.stopPropagation()
    this.share.emit()
  }

  saveCard(event: MouseEvent): void {
    event.stopPropagation()
    this.saveToDevice.emit()
  }

  resolveAnswer(id: QuestionId): string {
    return this.answers[id] ?? this.fanCard.answers[id] ?? '—'
  }

}

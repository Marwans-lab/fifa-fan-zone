import { CommonModule } from '@angular/common'
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core'
import { track } from '../../../lib/analytics'
import type { FanCardData } from '../../models/fan-card.model'
import { getTeamCardBackground } from '../../utils/team-card-background'
import { ButtonComponent } from '../button/button.component'
import styleIcon from '../../../assets/icons/style-white.svg'
import devotionIcon from '../../../assets/icons/devotion-white.svg'
import vibesIcon from '../../../assets/icons/vibes-white.svg'
import prksIcon from '../../../assets/icons/prks-white.svg'

type QuestionId = 'playstyle' | 'devotion' | 'vibes' | 'perks'

interface ProfileQuestion {
  id: QuestionId
  category: string
  iconSrc: string
  label: string
  options: readonly string[]
}

const PROFILE_QUESTIONS: readonly ProfileQuestion[] = [
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
    label: 'What\'s your World Cup "perk" goal?',
    options: ['Win rewards', 'Collect badges & titles', 'Climb the leaderboard', 'Unlock exclusive benefits'],
  },
]

const EMPTY_FAN_CARD: FanCardData = {
  teamId: null,
  photoDataUrl: null,
  answers: {},
  completedAt: null,
}

@Component({
  selector: 'ffz-fan-card',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './fan-card.component.html',
  styleUrl: '../../../components/FanCard.css',
})
export class FanCardComponent implements OnChanges {
  @Input() fanCard: FanCardData = EMPTY_FAN_CARD

  @Output() save = new EventEmitter<Record<string, string>>()
  @Output() share = new EventEmitter<void>()
  @Output() saveToDevice = new EventEmitter<void>()
  @Output() flipBack = new EventEmitter<void>()
  @Output() flipFront = new EventEmitter<void>()
  @Output() edit = new EventEmitter<void>()

  @ViewChild('frontFace') private frontFaceRef?: ElementRef<HTMLDivElement>

  readonly profileQuestions = PROFILE_QUESTIONS

  isFlipped = false
  wizardActive = false
  step = 0
  isSaved = false
  answers: Partial<Record<QuestionId, string>> = {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fanCard']) {
      this.answers = this.snapshotAnswers()
      this.isSaved = false
    }
  }

  get rootClassName(): string {
    return `f-fan-card${this.isFlipped ? ' f-fan-card--flipped' : ''}`
  }

  get isComplete(): boolean {
    return this.fanCard.completedAt !== null || this.isSaved
  }

  get currentQuestion(): ProfileQuestion {
    return this.profileQuestions[this.step]
  }

  get currentAnswer(): string | undefined {
    return this.answers[this.currentQuestion.id]
  }

  get isLastQuestion(): boolean {
    return this.step === this.profileQuestions.length - 1
  }

  get frontInlineStyle(): Record<string, string> {
    const bg = getTeamCardBackground(this.fanCard.teamId)
    const isImage = bg.startsWith('url(')
    return {
      ...(isImage
        ? { backgroundImage: bg, backgroundSize: 'cover', backgroundPosition: 'top center' }
        : { background: bg }),
      border: 'var(--f-brand-border-size-default) solid var(--c-card-border)',
      pointerEvents: this.isFlipped ? 'none' : 'auto',
    }
  }

  // Public methods for template references in parent components.
  startEditing(): void {
    this.answers = this.snapshotAnswers()
    this.step = 0
    this.isFlipped = true
    this.wizardActive = true
    this.edit.emit()
    track('card_edit_tapped')
  }

  flipToBack(): void {
    this.isFlipped = true
    this.flipBack.emit()
    track('card_flipped_to_back')
  }

  flipToFront(): void {
    this.isFlipped = false
    this.wizardActive = false
    this.flipFront.emit()
    track('card_flipped_to_front')
  }

  getFrontFaceElement(): HTMLDivElement | null {
    return this.frontFaceRef?.nativeElement ?? null
  }

  onRootClick(): void {
    if (!this.isFlipped) {
      this.flipToBack()
    }
  }

  onBackFaceClick(event: Event): void {
    event.stopPropagation()
    this.flipToFront()
  }

  startWizard(event: Event): void {
    event.stopPropagation()
    this.step = 0
    this.wizardActive = true
    track('card_wizard_started')
  }

  selectOption(id: QuestionId, value: string): void {
    this.answers = { ...this.answers, [id]: value }
  }

  onWizardOptionClick(event: Event, id: QuestionId, value: string): void {
    event.stopPropagation()
    this.selectOption(id, value)
  }

  handleNext(event: Event): void {
    event.stopPropagation()
    if (this.step < this.profileQuestions.length - 1) {
      this.step += 1
      return
    }

    const filled: Record<string, string> = {}
    for (const question of this.profileQuestions) {
      filled[question.id] = this.answers[question.id] ?? ''
    }

    this.save.emit(filled)
    this.isSaved = true
    this.wizardActive = false
    track('card_profile_saved')
    window.setTimeout(() => {
      this.isFlipped = false
    }, 400)
  }

  handleBack(event: Event): void {
    event.stopPropagation()
    if (this.step > 0) {
      this.step -= 1
      return
    }
    this.wizardActive = false
  }

  handleEditTap(event: Event): void {
    event.stopPropagation()
    this.answers = this.snapshotAnswers()
    this.step = 0
    this.wizardActive = true
    this.edit.emit()
    track('card_edit_tapped')
  }

  handleShareTap(event: Event): void {
    event.stopPropagation()
    this.share.emit()
  }

  handleSaveTap(event: Event): void {
    event.stopPropagation()
    this.saveToDevice.emit()
  }

  resolveAnswer(id: QuestionId): string {
    return this.answers[id] ?? this.fanCard.answers[id] ?? '—'
  }

  stopPropagation(event: Event): void {
    event.stopPropagation()
  }

  private snapshotAnswers(): Partial<Record<QuestionId, string>> {
    return { ...this.fanCard.answers } as Partial<Record<QuestionId, string>>
  }
}

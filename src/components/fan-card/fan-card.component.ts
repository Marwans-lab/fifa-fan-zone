import { NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';

import { FanCard } from '../../models/fan-card.model';
import { AnalyticsService } from '../../services/analytics.service';
import { getTeamCardBackground } from '../../utils/team-card-background';
import { ButtonComponent } from '../button/button.component';

const PROFILE_QUESTIONS = [
  {
    id: 'playstyle',
    category: 'Playstyle',
    iconSrc: 'assets/icons/style-white.svg',
    label: 'What kind of fan are you during a match?',
    options: ['The Analyst', 'The superstitious', 'The Hype Leader', 'The calm watcher'],
  },
  {
    id: 'devotion',
    category: 'Devotion',
    iconSrc: 'assets/icons/devotion-white.svg',
    label: 'How do you follow the World Cup?',
    options: ['Every game', 'My team + big games', 'Highlight only', "I'll catch what I can"],
  },
  {
    id: 'vibes',
    category: 'Vibes',
    iconSrc: 'assets/icons/vibes-white.svg',
    label: "What's your match vibes?",
    options: ['Loud and hype', 'Chill and focused', 'Social with friends', 'Family time'],
  },
  {
    id: 'perks',
    category: 'Perks',
    iconSrc: 'assets/icons/prks-white.svg',
    label: `What's your World Cup "perk" goal?`,
    options: [
      'Win rewards',
      'Collect badges & titles',
      'Climb the leaderboard',
      'Unlock exclusive benefits',
    ],
  },
] as const;

type Question = (typeof PROFILE_QUESTIONS)[number];
type QuestionId = Question['id'];

@Component({
  selector: 'app-fan-card',
  standalone: true,
  imports: [NgStyle, ButtonComponent],
  templateUrl: './fan-card.component.html',
  styleUrl: './fan-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FanCardComponent implements OnChanges {
  @Input() fanCard: FanCard = {
    teamId: null,
    photoDataUrl: null,
    answers: {},
    completedAt: null,
  };

  @Output() onSave = new EventEmitter<Record<string, string>>();
  @Output() share = new EventEmitter<void>();
  @Output() saveToDevice = new EventEmitter<void>();

  isFlipped = false;
  wizardActive = false;
  step = 0;
  isSaved = false;
  answers: Partial<Record<QuestionId, string>> = {};

  readonly profileQuestions = PROFILE_QUESTIONS;

  constructor(private readonly analytics: AnalyticsService) {
    this.resetAnswersFromInput();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fanCard']) {
      this.resetAnswersFromInput();
      this.isSaved = false;
    }
  }

  get isComplete(): boolean {
    return this.fanCard.completedAt !== null || this.isSaved;
  }

  get currentQuestion(): Question {
    return this.profileQuestions[this.step] ?? this.profileQuestions[0];
  }

  get currentAnswer(): string | undefined {
    return this.answers[this.currentQuestion.id];
  }

  get isLastQuestion(): boolean {
    return this.step === this.profileQuestions.length - 1;
  }

  get rootClassName(): string {
    return this.isFlipped ? 'f-fan-card f-fan-card--flipped' : 'f-fan-card';
  }

  get frontInlineStyle(): Record<string, string> {
    const background = getTeamCardBackground(this.fanCard.teamId);
    const base = {
      border: '1px solid var(--c-card-border)',
      'pointer-events': this.isFlipped ? 'none' : 'auto',
    };

    if (background.startsWith('url(')) {
      return {
        ...base,
        'background-image': background,
        'background-size': 'cover',
        'background-position': 'top center',
      };
    }

    return {
      ...base,
      background,
    };
  }

  onRootClick(): void {
    if (!this.isFlipped) {
      this.flipToBack();
    }
  }

  startEditing(): void {
    this.resetAnswersFromInput();
    this.step = 0;
    this.isFlipped = true;
    this.wizardActive = true;
    this.analytics.track('card_edit_tapped');
  }

  flipToBack(): void {
    this.isFlipped = true;
    this.analytics.track('card_flipped_to_back');
  }

  flipToFront(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isFlipped = false;
    this.wizardActive = false;
    this.analytics.track('card_flipped_to_front');
  }

  startWizard(event: MouseEvent): void {
    event.stopPropagation();
    this.step = 0;
    this.wizardActive = true;
    this.analytics.track('card_wizard_started');
  }

  handleSelect(id: QuestionId, value: string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.answers = { ...this.answers, [id]: value };
  }

  handleNext(event: MouseEvent): void {
    event.stopPropagation();

    if (this.step < this.profileQuestions.length - 1) {
      this.step += 1;
      return;
    }

    const completedAnswers: Record<string, string> = Object.fromEntries(
      this.profileQuestions.map(question => [question.id, this.answers[question.id] ?? ''])
    );
    this.onSave.emit(completedAnswers);
    this.isSaved = true;
    this.wizardActive = false;
    this.analytics.track('card_profile_saved');
    window.setTimeout(() => {
      this.isFlipped = false;
    }, 400);
  }

  handleBack(event: MouseEvent): void {
    event.stopPropagation();
    if (this.step > 0) {
      this.step -= 1;
      return;
    }

    this.wizardActive = false;
  }

  handleEditTap(event: MouseEvent): void {
    event.stopPropagation();
    this.startEditing();
  }

  handleShareTap(event: MouseEvent): void {
    event.stopPropagation();
    this.share.emit();
  }

  handleSaveTap(event: MouseEvent): void {
    event.stopPropagation();
    this.saveToDevice.emit();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  resolvedAnswer(id: QuestionId): string {
    return this.answers[id] ?? this.fanCard.answers[id] ?? '—';
  }

  isStepActive(index: number): boolean {
    return index <= this.step;
  }

  profileIconMaskStyle(iconSrc: string): Record<string, string> {
    return {
      '-webkit-mask-image': `url('${iconSrc}')`,
      'mask-image': `url('${iconSrc}')`,
    };
  }

  private resetAnswersFromInput(): void {
    this.answers = { ...(this.fanCard.answers as Partial<Record<QuestionId, string>>) };
  }
}

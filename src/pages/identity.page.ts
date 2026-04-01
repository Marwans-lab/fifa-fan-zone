import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { WORLD_CUP_TEAMS } from '../data/teams';
import { AnalyticsService } from '../services/analytics.service';
import { StoreService } from '../services/store.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="identity-page f-page-enter" data-page="identity">
      <button class="identity-page__back" type="button" (click)="goBack()" aria-label="Go back">
        <span aria-hidden="true">‹</span>
      </button>

      <h1 class="identity-page__title">Create your fan identity</h1>
      <p class="identity-page__description">
        Enter your name and pick your match personality.
      </p>

      <form class="identity-page__form" (ngSubmit)="continueToCard()">
        <label class="identity-page__label" for="fan-name">Your name</label>
        <input
          id="fan-name"
          name="fanName"
          class="identity-page__input"
          maxlength="30"
          [ngModel]="fanName()"
          (ngModelChange)="fanName.set($event)"
          placeholder="Enter your name"
          autocomplete="name"
          required
        />

        <label class="identity-page__label" for="personality">Quiz personality</label>
        <select
          id="personality"
          name="personality"
          class="identity-page__input"
          [ngModel]="personality()"
          (ngModelChange)="personality.set($event)"
          required
        >
          <option value="" disabled>Select your style</option>
          @for (option of personalityOptions; track option) {
            <option [value]="option">{{ option }}</option>
          }
        </select>

        <p class="identity-page__team">
          Team:
          <strong>{{ selectedTeamName }}</strong>
        </p>

        <button class="identity-page__cta" type="submit" [disabled]="isSubmitDisabled()">
          Continue
        </button>
      </form>
    </main>
  `,
  styles: [
    `
      .identity-page {
        min-height: 100dvh;
        background: var(--c-lt-bg);
        padding: var(--sp-6) var(--sp-4);
        display: flex;
        flex-direction: column;
        gap: var(--sp-3);
      }

      .identity-page__back {
        width: var(--sp-12);
        min-height: var(--sp-12);
        border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
        border-radius: var(--f-brand-radius-rounded);
        background: var(--f-brand-color-background-light);
        color: var(--f-brand-color-text-default);
        font: var(--f-brand-type-headline);
        cursor: pointer;
      }

      .identity-page__title {
        margin: 0;
        font: var(--f-brand-type-title-2);
        color: var(--f-brand-color-text-default);
      }

      .identity-page__description {
        margin: 0;
        font: var(--f-brand-type-body);
        color: var(--f-brand-color-text-subtle);
      }

      .identity-page__form {
        margin-top: var(--sp-4);
        display: flex;
        flex-direction: column;
        gap: var(--sp-3);
      }

      .identity-page__label {
        font: var(--f-brand-type-subheading);
        color: var(--f-brand-color-text-default);
      }

      .identity-page__input {
        width: 100%;
        min-height: var(--sp-12);
        padding: 0 var(--sp-4);
        border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
        border-radius: var(--f-brand-radius-base);
        background: var(--f-brand-color-background-light);
        color: var(--f-brand-color-text-default);
        font: var(--f-brand-type-body);
      }

      .identity-page__input:focus-visible {
        outline: var(--f-brand-border-size-focused) solid var(--f-brand-color-border-primary);
        outline-offset: var(--f-brand-space-2xs);
      }

      .identity-page__team {
        margin: 0;
        font: var(--f-brand-type-subheading);
        color: var(--f-brand-color-text-subtle);
      }

      .identity-page__team strong {
        color: var(--f-brand-color-text-default);
        font: var(--f-brand-type-subheading-medium);
      }

      .identity-page__cta {
        margin-top: var(--sp-4);
        width: 100%;
        min-height: var(--sp-12);
        border: none;
        border-radius: var(--f-brand-radius-rounded);
        background: var(--f-brand-color-background-primary);
        color: var(--f-brand-color-text-light);
        font: var(--f-brand-type-body-medium);
        cursor: pointer;
      }

      .identity-page__cta:disabled {
        background: var(--f-brand-color-background-disabled);
        color: var(--f-brand-color-text-disabled);
        cursor: not-allowed;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdentityPage {
  private readonly router = inject(Router);
  private readonly store = inject(StoreService);
  private readonly analytics = inject(AnalyticsService);

  readonly personalityOptions = [
    'The analyst',
    'The superstitious',
    'The hype leader',
    'The calm watcher',
  ] as const;

  readonly fanName = signal('');
  readonly personality = signal('');

  get selectedTeamName(): string {
    const teamId = this.store.state().fanCard.teamId;
    return WORLD_CUP_TEAMS.find(team => team.id === teamId)?.name ?? 'Not selected';
  }

  isSubmitDisabled(): boolean {
    return this.fanName().trim().length === 0 || this.personality().trim().length === 0;
  }

  continueToCard(): void {
    const name = this.fanName().trim();
    const personality = this.personality().trim();
    if (!name || !personality) return;

    this.store.updateFanCard({
      answers: {
        ...this.store.state().fanCard.answers,
        identityName: name,
        personality,
      },
      completedAt: new Date().toISOString(),
    });
    this.analytics.track('identity_continue_tapped', { hasName: true, personality });
    void this.router.navigateByUrl('/card');
  }

  goBack(): void {
    void this.router.navigateByUrl('/picture');
  }
}

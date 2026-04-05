import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { removeBackground } from '@imgly/background-removal';

import { ButtonComponent } from '../components/button/button.component';
import { FanCardComponent } from '../components/fan-card/fan-card.component';
import { WORLD_CUP_TEAMS } from '../data/teams';
import { FanCard } from '../models/fan-card.model';
import { AnalyticsService } from '../services/analytics.service';
import { StoreService } from '../services/store.service';
import { getTeamCardBackground } from '../utils/team-card-background';

const BASE_HREF = document.querySelector('base')?.getAttribute('href') ?? '/';
const BG_REMOVAL_PUBLIC_PATH = `${window.location.origin}${BASE_HREF}bg-removal/`;
const PHOTO_SIZE = 480;
const JPG_QUALITY = 0.78;

@Component({
  standalone: true,
  imports: [CommonModule, ButtonComponent, FanCardComponent],
  template: `
    <main class="team-selection-page f-page-enter" data-page="team-selection">
      <header class="team-selection-page__header" data-section="header">
        <button
          class="team-selection-page__back"
          data-ui="back-btn"
          type="button"
          aria-label="Go back"
          (click)="handleBack()"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 class="team-selection-page__title" data-section="title">Select your team</h1>
      </header>

      <section class="team-selection-page__dropdown-wrap" data-section="team-dropdown">
        <button
          class="team-selection-page__dropdown-trigger"
          [class.team-selection-page__dropdown-trigger--placeholder]="!selectedId()"
          type="button"
          data-ui="team-dropdown-btn"
          [attr.aria-expanded]="dropdownOpen()"
          aria-haspopup="listbox"
          (click)="toggleDropdown()"
        >
          <span class="team-selection-page__dropdown-selected">
            @if (selectedTeamFlagClass()) {
              <i class="{{ selectedTeamFlagClass() }}" aria-hidden="true"></i>
            }
            {{ selectedTeamName() ?? 'Select a team' }}
          </span>
          <svg
            class="team-selection-page__dropdown-chevron"
            [class.team-selection-page__dropdown-chevron--open]="dropdownOpen()"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6"></path>
          </svg>
        </button>

        @if (dropdownOpen()) {
          <ul class="team-selection-page__list" role="listbox">
            @for (team of dropdownTeams; track team.id; let isLast = $last) {
              <li
                class="team-selection-page__option"
                role="option"
                [attr.aria-selected]="selectedId() === team.id"
                [class.team-selection-page__option--selected]="selectedId() === team.id"
                [class.team-selection-page__option--with-divider]="!isLast"
                (click)="selectTeam(team.id)"
              >
                <i class="{{ team.flagClass }}" aria-hidden="true"></i>
                {{ team.name }}
              </li>
            }
          </ul>
        }
      </section>

      @if (selectedId()) {
        @if (!hasPhoto()) {
          <section
            class="picture-page__capture"
            data-section="camera-preview"
            [class.picture-page__capture--active]="cameraActive()"
          >
            @if (cameraActive()) {
              <div class="picture-page__camera-feed">
                <video #videoRef class="picture-page__video" autoplay playsinline muted></video>
                <button
                  class="picture-page__capture-button"
                  type="button"
                  data-ui="capture-photo-btn"
                  aria-label="Capture photo"
                  (click)="capturePhoto()"
                >
                  <span class="picture-page__capture-inner"></span>
                </button>
              </div>
            } @else {
              <div class="picture-page__placeholder-wrap">
                <div class="picture-page__placeholder" [ngStyle]="placeholderStyle()">
                  <div class="picture-page__placeholder-shimmer"></div>
                  <div class="picture-page__placeholder-dots"></div>
                  <div class="picture-page__placeholder-stripes"></div>

                  <svg
                    class="picture-page__silhouette"
                    width="364"
                    height="418"
                    viewBox="0 0 364 418"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17.6249 416.239H136.57L331.854 415.696C337.969 416.872 351.678 417.65 357.596 411.353C363.514 405.056 362.823 394.796 361.738 390.453C359.174 372.811 348.542 334.594 326.528 322.868C241.018 276.454 244.568 271.84 240.13 266.683C235.692 261.526 229.182 250.126 232.437 227.326C234.955 209.684 251.965 194.484 256.995 162.998C258.369 154.4 262.617 139.113 264.984 124.456C266.869 112.785 259.658 110.07 256.404 103.556C258.475 65.5565 254.628 57.9566 251.078 49.5424C247.527 41.1282 229.774 1.5 180.657 1.5C131.54 1.5 116.746 36.7854 108.461 49.5424C101.834 59.748 104.319 95.2324 106.39 111.699C94.2589 114.142 98.6116 128.305 106.39 162.998C114.971 201.269 127.102 217.284 128.877 227.326C130.016 233.768 131.325 254.359 122.368 266.683C113.491 278.897 83.0153 302.24 56.9775 313.097C29.5619 324.528 13.088 351.187 8.74836 364.125C4.90186 373.896 -1.60759 395.61 3.12656 404.296C7.86071 412.982 14.7647 415.877 17.6249 416.239Z"
                      fill="var(--f-brand-color-text-light)"
                      fill-opacity="0.5"
                      stroke="var(--c-lt-border)"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-dasharray="8 8"
                    />
                  </svg>

                  <div class="picture-page__take-photo-wrap">
                    <app-button
                      variant="white-filled"
                      className="picture-page__take-photo"
                      data-ui="take-photo-btn"
                      (clicked)="handleTakePhoto()"
                    >
                      Take a photo
                      <img
                        icon-right
                        src="assets/icons/camera-white.svg"
                        width="20"
                        height="20"
                        alt=""
                        style="filter: brightness(0)"
                      />
                    </app-button>
                  </div>
                </div>
              </div>
            }
          </section>
        } @else if (isRemovingBg()) {
          <section class="picture-page__loading" aria-live="polite">
            <div class="picture-page__spinner" aria-hidden="true"></div>
            <p class="picture-page__message">
              @if (bgProgress() > 0 && bgProgress() < 100) {
                Downloading model {{ bgProgress() }}%…
              } @else {
                Removing background…
              }
            </p>
            @if (bgProgress() > 0 && bgProgress() < 100) {
              <div class="picture-page__progress-track">
                <div class="picture-page__progress-fill" [style.width.%]="bgProgress()"></div>
              </div>
            }
          </section>
        } @else {
          <section class="picture-page__preview" data-section="card-preview">
            <app-fan-card [fanCard]="previewFanCard()"></app-fan-card>
          </section>
        }

        @if (bgError(); as message) {
          <p class="picture-page__error">{{ message }}</p>
        }
        @if (cameraError(); as message) {
          <p class="picture-page__error">{{ message }}</p>
        }

        <input
          #fileInputRef
          data-ui="file-upload-input"
          class="picture-page__file-input"
          type="file"
          accept="image/*"
          capture="user"
          (change)="handleFileChange($event)"
        />
      }

      <div class="team-selection-page__spacer"></div>

      @if (hasPhoto() && !isRemovingBg()) {
        <footer class="picture-page__actions" data-section="actions">
          <button
            class="picture-page__secondary"
            type="button"
            data-ui="retake-photo-btn"
            (click)="retakePhoto()"
          >
            Retake photo
          </button>
          <button
            class="picture-page__primary"
            type="button"
            data-ui="confirm-card-btn"
            (click)="confirmPhoto()"
          >
            Confirm card
          </button>
        </footer>
      } @else if (!isRemovingBg()) {
        <p class="team-selection-page__login-prompt">
          Already have a card?
          <span class="team-selection-page__login-link">Log in</span>
        </p>

        @if (!selectedId()) {
          <button
            class="team-selection-page__continue"
            type="button"
            data-section="confirm-cta"
            data-ui="continue-btn"
            disabled
          >
            Add your photo
          </button>
        }
      }
    </main>
  `,
  styles: [
    `
      .team-selection-page {
        min-height: 100dvh;
        width: 100%;
        background: var(--f-brand-color-background-default);
        display: flex;
        flex-direction: column;
        padding: var(--f-brand-space-md);
        box-sizing: border-box;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      .team-selection-page__header {
        display: flex;
        align-items: center;
        gap: var(--f-brand-space-md);
        flex-shrink: 0;
      }

      .team-selection-page__back {
        width: var(--sp-12);
        height: var(--sp-12);
        border: none;
        border-radius: var(--f-brand-radius-rounded);
        background: var(--f-brand-color-background-light);
        display: grid;
        place-items: center;
        cursor: pointer;
        flex-shrink: 0;
      }

      .team-selection-page__back svg {
        width: var(--sp-5);
        height: var(--sp-5);
        stroke: var(--f-brand-color-text-default);
        stroke-width: 2;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .team-selection-page__title {
        margin: 0;
        flex: 1;
        color: var(--f-brand-color-text-default);
        font: var(--f-brand-type-headline);
      }

      .team-selection-page__dropdown-wrap {
        position: relative;
        flex-shrink: 0;
        z-index: 10;
      }

      .team-selection-page__dropdown-trigger {
        width: 100%;
        height: var(--sp-12);
        border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
        border-radius: var(--f-brand-radius-base);
        background: var(--f-brand-color-background-light);
        color: var(--f-brand-color-text-default);
        padding: 0 var(--f-brand-space-md);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font: var(--f-brand-type-body);
        cursor: pointer;
      }

      .team-selection-page__dropdown-trigger--placeholder {
        color: var(--f-brand-color-text-subtle);
      }

      .team-selection-page__dropdown-selected {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
      }

      .team-selection-page__dropdown-chevron {
        width: var(--sp-4);
        height: var(--sp-4);
        stroke: var(--f-brand-color-text-subtle);
        stroke-width: 2;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
        transform: rotate(0deg);
        transition: transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit);
      }

      .team-selection-page__dropdown-chevron--open {
        transform: rotate(180deg);
      }

      .team-selection-page__list {
        position: absolute;
        top: calc(100% + var(--f-brand-space-xs));
        left: 0;
        right: 0;
        list-style: none;
        margin: 0;
        padding: 0 var(--f-brand-space-md);
        max-height: 560px;
        overflow-y: auto;
        scroll-behavior: smooth;
        scrollbar-width: thin;
        scrollbar-color: var(--f-brand-color-text-muted) transparent;
        border: none;
        border-radius: var(--f-brand-radius-base);
        background: var(--f-brand-color-background-light);
        box-shadow: 0px 2px 4px 2px var(--f-brand-shadow-medium);
        z-index: 10;
      }

      .team-selection-page__option {
        width: 100%;
        border: none;
        background: transparent;
        color: var(--f-brand-color-text-default);
        padding: var(--f-brand-space-md) 0;
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        font: var(--f-brand-type-body);
        text-align: left;
        cursor: pointer;
        transition: background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit),
                    color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit);
        border-radius: var(--f-brand-radius-base);
        margin: 0 calc(var(--f-brand-space-md) * -1);
        padding-left: var(--f-brand-space-md);
        padding-right: var(--f-brand-space-md);
      }

      .team-selection-page__option:hover {
        background: var(--f-brand-color-background-default);
      }

      .team-selection-page__option--selected {
        background: var(--c-lt-brand);
        color: var(--f-brand-color-text-inverse);
        border-radius: var(--f-brand-radius-base);
      }

      .team-selection-page__option--selected:hover {
        background: var(--c-lt-brand);
      }

      .team-selection-page__option--with-divider {
        border-bottom: var(--f-brand-border-size-default) solid var(--f-brand-color-background-default);
      }

      .team-selection-page__spacer {
        flex: 1;
        min-height: var(--f-brand-space-xl);
      }

      .team-selection-page__login-prompt {
        margin: 0;
        margin-bottom: var(--f-brand-space-md);
        text-align: center;
        color: var(--f-brand-color-text-default);
        font: var(--f-brand-type-headline);
        flex-shrink: 0;
      }

      .team-selection-page__login-link {
        font-weight: var(--weight-med);
      }

      .team-selection-page__continue {
        width: 100%;
        height: var(--sp-14);
        border: none;
        border-radius: var(--f-brand-radius-rounded);
        background: var(--f-brand-color-primary);
        color: var(--f-brand-color-background-light);
        font: var(--f-brand-type-body-medium);
        cursor: pointer;
        opacity: 1;
        transition: opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit);
        flex-shrink: 0;
      }

      .team-selection-page__continue:disabled {
        opacity: var(--f-brand-opacity-disabled);
        cursor: default;
      }

      /* Picture section styles */

      .picture-page__capture {
        margin-top: var(--f-brand-space-xl);
        margin-left: calc(-1 * var(--f-brand-space-md));
        margin-right: calc(-1 * var(--f-brand-space-md));
        height: var(--c-picture-capture-height);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        flex-shrink: 0;
      }

      .picture-page__capture--active {
        background: var(--f-brand-color-text-light);
      }

      .picture-page__camera-feed {
        width: 100%;
        height: 100%;
        position: relative;
      }

      .picture-page__video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: scaleX(-1);
      }

      .picture-page__capture-button {
        position: absolute;
        bottom: var(--f-brand-space-xl);
        left: 50%;
        transform: translateX(-50%);
        width: var(--sp-18);
        height: var(--sp-18);
        border-radius: var(--f-brand-radius-rounded);
        border: var(--c-capture-ring) solid var(--f-brand-color-text-light);
        background: transparent;
        padding: var(--sp-1);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .picture-page__capture-inner {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: var(--f-brand-radius-rounded);
        background: var(--f-brand-color-text-light);
      }

      .picture-page__placeholder-wrap {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 var(--f-brand-space-md);
        box-sizing: border-box;
      }

      .picture-page__placeholder {
        width: 100%;
        height: 100%;
        border: var(--f-brand-border-size-default) solid var(--c-card-border);
        box-shadow: var(--f-brand-shadow-large);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        background-size: cover;
        background-position: center;
        padding: var(--sp-6) var(--sp-4);
      }

      .picture-page__placeholder-shimmer {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: var(--sp-1);
        background: linear-gradient(
          90deg,
          transparent,
          var(--c-lt-shimmer),
          transparent
        );
      }

      .picture-page__placeholder-dots {
        position: absolute;
        inset: 0;
        background-image: radial-gradient(circle, var(--c-lt-shimmer) 1.5px, transparent 1.5px);
        background-size: var(--sp-4) var(--sp-4);
        mix-blend-mode: overlay;
        pointer-events: none;
      }

      .picture-page__placeholder-stripes {
        position: absolute;
        inset: 0;
        background-image: repeating-linear-gradient(
          -55deg,
          transparent,
          transparent var(--sp-5),
          var(--c-lt-shimmer) var(--sp-5),
          var(--c-lt-shimmer) calc(var(--sp-5) + 1px)
        );
        mix-blend-mode: overlay;
        pointer-events: none;
      }

      .picture-page__silhouette {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: auto;
        pointer-events: none;
        opacity: var(--f-brand-opacity-disabled);
      }

      .picture-page__take-photo-wrap {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        min-width: max-content;
      }

      .picture-page__take-photo {
        width: fit-content;
      }

      .picture-page__loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--f-brand-space-sm);
        padding: var(--f-brand-space-lg) var(--f-brand-space-md);
        margin-top: var(--f-brand-space-xl);
        flex-shrink: 0;
      }

      .picture-page__spinner {
        width: var(--sp-10);
        height: var(--sp-10);
        border-radius: 50%;
        border: var(--f-brand-border-size-focused) solid var(--f-brand-color-border-default);
        border-top-color: var(--f-brand-color-background-primary);
        animation: f-spinner-spin var(--f-brand-motion-duration-gentle) linear infinite;
      }

      .picture-page__message {
        margin: 0;
        color: var(--f-brand-color-text-subtle);
        font: var(--f-brand-type-caption);
      }

      .picture-page__progress-track {
        width: 100%;
        height: var(--sp-2);
        border-radius: var(--f-brand-radius-rounded);
        background: var(--f-brand-color-border-default);
        overflow: hidden;
      }

      .picture-page__progress-fill {
        height: 100%;
        border-radius: var(--f-brand-radius-rounded);
        background: var(--f-brand-color-flight-status-confirmed);
        box-shadow: var(--f-brand-shadow-medium);
        transition: width var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit);
      }

      .picture-page__preview {
        display: flex;
        flex-direction: column;
        gap: var(--f-brand-space-md);
        padding-top: var(--f-brand-space-xl);
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        flex-shrink: 0;
      }

      .picture-page__error {
        margin: var(--f-brand-space-xs) 0 0;
        text-align: center;
        color: var(--f-brand-color-status-error);
        font: var(--f-brand-type-caption);
      }

      .picture-page__file-input {
        display: none;
      }

      .picture-page__actions {
        display: flex;
        gap: var(--f-brand-space-sm);
        flex-shrink: 0;
        padding-bottom: var(--f-brand-space-md);
      }

      .picture-page__secondary,
      .picture-page__primary {
        flex: 1;
        height: var(--sp-14);
        border-radius: var(--f-brand-radius-rounded);
        font: var(--f-brand-type-body-medium);
        cursor: pointer;
      }

      .picture-page__secondary {
        border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
        color: var(--f-brand-color-text-default);
        background: transparent;
      }

      .picture-page__primary {
        border: none;
        color: var(--f-brand-color-text-light);
        background: var(--f-brand-color-primary);
      }

      .team-selection-page__back:focus-visible,
      .picture-page__secondary:focus-visible,
      .picture-page__primary:focus-visible,
      .picture-page__capture-button:focus-visible,
      .team-selection-page__continue:focus-visible {
        outline: var(--f-brand-border-size-focused) solid var(--f-brand-color-border-primary);
        outline-offset: var(--sp-1);
      }

      @media (prefers-reduced-motion: reduce) {
        .picture-page__progress-fill {
          transition: none;
        }

        .picture-page__spinner {
          animation: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSelectionPage implements OnDestroy {
  private readonly router = inject(Router);
  private readonly store = inject(StoreService);
  private readonly analytics = inject(AnalyticsService);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('videoRef');
  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInputRef');
  private stream: MediaStream | null = null;

  readonly dropdownTeams = WORLD_CUP_TEAMS;

  readonly dropdownOpen = signal(true);
  readonly selectedId = signal<string | null>(this.store.state().fanCard.teamId);

  readonly photoDataUrl = signal<string | null>(null);
  readonly cameraActive = signal(false);
  readonly cameraError = signal<string | null>(null);
  readonly bgError = signal<string | null>(null);
  readonly isRemovingBg = signal(false);
  readonly bgProgress = signal(0);
  readonly hasPhoto = computed(() => Boolean(this.photoDataUrl()) || this.isRemovingBg());

  readonly placeholderStyle = computed(() => {
    const bg = getTeamCardBackground(this.selectedId());
    const style: Record<string, string> = {};
    if (bg.startsWith('url(')) {
      style['background-image'] = bg;
      style['background-size'] = 'cover';
      style['background-position'] = 'center';
    } else {
      style['background'] = bg;
    }
    return style;
  });

  readonly previewFanCard = computed<FanCard>(() => ({
    ...this.store.state().fanCard,
    photoDataUrl: this.photoDataUrl(),
    teamId: this.selectedId() ?? this.store.state().fanCard.teamId,
  }));

  selectedTeamName(): string | null {
    const selectedId = this.selectedId();
    if (!selectedId) return null;
    return this.dropdownTeams.find(team => team.id === selectedId)?.name ?? null;
  }

  selectedTeamFlagClass(): string | null {
    const selectedId = this.selectedId();
    if (!selectedId) return null;
    return this.dropdownTeams.find(team => team.id === selectedId)?.flagClass ?? null;
  }

  toggleDropdown(): void {
    this.dropdownOpen.update(isOpen => !isOpen);
  }

  selectTeam(teamId: string): void {
    this.selectedId.set(teamId);
    this.dropdownOpen.set(false);
    this.store.updateFanCard({ teamId });
    this.analytics.track('team_selection_team_selected', { teamId });
  }

  handleBack(): void {
    this.stopCamera();
    this.analytics.track('team_selection_back_tapped');
    void this.router.navigateByUrl('/');
  }

  async handleTakePhoto(): Promise<void> {
    if (this.cameraActive()) {
      await this.capturePhoto();
      return;
    }
    await this.startCamera();
  }

  async capturePhoto(): Promise<void> {
    const video = this.videoRef()?.nativeElement;
    if (!video || video.readyState < 2 || video.videoWidth < 1) {
      return;
    }

    const rawDataUrl = this.compressFromVideo(video);
    this.stopCamera();
    await this.processPhoto(rawDataUrl);
    this.analytics.track('picture_photo_captured');
  }

  handleFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = readEvent => {
      const img = new Image();
      img.onload = async () => {
        const rawDataUrl = this.compressFromImage(img);
        await this.processPhoto(rawDataUrl);
        this.analytics.track('picture_photo_picked');
      };
      img.src = String(readEvent.target?.result ?? '');
    };
    reader.readAsDataURL(file);
  }

  async confirmPhoto(): Promise<void> {
    this.store.updateFanCard({
      teamId: this.selectedId() ?? this.store.state().fanCard.teamId,
      photoDataUrl: this.photoDataUrl(),
    });
    this.analytics.track('picture_confirmed');
    await this.router.navigateByUrl('/card');
  }

  retakePhoto(): void {
    this.photoDataUrl.set(null);
    const input = this.fileInputRef()?.nativeElement;
    if (input) {
      input.value = '';
    }
    this.stopCamera();
    this.analytics.track('picture_retake_tapped');
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const clickedInside = this.hostElement.nativeElement.contains(event.target as Node);
    if (!clickedInside) {
      this.dropdownOpen.set(false);
    }
  }

  private async startCamera(): Promise<void> {
    this.cameraError.set(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      this.fileInputRef()?.nativeElement.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: PHOTO_SIZE },
          height: { ideal: PHOTO_SIZE },
        },
      });
      this.stream = stream;
      this.cameraActive.set(true);
      setTimeout(() => {
        const video = this.videoRef()?.nativeElement;
        if (!video || !this.stream) return;
        video.srcObject = this.stream;
        void video.play();
      });
      this.analytics.track('picture_camera_started');
    } catch {
      this.cameraError.set('Camera unavailable — pick from files instead');
      this.fileInputRef()?.nativeElement.click();
    }
  }

  private stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.cameraActive.set(false);
  }

  private async processPhoto(rawDataUrl: string): Promise<void> {
    this.isRemovingBg.set(true);
    this.bgProgress.set(0);
    this.bgError.set(null);

    try {
      const blob = await removeBackground(rawDataUrl, {
        publicPath: BG_REMOVAL_PUBLIC_PATH,
        model: 'small',
        proxyToWorker: false,
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) {
            this.bgProgress.set(Math.round((current / total) * 100));
          }
        },
      });
      const dataUrl = await this.blobToDataUrl(blob);
      this.photoDataUrl.set(dataUrl);
      this.analytics.track('picture_bg_removed');
    } catch {
      this.bgError.set("Background removal couldn't complete — using original image");
      this.photoDataUrl.set(rawDataUrl);
    } finally {
      this.isRemovingBg.set(false);
    }
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private compressFromVideo(video: HTMLVideoElement): string {
    const width = video.videoWidth;
    const height = video.videoHeight;
    return this.compressFromSource(video, width, height, true);
  }

  private compressFromImage(image: HTMLImageElement): string {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    return this.compressFromSource(image, width, height, false);
  }

  private compressFromSource(
    source: CanvasImageSource,
    sourceWidth: number,
    sourceHeight: number,
    mirrorX: boolean
  ): string {
    const scale = Math.min(PHOTO_SIZE / sourceWidth, PHOTO_SIZE / sourceHeight, 1);
    const width = Math.round(sourceWidth * scale);
    const height = Math.round(sourceHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return '';
    }

    if (mirrorX) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', JPG_QUALITY);
  }
}

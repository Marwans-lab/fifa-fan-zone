import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { removeBackground } from '@imgly/background-removal';

import { AnalyticsService } from '../services/analytics.service';
import { StoreService } from '../services/store.service';
import { getTeamCardBackground } from '../utils/team-card-background';

const BG_REMOVAL_PUBLIC_PATH = `${window.location.origin}/bg-removal/`;
const PHOTO_SIZE = 480;
const JPG_QUALITY = 0.78;

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="picture-page f-page-enter" data-page="picture">
      <header class="picture-page__header" data-section="header">
        <button class="picture-page__back" type="button" aria-label="Go back" (click)="handleBack()">
          <span aria-hidden="true">‹</span>
        </button>
        <div class="picture-page__progress-track">
          <div class="picture-page__progress-fill"></div>
        </div>
      </header>

      <h1 class="picture-page__title">Add your picture</h1>

      @if (!hasPhoto()) {
        <section class="picture-page__capture" data-section="camera-preview">
          @if (cameraActive()) {
            <video #videoRef class="picture-page__video" autoplay playsinline muted></video>
            <button
              class="picture-page__capture-button"
              type="button"
              aria-label="Capture photo"
              (click)="capturePhoto()"
            >
              <span class="picture-page__capture-inner"></span>
            </button>
          } @else {
            <div class="picture-page__placeholder" [style.background]="teamCardBackground()">
              <div class="picture-page__placeholder-overlay"></div>
              <button class="picture-page__take-photo" type="button" (click)="handleTakePhoto()">
                Take a photo
              </button>
            </div>
          }
        </section>
      } @else if (isRemovingBg()) {
        <section class="picture-page__loading" aria-live="polite">
          <div class="picture-page__spinner f-spinner" aria-hidden="true"></div>
          <p class="picture-page__message">
            @if (bgProgress() > 0 && bgProgress() < 100) {
              Downloading model {{ bgProgress() }}%
            } @else {
              Removing background
            }
          </p>
        </section>
      } @else {
        <section class="picture-page__preview" data-section="preview">
          @if (photoDataUrl(); as photo) {
            <img [src]="photo" alt="Preview photo" class="picture-page__preview-image" />
          }
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

      @if (hasPhoto() && !isRemovingBg()) {
        <footer class="picture-page__actions" data-section="actions">
          <button class="picture-page__secondary" type="button" (click)="retakePhoto()">
            Retake photo
          </button>
          <button class="picture-page__primary" type="button" (click)="confirmPhoto()">
            Continue
          </button>
        </footer>
      }
    </main>
  `,
  styles: [
    `
      .picture-page {
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        background: var(--c-lt-bg);
        padding: var(--sp-4);
        gap: var(--sp-4);
      }

      .picture-page__header {
        display: flex;
        align-items: center;
        gap: var(--sp-4);
        padding-top: var(--sp-12);
      }

      .picture-page__back {
        width: var(--sp-12);
        min-width: var(--sp-12);
        min-height: var(--sp-12);
        border: none;
        border-radius: var(--r-full);
        background: var(--c-lt-surface);
        color: var(--c-lt-text-1);
        font: var(--f-brand-type-title-2);
      }

      .picture-page__progress-track {
        flex: 1;
        height: var(--sp-2);
        border-radius: var(--r-full);
        background: var(--c-lt-border);
        overflow: hidden;
      }

      .picture-page__progress-fill {
        width: 50%;
        height: 100%;
        background: linear-gradient(
          to left,
          var(--f-brand-color-border-primary),
          var(--f-brand-color-background-primary)
        );
      }

      .picture-page__title {
        margin: 0;
        text-align: center;
        font: var(--f-brand-type-title-2);
        color: var(--c-lt-text-1);
      }

      .picture-page__capture {
        flex: 1;
        min-height: calc(var(--sp-20) * 6 + var(--sp-6));
      }

      .picture-page__video {
        width: 100%;
        height: 100%;
        border-radius: var(--f-brand-radius-small);
        object-fit: cover;
        transform: scaleX(-1);
      }

      .picture-page__capture-button {
        position: relative;
        width: var(--sp-16);
        min-height: var(--sp-16);
        border-radius: var(--r-full);
        border: var(--c-capture-ring) solid var(--f-brand-color-text-light);
        background: transparent;
      }

      .picture-page__capture-inner {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: var(--r-full);
        background: var(--f-brand-color-text-light);
      }

      .picture-page__placeholder {
        width: 100%;
        height: 100%;
        border-radius: var(--f-brand-radius-outer);
        border: var(--f-brand-border-size-default) solid var(--c-card-border);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }

      .picture-page__placeholder-overlay {
        position: absolute;
        inset: 0;
        background-image: radial-gradient(circle, var(--c-lt-shimmer) var(--sp-1), transparent var(--sp-1));
        background-size: var(--sp-4) var(--sp-4);
      }

      .picture-page__take-photo {
        position: relative;
        min-height: var(--sp-14);
        border: none;
        border-radius: var(--f-brand-radius-rounded);
        background: var(--f-brand-color-text-light);
        color: var(--f-brand-color-text-default);
        font: var(--f-brand-type-body-medium);
        padding: 0 var(--sp-6);
      }

      .picture-page__loading {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--sp-3);
      }

      .picture-page__spinner {
        width: var(--sp-10);
        height: var(--sp-10);
        border-radius: var(--r-full);
        border: var(--f-brand-border-size-focused) solid var(--c-lt-border);
        border-top-color: var(--f-brand-color-border-primary);
      }

      .picture-page__message {
        margin: 0;
        color: var(--c-lt-text-2);
        font: var(--f-brand-type-caption);
      }

      .picture-page__preview {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .picture-page__preview-image {
        width: 100%;
        max-height: calc(var(--sp-20) * 6 + var(--sp-6));
        object-fit: contain;
        border-radius: var(--f-brand-radius-small);
        border: var(--f-brand-border-size-default) solid var(--c-lt-border);
        background: var(--c-lt-surface);
      }

      .picture-page__error {
        margin: 0;
        text-align: center;
        color: var(--c-error);
        font: var(--f-brand-type-caption);
      }

      .picture-page__file-input {
        display: none;
      }

      .picture-page__actions {
        display: flex;
        gap: var(--sp-2);
      }

      .picture-page__secondary,
      .picture-page__primary {
        flex: 1;
        min-height: var(--sp-12);
        border-radius: var(--f-brand-radius-rounded);
        font: var(--f-brand-type-body-medium);
      }

      .picture-page__secondary {
        border: var(--f-brand-border-size-default) solid var(--f-brand-color-border-default);
        color: var(--c-lt-text-1);
        background: transparent;
      }

      .picture-page__primary {
        border: none;
        color: var(--f-brand-color-text-light);
        background: var(--f-brand-color-background-primary);
      }

    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicturePage implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly analytics = inject(AnalyticsService);
  private readonly store = inject(StoreService);

  private readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('videoRef');
  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInputRef');
  private stream: MediaStream | null = null;

  readonly teamId = signal<string | null>(null);
  readonly photoDataUrl = signal<string | null>(this.getIncomingState('photoDataUrl'));
  readonly cameraError = signal<string | null>(null);
  readonly bgError = signal<string | null>(null);
  readonly isRemovingBg = signal(false);
  readonly bgProgress = signal(0);
  readonly cameraActive = signal(false);
  readonly hasPhoto = computed(() => Boolean(this.photoDataUrl()) || this.isRemovingBg());

  readonly teamCardBackground = computed(() => {
    const id = this.teamId() ?? this.store.state().fanCard.teamId;
    return getTeamCardBackground(id);
  });

  ngOnInit(): void {
    const routeTeamId = this.route.snapshot.paramMap.get('teamId');
    const stateTeamId = this.getIncomingState('teamId');
    this.teamId.set(routeTeamId ?? stateTeamId);
    this.restartPageEnterAnimation();
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
      teamId: this.teamId() ?? this.store.state().fanCard.teamId,
      photoDataUrl: this.photoDataUrl(),
    });
    this.analytics.track('picture_confirmed');
    await this.router.navigateByUrl('/identity');
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

  async handleBack(): Promise<void> {
    this.stopCamera();
    if (this.teamId()) {
      await this.router.navigateByUrl('/team-selection');
      return;
    }
    await this.router.navigateByUrl('/');
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  private restartPageEnterAnimation(): void {
    const host = this.elementRef.nativeElement as HTMLElement;
    const main = host.querySelector('.f-page-enter') as HTMLElement | null;
    if (!main) {
      return;
    }

    main.classList.remove('f-page-enter');
    requestAnimationFrame(() => {
      main.classList.add('f-page-enter');
    });
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
      queueMicrotask(() => {
        const video = this.videoRef()?.nativeElement;
        if (!video || !this.stream) return;
        video.srcObject = this.stream;
        void video.play();
      });
      this.analytics.track('picture_camera_started');
    } catch {
      this.cameraError.set("Camera couldn't start — choose a file instead");
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

  private getIncomingState(key: 'teamId' | 'photoDataUrl'): string | null {
    const state = window.history.state as Record<string, unknown> | null;
    const value = state?.[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}

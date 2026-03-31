import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { removeBackground } from '@imgly/background-removal';
import { AnalyticsService } from '../../services/analytics.service';
import { AppStoreService } from '../../services/app-store.service';
import { FanCardPreviewComponent } from '../../components/fan-card-preview/fan-card-preview.component';
import { getTeam } from '../../data/teams';

const BG_REMOVAL_PUBLIC_PATH = `${window.location.origin}/bg-removal/`;

function compressDataUrl(source: HTMLVideoElement | HTMLImageElement, flipX = false): string {
  const sourceWidth =
    source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
  const sourceHeight =
    source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
  const maxSize = 480;
  const scale = Math.min(maxSize / sourceWidth, maxSize / sourceHeight, 1);
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context unavailable');
  }
  if (flipX) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.78);
}

@Component({
  selector: 'app-picture',
  standalone: true,
  imports: [CommonModule, FanCardPreviewComponent],
  templateUrl: './picture.component.html',
  styleUrl: './picture.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PictureComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);
  private readonly store = inject(AppStoreService);

  private readonly stream = signal<MediaStream | null>(null);
  private readonly teamIdState = signal<string | null>(this.readTeamId());

  protected readonly fileInputRef = viewChild.required<HTMLInputElement>('fileInput');
  protected readonly videoRef = viewChild<HTMLVideoElement>('cameraVideo');

  readonly teamId = computed(
    () => this.teamIdState() ?? this.store.state().fanCard.teamId ?? null
  );
  readonly selectedTeam = computed(() => {
    const id = this.teamId();
    return id ? getTeam(id) ?? null : null;
  });
  readonly teamCardBackground = computed(() => {
    const team = this.selectedTeam();
    if (!team) {
      return 'linear-gradient(160deg, var(--c-card-gradient-1) 0%, var(--c-card-gradient-2) 50%, var(--c-card-gradient-3) 100%)';
    }
    return `linear-gradient(160deg, ${team.colors[0]} 0%, ${team.colors[1]} 100%)`;
  });

  readonly cameraActive = computed(() => this.stream() !== null);
  readonly photoDataUrl = signal<string | null>(null);
  readonly removingBg = signal(false);
  readonly bgProgress = signal(0);
  readonly bgError = signal<string | null>(null);
  readonly cameraError = signal<string | null>(null);
  readonly hasPhoto = computed(() => Boolean(this.photoDataUrl()) || this.removingBg());

  constructor() {
    this.analytics.track('picture_viewed');
    effect(() => {
      const stream = this.stream();
      const video = this.videoRef();
      if (stream && video) {
        video.srcObject = stream;
        void video.play().catch(() => undefined);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async onTakePhoto(): Promise<void> {
    if (this.cameraActive()) {
      await this.capturePhoto();
      return;
    }
    await this.startCamera();
  }

  async onCapturePhoto(): Promise<void> {
    await this.capturePhoto();
  }

  async onFileSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      return;
    }
    const rawUrl = await this.readFileAsDataUrl(file);
    const image = await this.loadImage(rawUrl);
    const compressed = compressDataUrl(image);
    this.analytics.track('picture_photo_picked');
    await this.processPhoto(compressed);
  }

  async onRetake(): Promise<void> {
    this.photoDataUrl.set(null);
    this.bgError.set(null);
    this.fileInputRef().value = '';
    this.stopCamera();
    this.analytics.track('picture_retake_tapped');
  }

  onConfirm(): void {
    this.store.updateFanCard({
      teamId: this.teamId(),
      photoDataUrl: this.photoDataUrl(),
    });
    this.analytics.track('picture_confirmed', { teamId: this.teamId() });
    void this.router.navigateByUrl('/identity');
  }

  onBack(): void {
    this.stopCamera();
    void this.router.navigateByUrl('/team-selection');
  }

  private readTeamId(): string | null {
    const stateValue = history.state as { teamId?: unknown };
    return typeof stateValue.teamId === 'string' ? stateValue.teamId : null;
  }

  private async startCamera(): Promise<void> {
    this.cameraError.set(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      this.fileInputRef().click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      this.stream.set(stream);
      this.analytics.track('picture_camera_started');
    } catch {
      this.cameraError.set('Camera unavailable — pick from files instead');
      this.fileInputRef().click();
    }
  }

  private async capturePhoto(): Promise<void> {
    const video = this.videoRef();
    if (!video || video.readyState < 2 || !video.videoWidth) {
      return;
    }
    const compressed = compressDataUrl(video, true);
    this.stopCamera();
    this.analytics.track('picture_photo_captured');
    await this.processPhoto(compressed);
  }

  private stopCamera(): void {
    const stream = this.stream();
    if (!stream) {
      return;
    }
    stream.getTracks().forEach((track) => track.stop());
    this.stream.set(null);
  }

  private async processPhoto(rawDataUrl: string): Promise<void> {
    this.removingBg.set(true);
    this.bgProgress.set(0);
    this.bgError.set(null);
    try {
      const blob = await removeBackground(rawDataUrl, {
        publicPath: BG_REMOVAL_PUBLIC_PATH,
        model: 'small' as 'isnet_quint8',
        proxyToWorker: false,
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) {
            this.bgProgress.set(Math.round((current / total) * 100));
          }
        },
      });
      const outputDataUrl = await this.readBlobAsDataUrl(blob);
      this.photoDataUrl.set(outputDataUrl);
      this.analytics.track('picture_bg_removed');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.bgError.set(message);
      this.photoDataUrl.set(rawDataUrl);
      this.analytics.track('picture_bg_removal_failed', { message });
    } finally {
      this.removingBg.set(false);
    }
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private readBlobAsDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = source;
    });
  }
}

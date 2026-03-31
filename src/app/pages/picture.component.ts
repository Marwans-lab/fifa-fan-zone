import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { removeBackground } from '@imgly/background-removal'
import { StoreService } from '../../store/store.service'
import { getTeamCardBackground } from '../../lib/teamCardBackground'
import { getTeam } from '../../data/teams'
import { track } from '../../lib/analytics'

const BG_REMOVAL_PUBLIC_PATH = window.location.origin + import.meta.env.BASE_URL + 'bg-removal/'

function compressDataUrl(source: HTMLVideoElement | HTMLImageElement, flipX = false): string {
  const sw = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth
  const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight
  const max = 480
  const scale = Math.min(max / sw, max / sh, 1)
  const width = Math.round(sw * scale)
  const height = Math.round(sh * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas context unavailable')
  }
  if (flipX) {
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(source, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', 0.78)
}

@Component({
  selector: 'ffz-picture',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './picture.component.html',
  styleUrl: './picture.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PictureComponent {
  private readonly router = inject(Router)
  private readonly store = inject(StoreService)
  @ViewChild('cameraVideo') private cameraVideoRef?: ElementRef<HTMLVideoElement>
  @ViewChild('fileInput') private fileInputRef?: ElementRef<HTMLInputElement>

  readonly photoDataUrl = signal<string | null>(null)
  readonly cameraError = signal<string | null>(null)
  readonly bgError = signal<string | null>(null)
  readonly removingBg = signal(false)
  readonly bgProgress = signal(0)

  readonly cameraActive = signal(false)

  private stream: MediaStream | null = null
  private readonly routeTeamId = this.readTeamIdFromHistory()
  readonly teamId = computed(() => this.routeTeamId ?? this.store.state().fanCard.teamId ?? null)
  readonly selectedTeam = computed(() => (this.teamId() ? getTeam(this.teamId()!) : null))
  readonly teamCardBackground = computed(() => getTeamCardBackground(this.teamId()))
  readonly hasPhoto = computed(() => !!this.photoDataUrl() || this.removingBg())

  constructor() {
    track('picture_viewed')
  }

  onBack(): void {
    this.stopCamera()
    void this.router.navigateByUrl('/team-selection')
  }

  async onTakePhoto(): Promise<void> {
    if (this.cameraActive()) {
      await this.capturePhoto()
      return
    }
    await this.startCamera()
  }

  async onCapturePhoto(): Promise<void> {
    await this.capturePhoto()
  }

  async onFileSelected(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) {
      return
    }
    const dataUrl = await this.readFileAsDataUrl(file)
    const image = await this.loadImage(dataUrl)
    const compressed = compressDataUrl(image)
    track('picture_photo_picked')
    await this.processPhoto(compressed)
  }

  async onRetake(): Promise<void> {
    this.photoDataUrl.set(null)
    this.bgError.set(null)
    const input = this.fileInputRef?.nativeElement
    if (input) {
      input.value = ''
    }
    this.stopCamera()
    track('picture_retake_tapped')
  }

  onConfirm(): void {
    this.store.updateFanCard({ photoDataUrl: this.photoDataUrl(), teamId: this.teamId() })
    track('picture_confirmed')
    void this.router.navigateByUrl('/identity')
  }

  private readTeamIdFromHistory(): string | null {
    const stateValue = history.state as { teamId?: unknown }
    return typeof stateValue.teamId === 'string' ? stateValue.teamId : null
  }

  private async startCamera(): Promise<void> {
    this.cameraError.set(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      this.fileInputRef?.nativeElement.click()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      })
      this.stream = stream
      this.cameraActive.set(true)
      const video = this.cameraVideoRef?.nativeElement
      if (video) {
        video.srcObject = stream
        void video.play().catch(() => undefined)
      }
      track('picture_camera_started')
    } catch {
      this.cameraError.set('Camera unavailable - pick from files instead')
      this.fileInputRef?.nativeElement.click()
    }
  }

  private stopCamera(): void {
    if (!this.stream) {
      this.cameraActive.set(false)
      return
    }
    this.stream.getTracks().forEach(track => track.stop())
    this.stream = null
    this.cameraActive.set(false)
  }

  private async capturePhoto(): Promise<void> {
    const video = this.cameraVideoRef?.nativeElement
    if (!video || video.readyState < 2 || !video.videoWidth) {
      return
    }
    const rawUrl = compressDataUrl(video, true)
    this.stopCamera()
    track('picture_photo_captured')
    await this.processPhoto(rawUrl)
  }

  private async processPhoto(rawDataUrl: string): Promise<void> {
    this.removingBg.set(true)
    this.bgProgress.set(0)
    this.bgError.set(null)
    try {
      const blob = await removeBackground(rawDataUrl, {
        publicPath: BG_REMOVAL_PUBLIC_PATH,
        model: 'small',
        proxyToWorker: false,
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) {
            this.bgProgress.set(Math.round((current / total) * 100))
          }
        },
      })
      const dataUrl = await this.readBlobAsDataUrl(blob)
      this.photoDataUrl.set(dataUrl)
      track('picture_bg_removed')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.bgError.set(message)
      this.photoDataUrl.set(rawDataUrl)
    } finally {
      this.removingBg.set(false)
    }
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  private readBlobAsDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  private loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = source
    })
  }
}

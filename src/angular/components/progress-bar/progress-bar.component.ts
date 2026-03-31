import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'

@Component({
  selector: 'ffz-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-bar.component.html',
})
export class ProgressBarComponent {
  @Input() progress = 0

  get clampedProgress(): number {
    return Math.max(0, Math.min(100, this.progress))
  }

  get trackStyle(): Record<string, string> {
    return {
      flex: '1',
      height: 'var(--sp-2)',
      borderRadius: 'var(--f-brand-radius-rounded)',
      background: 'var(--f-brand-color-border-default)',
      overflow: 'hidden',
    }
  }

  get fillStyle(): Record<string, string> {
    return {
      width: `${this.clampedProgress}%`,
      height: '100%',
      borderRadius: 'var(--f-brand-radius-rounded)',
      background:
        'linear-gradient(-90deg, var(--f-brand-color-border-success) 61.5%, var(--f-brand-color-background-success) 100%)',
      boxShadow: 'var(--f-brand-shadow-medium)',
      transition: 'width var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit)',
    }
  }
}

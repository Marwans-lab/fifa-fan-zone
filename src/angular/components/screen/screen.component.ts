import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'

@Component({
  selector: 'ffz-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './screen.component.html',
})
export class ScreenComponent {
  @Input() centered = false
  @Input() className = ''

  get classes(): string[] {
    return ['f-screen', this.centered ? 'f-screen--centered' : '', this.className].filter(Boolean)
  }

  get safeAreaStyle(): Record<string, string> {
    return {
      paddingTop: 'env(safe-area-inset-top, var(--f-brand-space-none))',
      paddingRight: 'env(safe-area-inset-right, var(--f-brand-space-none))',
      paddingBottom: 'env(safe-area-inset-bottom, var(--f-brand-space-none))',
      paddingLeft: 'env(safe-area-inset-left, var(--f-brand-space-none))',
    }
  }
}

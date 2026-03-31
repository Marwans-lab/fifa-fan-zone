import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, Output } from '@angular/core'

type ButtonVariant = 'primary' | 'secondary'

@Component({
  selector: 'ffz-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary'
  @Input() disabled = false
  @Input() iconRight: string | null = null
  @Input() iconRightAlt = ''
  @Input() className = ''
  @Input() type: 'button' | 'submit' | 'reset' = 'button'
  @Input() ariaLabel: string | null = null

  @Output() buttonClick = new EventEmitter<MouseEvent>()

  get classes(): string[] {
    const variantClass = this.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'
    return ['btn', variantClass, this.className].filter(Boolean)
  }

  onClick(event: MouseEvent): void {
    this.buttonClick.emit(event)
  }
}

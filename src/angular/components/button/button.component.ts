import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { NgIf } from '@angular/common'

type ButtonVariant = 'primary' | 'secondary'

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgIf],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary'
  @Input() disabled = false
  @Input() iconRight: string | null = null
  @Input() iconRightAlt = ''
  @Input() className = ''
  @Input() type: 'button' | 'submit' | 'reset' = 'button'

  @Output() pressed = new EventEmitter<MouseEvent>()

  get classes(): string[] {
    return [
      'btn',
      this.variant === 'secondary' ? 'btn-secondary' : 'btn-primary',
      this.className,
    ]
      .filter((value) => value.length > 0)
  }

  onClick(event: MouseEvent): void {
    if (this.disabled) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    this.pressed.emit(event)
  }
}

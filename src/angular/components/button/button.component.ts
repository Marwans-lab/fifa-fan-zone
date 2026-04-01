import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  booleanAttribute,
} from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'white-outlined' | 'white-filled';
type ButtonSize = 'default' | 'sm' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'default';
  @Input({ transform: booleanAttribute }) fullWidth = false;
  @Input({ transform: booleanAttribute }) loading = false;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input() className = '';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  @Output() clicked = new EventEmitter<MouseEvent>();

  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }

  get classList(): string[] {
    return [
      'f-button',
      this.variant !== 'primary' ? `f-button--${this.variant}` : '',
      this.size !== 'default' ? `f-button--${this.size}` : '',
      this.fullWidth ? 'f-button--full-width' : '',
      this.className,
    ].filter(Boolean);
  }

  onButtonClick(event: MouseEvent): void {
    if (this.isDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.clicked.emit(event);
  }
}

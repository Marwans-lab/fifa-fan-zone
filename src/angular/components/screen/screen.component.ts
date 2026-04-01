import { NgClass, NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, booleanAttribute } from '@angular/core';

@Component({
  selector: 'app-screen',
  standalone: true,
  imports: [NgClass, NgStyle],
  templateUrl: './screen.component.html',
  styleUrl: './screen.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreenComponent {
  @Input() className = '';
  @Input({ transform: booleanAttribute }) centered = false;
  @Input() style: string | null = null;

  get classList(): string[] {
    return ['f-screen', this.centered ? 'f-screen--centered' : '', this.className].filter(Boolean);
  }
}

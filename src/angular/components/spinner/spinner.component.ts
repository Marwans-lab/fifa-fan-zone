import { ChangeDetectionStrategy, Component, Input, booleanAttribute } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [NgIf],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  @Input({ transform: booleanAttribute }) fullScreen = false;
  @Input() size = 32;
}

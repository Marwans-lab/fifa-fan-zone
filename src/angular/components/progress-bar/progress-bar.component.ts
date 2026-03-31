import { ChangeDetectionStrategy, Component, Input } from '@angular/core'

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent {
  @Input() progress = 0

  get normalizedProgress(): number {
    return Math.max(0, Math.min(100, this.progress))
  }
}

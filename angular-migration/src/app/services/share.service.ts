import { Injectable } from '@angular/core';
import { FanCard } from '../models/fan-card.model';

@Injectable({ providedIn: 'root' })
export class ShareService {
  async shareFanCard(blob: Blob, fanCard: FanCard): Promise<void> {
    const file = new File([blob], 'fan-card.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'My FIFA fan card' });
      return;
    }

    if (window.QAApp?.openNativeShare) {
      await window.QAApp.openNativeShare({
        title: 'My FIFA fan card',
        text: this.buildShareText(fanCard),
      });
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: 'My FIFA fan card',
        text: this.buildShareText(fanCard),
      });
      return;
    }

    throw new Error('No supported share mechanism available');
  }

  saveBlobToDevice(blob: Blob, filename = 'my-fan-card.png'): void {
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(downloadUrl);
  }

  private buildShareText(fanCard: FanCard): string {
    const lines: string[] = ['My FIFA fan card'];
    if (fanCard.teamId) {
      lines.push(`Team: ${fanCard.teamId.toUpperCase()}`);
    }
    return lines.join('\n');
  }
}

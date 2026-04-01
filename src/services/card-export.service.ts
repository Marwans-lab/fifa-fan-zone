import { Injectable } from '@angular/core';

import { type FanCard } from '../models/fan-card.model';

const FIELD_ORDER = ['playstyle', 'devotion', 'vibes', 'perks'] as const;

const FIELD_META: Record<string, { category: string }> = {
  playstyle: { category: 'PLAYSTYLE' },
  devotion: { category: 'DEVOTION' },
  vibes: { category: 'VIBES' },
  perks: { category: 'PERKS' },
};

export interface ScorecardExportInput {
  teamId: string | null;
  points: number;
  completedQuizzes: number;
  totalQuizzes: number;
}

@Injectable({ providedIn: 'root' })
export class CardExportService {
  async renderCardToBlob(fanCard: FanCard): Promise<Blob> {
    const width = 300;
    const height = 420;
    const dpr = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas rendering context unavailable');
    }

    context.scale(dpr, dpr);

    const cardGradient = context.createLinearGradient(width * 0.8, 0, 0, height);
    cardGradient.addColorStop(0, '#1a1a2a');
    cardGradient.addColorStop(1, '#0d0d1a');
    context.fillStyle = cardGradient;
    this.roundedRect(context, 0, 0, width, height, 20);
    context.fill();

    let photoHeight = 0;
    if (fanCard.photoDataUrl) {
      try {
        const image = await this.loadImage(fanCard.photoDataUrl, 'Failed to load fan photo');
        const naturalAspect = image.naturalWidth > 0 ? image.naturalHeight / image.naturalWidth : 0.8;
        const minAspect = (height * 0.55) / width;
        const maxAspect = (height * 0.65) / width;
        const imageAspect = Math.max(minAspect, Math.min(maxAspect, naturalAspect));
        photoHeight = width * imageAspect;

        context.save();
        this.roundedRect(context, 0, 0, width, height, 20);
        context.clip();
        context.drawImage(image, 0, 0, width, photoHeight);
        context.restore();
      } catch {
        photoHeight = 0;
      }
    }

    context.strokeStyle = 'rgba(0,212,170,0.27)';
    context.lineWidth = 1;
    this.roundedRect(context, 0, 0, width, height, 20);
    context.stroke();

    const stripe = context.createLinearGradient(0, 0, width, 0);
    stripe.addColorStop(0, 'transparent');
    stripe.addColorStop(0.35, '#00d4aa');
    stripe.addColorStop(0.5, '#ffffff');
    stripe.addColorStop(0.65, '#00d4aa');
    stripe.addColorStop(1, 'transparent');
    context.save();
    context.globalAlpha = 0.6;
    context.fillStyle = stripe;
    context.fillRect(0, 0, width, 4);
    context.restore();

    const hasPhoto = photoHeight > 0;
    const headerTitleY = hasPhoto ? photoHeight + 14 : 38;
    const headerSubtitleY = hasPhoto ? photoHeight + 27 : 54;
    context.textAlign = 'center';
    context.fillStyle = '#00d4aa';
    context.font = hasPhoto ? 'bold 9px -apple-system, sans-serif' : 'bold 10px -apple-system, sans-serif';
    context.fillText('FIFA FAN ZONE', width / 2, headerTitleY);

    context.fillStyle = 'rgba(255,255,255,0.4)';
    context.font = hasPhoto ? '10px -apple-system, sans-serif' : '11px -apple-system, sans-serif';
    context.fillText('Collector edition', width / 2, headerSubtitleY);

    let cursorY = hasPhoto ? photoHeight + 40 : 74;
    if (fanCard.teamId) {
      context.fillStyle = '#00d4aa';
      context.font = hasPhoto ? 'bold 11px -apple-system, sans-serif' : 'bold 13px -apple-system, sans-serif';
      context.fillText(fanCard.teamId.toUpperCase(), width / 2, cursorY);
      cursorY += hasPhoto ? 14 : 16;
    }

    const isComplete = fanCard.completedAt !== null;
    if (isComplete) {
      const badgeWidth = hasPhoto ? 78 : 86;
      const badgeHeight = hasPhoto ? 16 : 18;
      const badgeX = width / 2 - badgeWidth / 2;
      const badgeY = cursorY + 2;
      context.strokeStyle = '#00d4aa';
      context.lineWidth = 1;
      this.roundedRect(context, badgeX, badgeY, badgeWidth, badgeHeight, 4);
      context.stroke();
      context.fillStyle = '#00d4aa';
      context.font = hasPhoto ? '9px -apple-system, sans-serif' : '10px -apple-system, sans-serif';
      context.fillText('COMPLETE', width / 2, badgeY + (hasPhoto ? 12 : 13));
      cursorY += badgeHeight + (hasPhoto ? 10 : 14);
    } else {
      cursorY += hasPhoto ? 6 : 8;
    }

    if (isComplete) {
      const rowX = hasPhoto ? 16 : 20;
      const rowWidth = hasPhoto ? width - 32 : width - 40;
      const rowHeight = hasPhoto ? 18 : 34;
      const rowStep = hasPhoto ? 22 : 42;
      const categoryY = hasPhoto ? 8 : 12;
      const answerY = hasPhoto ? 16 : 26;
      const maxAnswerLength = hasPhoto ? 20 : 24;

      FIELD_ORDER.forEach((field, index) => {
        const rowY = cursorY + index * rowStep;
        const answer = fanCard.answers[field] ?? '—';
        const label = answer.length > maxAnswerLength ? `${answer.slice(0, maxAnswerLength)}…` : answer;

        context.fillStyle = 'rgba(255,255,255,0.05)';
        this.roundedRect(context, rowX, rowY, rowWidth, rowHeight, 8);
        context.fill();

        context.fillStyle = '#00d4aa';
        context.font = hasPhoto ? '8px -apple-system, sans-serif' : '9px -apple-system, sans-serif';
        context.textAlign = 'left';
        context.fillText(FIELD_META[field].category, rowX + 16, rowY + categoryY);

        context.fillStyle = '#ffffff';
        context.font = hasPhoto ? '10px -apple-system, sans-serif' : '12px -apple-system, sans-serif';
        context.fillText(label, rowX + 16, rowY + answerY);
      });
    }

    return this.canvasToBlob(canvas);
  }

  async renderScorecardToBlob(input: ScorecardExportInput): Promise<Blob> {
    const width = 300;
    const height = 420;
    const dpr = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas rendering context unavailable');
    }

    context.scale(dpr, dpr);

    const background = context.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#0f1a2f');
    background.addColorStop(1, '#07101f');
    context.fillStyle = background;
    this.roundedRect(context, 0, 0, width, height, 20);
    context.fill();

    context.strokeStyle = 'rgba(255,255,255,0.2)';
    context.lineWidth = 1;
    this.roundedRect(context, 0, 0, width, height, 20);
    context.stroke();

    context.fillStyle = '#00d4aa';
    context.textAlign = 'center';
    context.font = 'bold 12px -apple-system, sans-serif';
    context.fillText('FIFA FAN ZONE', width / 2, 36);

    context.fillStyle = '#ffffff';
    context.font = 'bold 24px -apple-system, sans-serif';
    context.fillText('Journey scorecard', width / 2, 74);

    context.font = '14px -apple-system, sans-serif';
    context.fillStyle = 'rgba(255,255,255,0.84)';
    context.fillText(input.teamId ? `Team: ${input.teamId.toUpperCase()}` : 'Team not selected', width / 2, 104);

    const boxX = 28;
    const boxWidth = width - 56;
    const rowHeight = 56;
    const firstRowY = 156;
    const gap = 20;

    this.drawScoreRow(context, boxX, firstRowY, boxWidth, rowHeight, 'Points', `${input.points}`);
    this.drawScoreRow(
      context,
      boxX,
      firstRowY + rowHeight + gap,
      boxWidth,
      rowHeight,
      'Quizzes',
      `${input.completedQuizzes}/${input.totalQuizzes}`
    );

    context.fillStyle = 'rgba(255,255,255,0.7)';
    context.font = '12px -apple-system, sans-serif';
    context.fillText('Keep playing to reach the leaderboard top 5.', width / 2, height - 36);

    return this.canvasToBlob(canvas);
  }

  private drawScoreRow(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    value: string
  ): void {
    context.fillStyle = 'rgba(255,255,255,0.08)';
    this.roundedRect(context, x, y, width, height, 12);
    context.fill();

    context.strokeStyle = 'rgba(255,255,255,0.18)';
    context.lineWidth = 1;
    this.roundedRect(context, x, y, width, height, 12);
    context.stroke();

    context.textAlign = 'left';
    context.fillStyle = 'rgba(255,255,255,0.72)';
    context.font = '12px -apple-system, sans-serif';
    context.fillText(label, x + 16, y + 23);

    context.fillStyle = '#00d4aa';
    context.font = 'bold 22px -apple-system, sans-serif';
    context.fillText(value, x + 16, y + 44);
  }

  private loadImage(src: string, errorMessage = 'Failed to load image'): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(errorMessage));
      image.src = src;
    });
  }

  private roundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.arcTo(x + width, y, x + width, y + radius, radius);
    context.lineTo(x + width, y + height - radius);
    context.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    context.lineTo(x + radius, y + height);
    context.arcTo(x, y + height, x, y + height - radius, radius);
    context.lineTo(x, y + radius);
    context.arcTo(x, y, x + radius, y, radius);
    context.closePath();
  }

  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error('canvas.toBlob failed'));
      }, 'image/png');
    });
  }
}

import { Injectable } from '@angular/core';
import { FanCard } from '../models/fan-card.model';

const FIELD_ORDER = ['playstyle', 'devotion', 'vibes', 'perks'] as const;

const FIELD_META: Record<string, { category: string }> = {
  playstyle: { category: 'PLAYSTYLE' },
  devotion: { category: 'DEVOTION' },
  vibes: { category: 'VIBES' },
  perks: { category: 'PERKS' },
};

function loadImage(src: string, errorMessage = 'Failed to load image'): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(errorMessage));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Unable to export image'));
      }
    }, 'image/png');
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
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
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas rendering context unavailable');
    }
    ctx.scale(dpr, dpr);

    const background = ctx.createLinearGradient(width * 0.8, 0, 0, height);
    background.addColorStop(0, '#1a1a2a');
    background.addColorStop(1, '#0d0d1a');
    ctx.fillStyle = background;
    roundedRect(ctx, 0, 0, width, height, 20);
    ctx.fill();

    let photoHeight = 0;
    if (fanCard.photoDataUrl) {
      try {
        const image = await loadImage(fanCard.photoDataUrl, 'Failed to load fan photo');
        const naturalAspect = image.naturalWidth > 0 ? image.naturalHeight / image.naturalWidth : 0.8;
        const minAspect = (height * 0.55) / width;
        const maxAspect = (height * 0.65) / width;
        const photoAspect = Math.max(minAspect, Math.min(maxAspect, naturalAspect));
        photoHeight = width * photoAspect;

        ctx.save();
        roundedRect(ctx, 0, 0, width, height, 20);
        ctx.clip();
        ctx.drawImage(image, 0, 0, width, photoHeight);
        ctx.restore();
      } catch {
        photoHeight = 0;
      }
    }

    ctx.strokeStyle = 'rgba(0,212,170,0.27)';
    ctx.lineWidth = 1;
    roundedRect(ctx, 0, 0, width, height, 20);
    ctx.stroke();

    const stripe = ctx.createLinearGradient(0, 0, width, 0);
    stripe.addColorStop(0, 'transparent');
    stripe.addColorStop(0.35, '#00d4aa');
    stripe.addColorStop(0.5, '#ffffff');
    stripe.addColorStop(0.65, '#00d4aa');
    stripe.addColorStop(1, 'transparent');
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = stripe;
    ctx.fillRect(0, 0, width, 4);
    ctx.restore();

    const hasPhoto = photoHeight > 0;
    const headerTitleY = hasPhoto ? photoHeight + 14 : 38;
    const headerSubtitleY = hasPhoto ? photoHeight + 27 : 54;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00d4aa';
    ctx.font = hasPhoto ? 'bold 9px -apple-system, sans-serif' : 'bold 10px -apple-system, sans-serif';
    ctx.fillText('FIFA FAN ZONE', width / 2, headerTitleY);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = hasPhoto ? '10px -apple-system, sans-serif' : '11px -apple-system, sans-serif';
    ctx.fillText('Collector Edition', width / 2, headerSubtitleY);

    let currentY = hasPhoto ? photoHeight + 40 : 74;
    if (fanCard.teamId) {
      ctx.fillStyle = '#00d4aa';
      ctx.font = hasPhoto ? 'bold 11px -apple-system, sans-serif' : 'bold 13px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fanCard.teamId.toUpperCase(), width / 2, currentY);
      currentY += hasPhoto ? 14 : 16;
    }

    const complete = Boolean(fanCard.completedAt);
    if (complete) {
      const badgeWidth = hasPhoto ? 78 : 86;
      const badgeHeight = hasPhoto ? 16 : 18;
      const badgeX = width / 2 - badgeWidth / 2;
      const badgeY = currentY + 2;
      ctx.strokeStyle = '#00d4aa';
      ctx.lineWidth = 1;
      roundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 4);
      ctx.stroke();
      ctx.fillStyle = '#00d4aa';
      ctx.font = hasPhoto ? '9px -apple-system, sans-serif' : '10px -apple-system, sans-serif';
      ctx.fillText('COMPLETE', width / 2, badgeY + (hasPhoto ? 12 : 13));
      currentY += badgeHeight + (hasPhoto ? 10 : 14);
    } else {
      currentY += hasPhoto ? 6 : 8;
    }

    if (complete) {
      const rowX = hasPhoto ? 16 : 20;
      const rowWidth = hasPhoto ? width - 32 : width - 40;
      const rowHeight = hasPhoto ? 18 : 34;
      const rowStep = hasPhoto ? 22 : 42;
      const categoryY = hasPhoto ? 8 : 12;
      const answerY = hasPhoto ? 16 : 26;
      const maxAnswerLength = hasPhoto ? 20 : 24;

      FIELD_ORDER.forEach((key, index) => {
        const rowY = currentY + index * rowStep;
        const answer = fanCard.answers[key] ?? '—';
        const category = FIELD_META[key].category;

        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        roundedRect(ctx, rowX, rowY, rowWidth, rowHeight, 8);
        ctx.fill();

        ctx.fillStyle = '#00d4aa';
        ctx.font = hasPhoto ? '8px -apple-system, sans-serif' : '9px -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(category, rowX + 16, rowY + categoryY);

        ctx.fillStyle = '#ffffff';
        ctx.font = hasPhoto ? '10px -apple-system, sans-serif' : '12px -apple-system, sans-serif';
        const label =
          answer.length > maxAnswerLength ? `${answer.slice(0, maxAnswerLength)}…` : answer;
        ctx.fillText(label, rowX + 16, rowY + answerY);
      });
    }

    return canvasToBlob(canvas);
  }

  async renderScorecardToBlob(options: {
    score: number;
    total: number;
    quizTitle: string;
    totalPts: number;
  }): Promise<Blob> {
    const width = 320;
    const height = 240;
    const dpr = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas rendering context unavailable');
    }
    ctx.scale(dpr, dpr);

    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#1a1a2a');
    background.addColorStop(1, '#0d0d1a');
    ctx.fillStyle = background;
    roundedRect(ctx, 0, 0, width, height, 20);
    ctx.fill();

    ctx.strokeStyle = 'rgba(200,16,46,0.6)';
    ctx.lineWidth = 2;
    roundedRect(ctx, 1, 1, width - 2, height - 2, 19);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#c8102e';
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.fillText('FIFA FAN ZONE', width / 2, 32);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText(options.quizTitle, width / 2, 52);

    const centerX = width / 2;
    const centerY = 130;
    const radius = 52;
    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    const progress = options.total > 0 ? options.score / options.total : 0;
    if (progress > 0) {
      ctx.strokeStyle = '#00d4aa';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px -apple-system, sans-serif';
    ctx.fillText(`${options.score}/${options.total}`, centerX, centerY + 8);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('Points', centerX, centerY + 26);

    ctx.fillStyle = '#00d4aa';
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.fillText(`Total: ${options.totalPts} pts`, width / 2, height - 24);

    return canvasToBlob(canvas);
  }

  buildShareText(fanCard: FanCard): string {
    const lines: string[] = ['My FIFA Fan Zone card:'];
    if (fanCard.teamId) {
      lines.push(`Team: ${fanCard.teamId}`);
    }
    FIELD_ORDER.forEach((key) => {
      const answer = fanCard.answers[key];
      if (answer) {
        lines.push(`${FIELD_META[key].category}: ${answer}`);
      }
    });
    return lines.join('\n');
  }
}

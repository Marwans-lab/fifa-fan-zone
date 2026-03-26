import type { FanCard } from '../store/useStore'

const FIELD_ORDER = ['playstyle', 'devotion', 'vibes', 'perks'] as const

const FIELD_META: Record<string, { category: string }> = {
  playstyle: { category: 'PLAYSTYLE' },
  devotion:  { category: 'DEVOTION'  },
  vibes:     { category: 'VIBES'     },
  perks:     { category: 'PERKS'     },
}

function rrect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

export async function renderCardToBlob(fanCard: FanCard): Promise<Blob> {
  const W = 300, H = 420, DPR = 2
  const canvas = document.createElement('canvas')
  canvas.width  = W * DPR
  canvas.height = H * DPR
  const ctx = canvas.getContext('2d')!
  ctx.scale(DPR, DPR)

  // ── Background ────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(W * 0.8, 0, 0, H)
  bg.addColorStop(0, '#1a1a2a')
  bg.addColorStop(1, '#0d0d1a')
  ctx.fillStyle = bg
  rrect(ctx, 0, 0, W, H, 20)
  ctx.fill()

  ctx.strokeStyle = 'rgba(0,212,170,0.27)'
  ctx.lineWidth = 1
  ctx.stroke()

  // ── Top stripe ────────────────────────────────────────────────────────────
  const stripe = ctx.createLinearGradient(0, 0, W, 0)
  stripe.addColorStop(0,    'transparent')
  stripe.addColorStop(0.35, '#00d4aa')
  stripe.addColorStop(0.5,  '#ffffff')
  stripe.addColorStop(0.65, '#00d4aa')
  stripe.addColorStop(1,    'transparent')
  ctx.save()
  ctx.globalAlpha = 0.6
  ctx.fillStyle = stripe
  ctx.fillRect(0, 0, W, 4)
  ctx.restore()

  // ── Header ────────────────────────────────────────────────────────────────
  ctx.textAlign = 'center'
  ctx.fillStyle = '#00d4aa'
  ctx.font = 'bold 10px -apple-system, sans-serif'
  ctx.fillText('FIFA FAN ZONE', W / 2, 38)

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '11px -apple-system, sans-serif'
  ctx.fillText('Collector Edition', W / 2, 54)

  // ── Profile photo ─────────────────────────────────────────────────────────
  const PHOTO_R = 36
  const photoCx = W / 2
  const photoCy = 90
  if (fanCard.photoDataUrl) {
    try {
      const img = await loadImage(fanCard.photoDataUrl)
      ctx.save()
      ctx.beginPath()
      ctx.arc(photoCx, photoCy, PHOTO_R, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      // Cover-fit the image into the circle
      const imgAspect = img.naturalWidth / img.naturalHeight
      let drawW: number, drawH: number
      if (imgAspect > 1) {
        drawH = PHOTO_R * 2
        drawW = drawH * imgAspect
      } else {
        drawW = PHOTO_R * 2
        drawH = drawW / imgAspect
      }
      ctx.drawImage(img, photoCx - drawW / 2, photoCy - drawH / 2, drawW, drawH)
      ctx.restore()
      // White border ring
      ctx.beginPath()
      ctx.arc(photoCx, photoCy, PHOTO_R, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.lineWidth = 2
      ctx.stroke()
    } catch {
      // Photo failed to load — continue without it
    }
  } else {
    // Placeholder circle
    ctx.beginPath()
    ctx.arc(photoCx, photoCy, PHOTO_R, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.28)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 4])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // ── Team ──────────────────────────────────────────────────────────────────
  let curY = 140
  if (fanCard.teamId) {
    ctx.fillStyle = '#00d4aa'
    ctx.font = 'bold 13px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(fanCard.teamId.toUpperCase(), W / 2, curY)
    curY += 16
  }

  // ── Complete badge ────────────────────────────────────────────────────────
  const complete = !!fanCard.completedAt
  if (complete) {
    const bw = 86, bh = 18, bx = W / 2 - bw / 2, by = curY + 2
    ctx.strokeStyle = '#00d4aa'
    ctx.lineWidth = 1
    rrect(ctx, bx, by, bw, bh, 4)
    ctx.stroke()
    ctx.fillStyle = '#00d4aa'
    ctx.font = '10px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('✓ COMPLETE', W / 2, by + 13)
    curY += bh + 14
  } else {
    curY += 8
  }

  // ── Profile rows ──────────────────────────────────────────────────────────
  if (complete) {
    FIELD_ORDER.forEach((key, i) => {
      const ry = curY + i * 42
      const answer = (fanCard.answers[key] as string | undefined) || '—'
      const { category } = FIELD_META[key]

      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      rrect(ctx, 20, ry, W - 40, 34, 8)
      ctx.fill()

      ctx.fillStyle = '#00d4aa'
      ctx.font = '9px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(category, 36, ry + 12)

      ctx.fillStyle = '#ffffff'
      ctx.font = '12px -apple-system, sans-serif'
      const label = answer.length > 24 ? answer.slice(0, 24) + '…' : answer
      ctx.fillText(label, 36, ry + 26)
    })
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('canvas.toBlob failed'))
    }, 'image/png')
  })
}

export function buildShareText(fanCard: FanCard): string {
  const lines: string[] = ['🏆 My FIFA Fan Zone card:']
  if (fanCard.teamId) lines.push(`⚽ Team: ${fanCard.teamId}`)
  FIELD_ORDER.forEach(key => {
    const answer = fanCard.answers[key] as string | undefined
    if (answer) lines.push(`${FIELD_META[key].category}: ${answer}`)
  })
  return lines.join('\n')
}

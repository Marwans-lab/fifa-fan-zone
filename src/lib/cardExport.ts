import type { FanCard } from '../store/useStore'

const FIELD_ORDER = ['playstyle', 'devotion', 'vibes', 'perks'] as const

const FIELD_META: Record<string, { category: string }> = {
  playstyle: { category: 'PLAYSTYLE' },
  devotion:  { category: 'DEVOTION'  },
  vibes:     { category: 'VIBES'     },
  perks:     { category: 'PERKS'     },
}

function loadImage(src: string, errorMessage = 'Failed to load image'): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(errorMessage))
    img.src = src
  })
}

function inlineComputedStyles(source: HTMLElement, target: HTMLElement): void {
  const sourceNodes = [source, ...Array.from(source.querySelectorAll<HTMLElement>('*'))]
  const targetNodes = [target, ...Array.from(target.querySelectorAll<HTMLElement>('*'))]

  sourceNodes.forEach((sourceNode, index) => {
    const targetNode = targetNodes[index]
    if (!targetNode) return

    const computed = window.getComputedStyle(sourceNode)
    let cssText = ''
    for (let i = 0; i < computed.length; i += 1) {
      const prop = computed.item(i)
      cssText += `${prop}:${computed.getPropertyValue(prop)};`
    }

    const existingInline = targetNode.getAttribute('style')
    targetNode.setAttribute('style', existingInline ? `${existingInline};${cssText}` : cssText)

    if (sourceNode instanceof HTMLImageElement && targetNode instanceof HTMLImageElement) {
      targetNode.src = sourceNode.currentSrc || sourceNode.src
    }
  })
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('canvas.toBlob failed'))
    }, 'image/png')
  })
}

export async function renderFrontFaceToBlob(frontFace: HTMLElement): Promise<Blob> {
  const rect = frontFace.getBoundingClientRect()
  const width = Math.round(rect.width)
  const height = Math.round(rect.height)

  if (!width || !height) {
    throw new Error('Front card face is not ready for export')
  }

  if ('fonts' in document) {
    await (document as Document & { fonts: FontFaceSet }).fonts.ready
  }

  const clone = frontFace.cloneNode(true) as HTMLElement
  inlineComputedStyles(frontFace, clone)
  clone.querySelector('.f-fan-card__flip-hint')?.remove()

  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')
  clone.style.margin = '0'
  clone.style.width = `${width}px`
  clone.style.height = `${height}px`

  const serialized = new XMLSerializer().serializeToString(clone)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject x="0" y="0" width="100%" height="100%">${serialized}</foreignObject></svg>`
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  try {
    const snapshot = await loadImage(svgUrl, 'Failed to render card front image')
    const dpr = Math.max(window.devicePixelRatio || 1, 2)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas rendering context unavailable')
    ctx.scale(dpr, dpr)
    ctx.drawImage(snapshot, 0, 0, width, height)
    return canvasToBlob(canvas)
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
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

  let photoHeight = 0
  if (fanCard.photoDataUrl) {
    try {
      const img = await loadImage(fanCard.photoDataUrl, 'Failed to load fan photo')
      const naturalAspect = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 0.8
      const minAspect = (H * 0.55) / W
      const maxAspect = (H * 0.65) / W
      const photoAspect = Math.max(minAspect, Math.min(maxAspect, naturalAspect))
      photoHeight = W * photoAspect

      ctx.save()
      rrect(ctx, 0, 0, W, H, 20)
      ctx.clip()
      ctx.drawImage(img, 0, 0, W, photoHeight)
      ctx.restore()
    } catch {
      // Fall back to original export layout if image loading fails
      photoHeight = 0
    }
  }

  ctx.strokeStyle = 'rgba(0,212,170,0.27)'
  ctx.lineWidth = 1
  rrect(ctx, 0, 0, W, H, 20)
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
  const hasPhoto = photoHeight > 0
  const headerTitleY = hasPhoto ? photoHeight + 14 : 38
  const headerSubtitleY = hasPhoto ? photoHeight + 27 : 54
  ctx.textAlign = 'center'
  ctx.fillStyle = '#00d4aa'
  ctx.font = hasPhoto ? 'bold 9px -apple-system, sans-serif' : 'bold 10px -apple-system, sans-serif'
  ctx.fillText('FIFA FAN ZONE', W / 2, headerTitleY)

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = hasPhoto ? '10px -apple-system, sans-serif' : '11px -apple-system, sans-serif'
  ctx.fillText('Collector Edition', W / 2, headerSubtitleY)

  // ── Team ──────────────────────────────────────────────────────────────────
  let curY = hasPhoto ? photoHeight + 40 : 74
  if (fanCard.teamId) {
    ctx.fillStyle = '#00d4aa'
    ctx.font = hasPhoto ? 'bold 11px -apple-system, sans-serif' : 'bold 13px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(fanCard.teamId.toUpperCase(), W / 2, curY)
    curY += hasPhoto ? 14 : 16
  }

  // ── Complete badge ────────────────────────────────────────────────────────
  const complete = !!fanCard.completedAt
  if (complete) {
    const bw = hasPhoto ? 78 : 86
    const bh = hasPhoto ? 16 : 18
    const bx = W / 2 - bw / 2
    const by = curY + 2
    ctx.strokeStyle = '#00d4aa'
    ctx.lineWidth = 1
    rrect(ctx, bx, by, bw, bh, 4)
    ctx.stroke()
    ctx.fillStyle = '#00d4aa'
    ctx.font = hasPhoto ? '9px -apple-system, sans-serif' : '10px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('✓ COMPLETE', W / 2, by + (hasPhoto ? 12 : 13))
    curY += bh + (hasPhoto ? 10 : 14)
  } else {
    curY += hasPhoto ? 6 : 8
  }

  // ── Profile rows ──────────────────────────────────────────────────────────
  if (complete) {
    const rowX = hasPhoto ? 16 : 20
    const rowW = hasPhoto ? W - 32 : W - 40
    const rowH = hasPhoto ? 18 : 34
    const rowStep = hasPhoto ? 22 : 42
    const categoryY = hasPhoto ? 8 : 12
    const answerY = hasPhoto ? 16 : 26
    const maxAnswerLen = hasPhoto ? 20 : 24

    FIELD_ORDER.forEach((key, i) => {
      const ry = curY + i * rowStep
      const answer = (fanCard.answers[key] as string | undefined) || '—'
      const { category } = FIELD_META[key]

      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      rrect(ctx, rowX, ry, rowW, rowH, 8)
      ctx.fill()

      ctx.fillStyle = '#00d4aa'
      ctx.font = hasPhoto ? '8px -apple-system, sans-serif' : '9px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(category, rowX + 16, ry + categoryY)

      ctx.fillStyle = '#ffffff'
      ctx.font = hasPhoto ? '10px -apple-system, sans-serif' : '12px -apple-system, sans-serif'
      const label = answer.length > maxAnswerLen ? answer.slice(0, maxAnswerLen) + '…' : answer
      ctx.fillText(label, rowX + 16, ry + answerY)
    })
  }

  return canvasToBlob(canvas)
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

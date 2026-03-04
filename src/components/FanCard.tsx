import { useState, useCallback } from 'react'
import { track } from '../lib/analytics'
import type { FanCard as FanCardData } from '../store/useStore'

// ─── Profile questions ────────────────────────────────────────────────────────
const PROFILE_QUESTIONS = [
  {
    id: 'fav_player',
    label: 'Who is your all-time favourite player?',
    placeholder: 'e.g. Ronaldo, Messi…',
  },
  {
    id: 'fav_memory',
    label: 'Greatest football memory?',
    placeholder: 'e.g. World Cup 2022 Final…',
  },
  {
    id: 'fav_chant',
    label: "Your team's chant or motto?",
    placeholder: "e.g. You'll Never Walk Alone…",
  },
  {
    id: 'fan_since',
    label: 'How long have you been a fan?',
    placeholder: 'e.g. Since I was 5 years old…',
  },
] as const

type QuestionId = (typeof PROFILE_QUESTIONS)[number]['id']

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  fanCard: FanCardData
  onSave: (answers: Record<string, string>) => void
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_W = 300
const CARD_H = 420

const containerStyle: React.CSSProperties = {
  width: CARD_W,
  height: CARD_H,
  perspective: 1000,
  cursor: 'pointer',
  flexShrink: 0,
}

function innerStyle(flipped: boolean): React.CSSProperties {
  return {
    position: 'relative',
    width: '100%',
    height: '100%',
    transformStyle: 'preserve-3d',
    transition: 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  }
}

const faceBase: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: 20,
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  overflow: 'hidden',
}

const frontFaceStyle: React.CSSProperties = {
  ...faceBase,
  background: 'linear-gradient(160deg, #1a2a1a 0%, #0d1a0d 50%, #001a0d 100%)',
  border: '1px solid #00d4aa44',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '24px 20px 20px',
}

const backFaceStyle: React.CSSProperties = {
  ...faceBase,
  background: 'linear-gradient(160deg, #1a1a2a 0%, #0d0d1a 100%)',
  border: '1px solid #00d4aa44',
  transform: 'rotateY(180deg)',
  display: 'flex',
  flexDirection: 'column',
  padding: '24px 20px 20px',
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function HolographicStripe() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background:
          'linear-gradient(90deg, transparent, #00d4aa, #ffffff, #00d4aa, transparent)',
        opacity: 0.6,
      }}
    />
  )
}

function FanPhoto({ photoDataUrl }: { photoDataUrl: string | null }) {
  if (photoDataUrl) {
    return (
      <img
        src={photoDataUrl}
        alt="Fan photo"
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '3px solid #00d4aa',
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: '#1e3a2e',
        border: '3px solid #00d4aa44',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 40,
      }}
    >
      ⚽
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FanCard({ fanCard, onSave }: Props) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<Record<QuestionId, string>>>(
    () => ({ ...fanCard.answers } as Partial<Record<QuestionId, string>>)
  )
  const [isSaved, setIsSaved] = useState(false)

  const isComplete = fanCard.completedAt !== null || isSaved

  // ── Flip handlers ────────────────────────────────────────────────────────
  const flipToBack = useCallback(() => {
    setIsFlipped(true)
    setStep(0)
    track('card_flipped_to_back')
  }, [])

  const flipToFront = useCallback(() => {
    setIsFlipped(false)
    track('card_flipped_to_front')
  }, [])

  // ── Answer handlers ──────────────────────────────────────────────────────
  const handleAnswer = useCallback((id: QuestionId, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }, [])

  const handleNext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (step < PROFILE_QUESTIONS.length - 1) {
        setStep(s => s + 1)
      } else {
        const filled = Object.fromEntries(
          PROFILE_QUESTIONS.map(q => [q.id, answers[q.id] ?? ''])
        )
        onSave(filled)
        setIsSaved(true)
        track('card_profile_saved')
        setTimeout(() => setIsFlipped(false), 400)
      }
    },
    [step, answers, onSave]
  )

  const handleBack = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setStep(s => s - 1)
  }, [])

  const currentQ = PROFILE_QUESTIONS[step]
  const currentAnswer = answers[currentQ.id] ?? ''
  const isLast = step === PROFILE_QUESTIONS.length - 1

  return (
    <div
      style={containerStyle}
      onClick={isFlipped ? undefined : flipToBack}
      role="button"
      aria-label={isFlipped ? 'Fan card back' : 'Fan card – tap to flip'}
    >
      <div style={innerStyle(isFlipped)}>
        {/* ── FRONT ─────────────────────────────────────────────── */}
        <div style={frontFaceStyle}>
          <HolographicStripe />

          {/* Header */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: 3,
                color: '#00d4aa',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              FIFA Fan Zone
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#ffffff66',
                letterSpacing: 1,
              }}
            >
              Collector Edition
            </div>
          </div>

          {/* Photo */}
          <FanPhoto photoDataUrl={fanCard.photoDataUrl} />

          {/* Team badge */}
          <div style={{ textAlign: 'center' }}>
            {fanCard.teamId ? (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#00d4aa',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                {fanCard.teamId}
              </div>
            ) : (
              <div
                style={{
                  fontSize: 12,
                  color: '#ffffff44',
                  fontStyle: 'italic',
                  marginBottom: 4,
                }}
              >
                No team selected
              </div>
            )}

            {/* Completion badge */}
            {isComplete && (
              <div
                style={{
                  display: 'inline-block',
                  fontSize: 10,
                  color: '#00d4aa',
                  border: '1px solid #00d4aa',
                  borderRadius: 4,
                  padding: '2px 8px',
                  letterSpacing: 1,
                }}
              >
                ✓ COMPLETE
              </div>
            )}
          </div>

          {/* Tap hint */}
          <div
            style={{
              fontSize: 11,
              color: '#ffffff33',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 14 }}>↩</span> Tap card to flip
          </div>
        </div>

        {/* ── BACK ──────────────────────────────────────────────── */}
        <div style={backFaceStyle} onClick={e => e.stopPropagation()}>
          <HolographicStripe />

          {/* Back header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 11, color: '#00d4aa', letterSpacing: 2, textTransform: 'uppercase' }}>
              Fan Profile
            </div>
            <button
              onClick={flipToFront}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff66',
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
                padding: 4,
              }}
              aria-label="Flip back to front"
            >
              ↩
            </button>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
            {PROFILE_QUESTIONS.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  background: i <= step ? '#00d4aa' : '#ffffff22',
                  transition: 'background 300ms ease',
                }}
              />
            ))}
          </div>

          {/* Question */}
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: 12,
                lineHeight: 1.4,
              }}
            >
              {currentQ.label}
            </label>
            <textarea
              value={currentAnswer}
              onChange={e => handleAnswer(currentQ.id, e.target.value)}
              placeholder={currentQ.placeholder}
              rows={3}
              style={{
                width: '100%',
                background: '#ffffff0d',
                border: '1px solid #ffffff22',
                borderRadius: 10,
                padding: '12px 14px',
                color: '#fff',
                fontSize: 13,
                lineHeight: 1.5,
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                WebkitUserSelect: 'text',
                userSelect: 'text',
              }}
              onClick={e => e.stopPropagation()}
              onFocus={e => {
                e.currentTarget.style.border = '1px solid #00d4aa88'
              }}
              onBlur={e => {
                e.currentTarget.style.border = '1px solid #ffffff22'
              }}
            />
          </div>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {step > 0 && (
              <button
                onClick={handleBack}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  border: '1px solid #ffffff22',
                  background: 'none',
                  color: '#ffffff88',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              style={{
                flex: 2,
                padding: '10px 0',
                borderRadius: 10,
                border: 'none',
                background: '#00d4aa',
                color: '#000',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {isLast ? 'Save ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

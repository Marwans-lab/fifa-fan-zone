import { useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { track } from '../lib/analytics'
import type { FanCard as FanCardData } from '../store/useStore'

// ─── Public handle (for Edit button) ─────────────────────────────────────────
export interface FanCardHandle {
  startEditing: () => void
}

// ─── Profile questions ────────────────────────────────────────────────────────
const PROFILE_QUESTIONS = [
  {
    id: 'playstyle' as const,
    category: 'PLAYSTYLE',
    icon: '⚙',
    label: 'What kind of fan are you during a match?',
    options: ['The Analyst', 'The superstitious', 'The Hype Leader', 'The calm watcher'],
  },
  {
    id: 'devotion' as const,
    category: 'DEVOTION',
    icon: '♡',
    label: 'How do you follow the World Cup?',
    options: ['Every game', 'My team + big games', 'Highlight only', "I'll catch what I can"],
  },
  {
    id: 'vibes' as const,
    category: 'VIBES',
    icon: '♪',
    label: "What's your match vibes?",
    options: ['Loud and hype', 'Chill and focused', 'Social with friends', 'Family time'],
  },
  {
    id: 'perks' as const,
    category: 'PERKS',
    icon: '⬡',
    label: 'What\'s your World Cup "perk" goal?',
    options: ['Win rewards', 'Collect badges & titles', 'Climb the leaderboard', 'Unlock exclusive benefits'],
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
  width: '100%',
  aspectRatio: `${CARD_W} / ${CARD_H}`,
  perspective: 1000,
  cursor: 'pointer',
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
  padding: '20px 20px 18px',
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function HolographicStripe() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 4,
        background: 'linear-gradient(90deg, transparent, #00d4aa, #ffffff, #00d4aa, transparent)',
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
        style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid #00d4aa' }}
      />
    )
  }
  return (
    <div
      style={{
        width: 120, height: 120, borderRadius: '50%',
        background: '#1e3a2e', border: '3px solid #00d4aa44',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
      }}
    >
      ⚽
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const FanCard = forwardRef<FanCardHandle, Props>(function FanCard({ fanCard, onSave }, ref) {
  const [isFlipped, setIsFlipped]       = useState(false)
  const [wizardActive, setWizardActive] = useState(false)
  const [step, setStep]                 = useState(0)
  const [answers, setAnswers]           = useState<Partial<Record<QuestionId, string>>>(
    () => ({ ...fanCard.answers } as Partial<Record<QuestionId, string>>)
  )
  const [isSaved, setIsSaved] = useState(false)

  const isComplete  = fanCard.completedAt !== null || isSaved
  const currentQ    = PROFILE_QUESTIONS[step]
  const currentAnswer = answers[currentQ.id]
  const isLast      = step === PROFILE_QUESTIONS.length - 1

  // ── Imperative handle ────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    startEditing() {
      setAnswers({ ...fanCard.answers } as Partial<Record<QuestionId, string>>)
      setStep(0)
      setIsFlipped(true)
      setWizardActive(true)
      track('card_edit_tapped')
    },
  }))

  // ── Flip handlers ────────────────────────────────────────────────────────
  const flipToBack = useCallback(() => {
    setIsFlipped(true)
    track('card_flipped_to_back')
  }, [])

  const flipToFront = useCallback(() => {
    setIsFlipped(false)
    setWizardActive(false)
    track('card_flipped_to_front')
  }, [])

  // ── Wizard handlers ──────────────────────────────────────────────────────
  const startWizard = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setStep(0)
    setWizardActive(true)
    track('card_wizard_started')
  }, [])

  const handleSelect = useCallback((id: QuestionId, value: string) => {
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
        setWizardActive(false)
        track('card_profile_saved')
        setTimeout(() => setIsFlipped(false), 400)
      }
    },
    [step, answers, onSave]
  )

  const handleBack = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (step > 0) {
        setStep(s => s - 1)
      } else {
        setWizardActive(false)
      }
    },
    [step]
  )

  const resolvedAnswer = (id: QuestionId) =>
    answers[id] ?? (fanCard.answers[id] as string | undefined) ?? '—'

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

          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: '#00d4aa', textTransform: 'uppercase', marginBottom: 4 }}>
              FIFA Fan Zone
            </div>
            <div style={{ fontSize: 11, color: '#ffffff66', letterSpacing: 1 }}>
              Collector Edition
            </div>
          </div>

          <FanPhoto photoDataUrl={fanCard.photoDataUrl} />

          <div style={{ textAlign: 'center' }}>
            {fanCard.teamId ? (
              <div style={{ fontSize: 13, fontWeight: 700, color: '#00d4aa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                {fanCard.teamId}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#ffffff44', fontStyle: 'italic', marginBottom: 4 }}>
                No team selected
              </div>
            )}
            {isComplete && (
              <div style={{ display: 'inline-block', fontSize: 10, color: '#00d4aa', border: '1px solid #00d4aa', borderRadius: 4, padding: '2px 8px', letterSpacing: 1 }}>
                ✓ COMPLETE
              </div>
            )}
          </div>

          <div style={{ fontSize: 11, color: '#ffffff33', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 14 }}>↩</span> Tap card to flip
          </div>
        </div>

        {/* ── BACK ──────────────────────────────────────────────── */}
        <div style={backFaceStyle} onClick={e => e.stopPropagation()}>
          <HolographicStripe />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#00d4aa', letterSpacing: 2, textTransform: 'uppercase' }}>
              Fan Profile
            </div>
            <button
              onClick={flipToFront}
              style={{ background: 'none', border: 'none', color: '#ffffff66', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
              aria-label="Flip back to front"
            >
              ↩
            </button>
          </div>

          {/* Wizard takes priority so Edit works on completed cards */}
          {wizardActive ? (

            /* ── Wizard ─────────────────────────────────────────── */
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {PROFILE_QUESTIONS.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? '#00d4aa' : 'rgba(255,255,255,0.12)', transition: 'background 300ms ease' }} />
                ))}
              </div>

              <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 12, lineHeight: 1.4, letterSpacing: 0.1 }}>
                {currentQ.label}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {currentQ.options.map(option => {
                  const selected = currentAnswer === option
                  return (
                    <button
                      key={option}
                      onClick={e => { e.stopPropagation(); handleSelect(currentQ.id, option) }}
                      style={{
                        padding: '9px 14px', borderRadius: 10, fontFamily: 'inherit',
                        border: `1px solid ${selected ? '#00d4aa' : 'rgba(255,255,255,0.14)'}`,
                        background: selected ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)',
                        color: selected ? '#00d4aa' : 'rgba(255,255,255,0.85)',
                        fontSize: 12, textAlign: 'left', cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  onClick={handleBack}
                  style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)', background: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!currentAnswer}
                  style={{ flex: 2, padding: '9px 0', borderRadius: 10, border: 'none', background: currentAnswer ? '#00d4aa' : 'rgba(0,212,170,0.2)', color: currentAnswer ? '#000' : 'rgba(0,0,0,0.4)', fontSize: 12, fontWeight: 700, cursor: currentAnswer ? 'pointer' : 'default', fontFamily: 'inherit' }}
                >
                  {isLast ? 'Save ✓' : 'Next →'}
                </button>
              </div>
            </>

          ) : isComplete ? (

            /* ── Completed display rows ──────────────────────────── */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PROFILE_QUESTIONS.map(q => (
                <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                  <span style={{ fontSize: 18, opacity: 0.55, flexShrink: 0 }}>{q.icon}</span>
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: 2, color: '#00d4aa', textTransform: 'uppercase', marginBottom: 2 }}>
                      {q.category}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                      {resolvedAnswer(q.id)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          ) : (

            /* ── Empty CTA ───────────────────────────────────────── */
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={startWizard}
                style={{ padding: '12px 28px', borderRadius: 24, border: '1px solid #ffffff44', background: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.3 }}
              >
                Complete your card
              </button>
            </div>

          )}
        </div>
      </div>
    </div>
  )
})

export default FanCard

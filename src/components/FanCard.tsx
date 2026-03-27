import { useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { track } from '../lib/analytics'
import type { FanCard as FanCardData } from '../store/useStore'
import { getTeam } from '../data/teams'
import editIcon      from '../assets/icons/edit-white.svg'
import shareIcon     from '../assets/icons/share-white.svg'
import saveIcon      from '../assets/icons/save-white.svg'
import flipIcon      from '../assets/icons/flip-white.svg'
import tickBlack     from '../assets/icons/Tick-black.svg'
import chevRight     from '../assets/icons/Chevron-right-white.svg'
import qrLogo        from '../assets/icons/qr-logo.svg'
import stadiumIcon   from '../assets/icons/stadium-white.svg'
import styleIcon     from '../assets/icons/style-white.svg'
import devotionIcon  from '../assets/icons/devotion-white.svg'
import vibesIcon     from '../assets/icons/vibes-white.svg'
import prksIcon      from '../assets/icons/prks-white.svg'

// ─── Public handle (for Edit button) ─────────────────────────────────────────
export interface FanCardHandle {
  startEditing: () => void
}

// ─── Profile questions ────────────────────────────────────────────────────────
const PROFILE_QUESTIONS = [
  {
    id: 'playstyle' as const,
    category: 'PLAYSTYLE',
    iconSrc: styleIcon,
    label: 'What kind of fan are you during a match?',
    options: ['The Analyst', 'The superstitious', 'The Hype Leader', 'The calm watcher'],
  },
  {
    id: 'devotion' as const,
    category: 'DEVOTION',
    iconSrc: devotionIcon,
    label: 'How do you follow the World Cup?',
    options: ['Every game', 'My team + big games', 'Highlight only', "I'll catch what I can"],
  },
  {
    id: 'vibes' as const,
    category: 'VIBES',
    iconSrc: vibesIcon,
    label: "What's your match vibes?",
    options: ['Loud and hype', 'Chill and focused', 'Social with friends', 'Family time'],
  },
  {
    id: 'perks' as const,
    category: 'PERKS',
    iconSrc: prksIcon,
    label: 'What\'s your World Cup "perk" goal?',
    options: ['Win rewards', 'Collect badges & titles', 'Climb the leaderboard', 'Unlock exclusive benefits'],
  },
] as const

type QuestionId = (typeof PROFILE_QUESTIONS)[number]['id']

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  fanCard: FanCardData
  onSave: (answers: Record<string, string>) => void
  onShare?: () => void
  onSaveToDevice?: () => void
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// Card fills parent width; aspect ratio locks the height automatically.
const CARD_ASPECT = '5 / 7'

const containerStyle: React.CSSProperties = {
  width: '100%',
  aspectRatio: CARD_ASPECT,
  perspective: 1000,
  cursor: 'pointer',
}

function innerStyle(flipped: boolean): React.CSSProperties {
  return {
    position: 'relative',
    width: '100%',
    height: '100%',
    transformStyle: 'preserve-3d',
    transition: 'transform var(--f-brand-motion-duration-generous) var(--f-brand-motion-easing-default)',
    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  }
}

const faceBase: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: 'var(--f-brand-radius-outer)',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  overflow: 'hidden',
}

function getFrontFaceStyle(teamId: string | null, isFlipped: boolean): React.CSSProperties {
  const team = teamId ? getTeam(teamId) : null
  const bg = team
    ? `linear-gradient(160deg, ${team.colors[0]} 0%, ${team.colors[1]} 100%)`
    : 'linear-gradient(160deg, var(--c-card-gradient-1) 0%, var(--c-card-gradient-2) 50%, var(--c-card-gradient-3) 100%)'
  const shadow = team
    ? `0 16px 48px ${team.colors[0]}55, inset 0 1px 0 var(--c-card-inset)`
    : '0 16px 48px var(--c-card-shadow), inset 0 1px 0 var(--c-card-inset)'
  return {
    ...faceBase,
    background: bg,
    border: '1px solid var(--c-card-border)',
    boxShadow: shadow,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--f-brand-space-lg) var(--f-brand-space-md) var(--f-brand-space-md)',
    pointerEvents: isFlipped ? 'none' : 'auto',
  }
}

const backFaceStyle: React.CSSProperties = {
  ...faceBase,
  background: 'var(--c-card-glass-bg)',
  border: '1px solid var(--c-card-glass-border)',
  boxShadow: 'inset 0 1px 0 var(--c-card-glass-shine)',
  transform: 'rotateY(180deg)',
  display: 'flex',
  flexDirection: 'column',
  padding: 'var(--f-brand-space-md) var(--f-brand-space-md) 18px',
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ActionCircle({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--f-brand-space-2xs)',
        background: 'none', border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 'var(--f-brand-opacity-disabled)' : 1,
        fontFamily: 'inherit', padding: 0,
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'var(--c-card-glass-bg)', border: '1px solid var(--c-card-btn-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 9, color: 'var(--f-brand-color-text-light)', letterSpacing: 1, textTransform: 'uppercase' }}>
        {label}
      </span>
    </button>
  )
}

function CardTexture() {
  return (
    <>
      {/* Dot-grid halftone */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'var(--f-brand-radius-outer)', pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, var(--c-card-dot) 1.5px, transparent 1.5px)',
        backgroundSize: '16px 16px',
        mixBlendMode: 'overlay',
      }} />
      {/* Diagonal shimmer stripes */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'var(--f-brand-radius-outer)', pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(-55deg, transparent, transparent 18px, var(--c-card-stripe) 18px, var(--c-card-stripe) 19px)',
        mixBlendMode: 'overlay',
      }} />
    </>
  )
}

function HolographicStripe() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 4,
        background: 'linear-gradient(90deg, transparent, var(--c-card-holo), transparent)',
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
        style={{ width: 180, height: 180, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: '3px solid var(--c-card-photo-border)', boxShadow: 'var(--c-card-photo-shadow)', position: 'relative', zIndex: 2 }}
      />
    )
  }
  return (
    <div
      style={{
        width: 180, height: 180, borderRadius: '50%',
        background: 'var(--c-card-overlay)', border: '2px dashed var(--c-card-dash)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 2,
      }}
    >
      <img src={stadiumIcon} width={24} height={24} alt="" style={{ opacity: 0.5 }} />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const FanCard = forwardRef<FanCardHandle, Props>(function FanCard({ fanCard, onSave, onShare, onSaveToDevice }, ref) {
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

  const handleEditTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setAnswers({ ...fanCard.answers } as Partial<Record<QuestionId, string>>)
    setStep(0)
    setWizardActive(true)
    track('card_edit_tapped')
  }, [fanCard.answers])

  const handleShareTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onShare?.()
  }, [onShare])

  const handleSaveTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSaveToDevice?.()
  }, [onSaveToDevice])

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
        <div style={getFrontFaceStyle(fanCard.teamId, isFlipped)}>
          <CardTexture />
          <HolographicStripe />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, letterSpacing: 3, color: 'var(--f-brand-color-text-light)', textTransform: 'uppercase', fontFamily: 'var(--f-base-type-family-secondary)', fontWeight: 400 }}>
                FIFA Fan Zone
              </div>
              <div style={{ fontSize: 11, color: 'var(--f-brand-color-text-light)', opacity: 0.67, letterSpacing: 1, fontStyle: 'italic' }}>
                Collector Edition
              </div>
            </div>
            <img src={qrLogo} width={40} height={35} alt="QR" style={{ opacity: 0.85 }} />
          </div>

          {/* Photo + motto */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--f-brand-space-md)' }}>
            <FanPhoto photoDataUrl={fanCard.photoDataUrl} />
            <div style={{ textAlign: 'center' }}>
              {fanCard.teamId ? (() => {
                const team = getTeam(fanCard.teamId)
                return (
                  <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--f-brand-color-text-light)', opacity: 0.88, letterSpacing: 0.5, fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--f-brand-space-xs)' }}>
                    {team && <span style={{ fontStyle: 'normal', fontSize: 22 }}>{team.flag}</span>}
                    {team ? team.motto : fanCard.teamId}
                  </div>
                )
              })() : (
                <div style={{ fontSize: 12, color: 'var(--c-card-dash)', fontStyle: 'italic' }}>
                  No team selected
                </div>
              )}
            </div>
            {isComplete && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 'var(--f-brand-space-2xs)',
                padding: '6px 16px', marginTop: 'var(--f-brand-space-sm)',
                borderRadius: 'var(--f-brand-radius-rounded)',
                border: '1px solid var(--f-brand-color-accent)',
                background: 'var(--c-accent-bg)',
              }}>
                <span style={{ fontSize: 12, color: 'var(--f-brand-color-accent)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--f-base-type-family-secondary)' }}>
                  ✓ Complete
                </span>
              </div>
            )}
          </div>

          <div style={{ fontSize: 14, color: 'var(--f-brand-color-text-light)', opacity: 0.4, display: 'flex', alignItems: 'center', gap: 'var(--f-brand-space-2xs)' }}>
            <img src={flipIcon} width={24} height={24} alt="" style={{ opacity: 0.5 }} /> Tap card to flip
          </div>
        </div>

        {/* ── BACK ──────────────────────────────────────────────── */}
        <div style={backFaceStyle} onClick={flipToFront}>
          <HolographicStripe />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--f-brand-space-md)' }}>
            <div style={{ fontSize: '11', color: 'var(--f-brand-color-accent)', letterSpacing: 2, textTransform: 'uppercase' as const }}>
              Fan Profile
            </div>
          </div>

          {/* Wizard takes priority so Edit works on completed cards */}
          {wizardActive ? (

            /* ── Wizard ─────────────────────────────────────────── */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 'var(--f-brand-space-sm)' }}>
                {PROFILE_QUESTIONS.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? 'var(--f-brand-color-accent)' : 'var(--c-card-progress-off)', transition: `background var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit)` }} />
                ))}
              </div>

              <div style={{ fontFamily: 'var(--f-base-type-family-secondary)', fontSize: '13', fontWeight: '500', color: 'var(--f-brand-color-text-default)', marginBottom: 'var(--f-brand-space-sm)', lineHeight: 1.4, letterSpacing: 0.1 }}>
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
                        padding: '9px 14px', borderRadius: 'var(--f-brand-radius-base)', fontFamily: 'inherit',
                        border: `1px solid ${selected ? 'var(--f-brand-color-accent)' : 'var(--f-brand-color-border-default)'}`,
                        background: selected ? 'var(--c-accent-glow)' : 'var(--c-card-faint)',
                        color: selected ? 'var(--f-brand-color-accent)' : 'var(--f-brand-color-text-default)',
                        fontSize: 12, textAlign: 'left', cursor: 'pointer',
                        transition: `all var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)`,
                      }}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 'var(--f-brand-space-xs)', marginTop: 'var(--f-brand-space-xs)' }}>
                <button
                  onClick={handleBack}
                  style={{ flex: 1, padding: '9px 0', borderRadius: 'var(--f-brand-radius-base)', border: '1px solid var(--c-card-btn-border)', background: 'none', color: 'var(--c-card-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!currentAnswer}
                  style={{ flex: 2, padding: '9px 0', borderRadius: 'var(--f-brand-radius-base)', border: 'none', background: currentAnswer ? 'var(--f-brand-color-accent)' : 'var(--c-accent-disabled)', color: currentAnswer ? 'var(--f-brand-color-text-default)' : 'var(--c-card-disabled-text)', fontSize: 12, fontWeight: 500, cursor: currentAnswer ? 'pointer' : 'default', fontFamily: 'inherit' }}
                >
                  {isLast ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Save <img src={tickBlack} width={24} height={24} alt="" />
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Next <img src={chevRight} width={24} height={24} alt="" style={{ opacity: 0.7 }} />
                    </span>
                  )}
                </button>
              </div>
            </div>

          ) : isComplete ? (

            /* ── Completed display rows ──────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--f-brand-space-xs)' }}>
              {PROFILE_QUESTIONS.map(q => (
                <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--f-brand-space-sm)', padding: '10px var(--f-brand-space-sm)', background: 'var(--c-card-glass-shine)', border: '1px solid var(--c-card-glass-bg)', borderRadius: 'var(--f-brand-radius-base)' }}>
                  <img src={q.iconSrc} width={24} height={24} alt="" style={{ opacity: 0.55, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '10', letterSpacing: 2, color: 'var(--f-brand-color-accent)', textTransform: 'uppercase' as const, marginBottom: 2 }}>
                      {q.category}
                    </div>
                    <div style={{ fontSize: '11', color: 'var(--f-brand-color-text-default)', fontWeight: '500' }}>
                      {resolvedAnswer(q.id)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          ) : (

            /* ── Empty CTA ───────────────────────────────────────── */
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
              <button
                onClick={startWizard}
                style={{ padding: 'var(--f-brand-space-sm) 28px', borderRadius: 'var(--f-brand-radius-rounded)', border: '1px solid var(--c-card-cta-border)', background: 'none', color: 'var(--f-brand-color-text-light)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.3 }}
              >
                Complete your card
              </button>
            </div>

          )}

          {/* ── Action circles (Edit / Share / Save) ─────────────── */}
          {isComplete && !wizardActive && (
            <div
              style={{ display: 'flex', justifyContent: 'center', gap: 'var(--f-brand-space-md)', paddingTop: 'var(--f-brand-space-sm)' }}
              onClick={e => e.stopPropagation()}
            >
              <ActionCircle icon={<img src={editIcon}  width={24} height={24} alt="" />} label="Edit"  onClick={handleEditTap} />
              <ActionCircle icon={<img src={shareIcon} width={24} height={24} alt="" />} label="Share" onClick={handleShareTap} />
              <ActionCircle icon={<img src={saveIcon}  width={24} height={24} alt="" />} label="Save"  onClick={handleSaveTap} />
            </div>
          )}

          {/* ── Tap to flip (pinned to bottom) ───────────────────── */}
          <div style={{ fontSize: 14, color: 'var(--f-brand-color-text-light)', opacity: 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--f-brand-space-2xs)', marginTop: 'auto', paddingTop: 'var(--f-brand-space-sm)' }}>
            <img src={flipIcon} width={24} height={24} alt="" style={{ opacity: 0.5 }} /> Tap card to flip
          </div>
        </div>
      </div>
    </div>
  )
})

export default FanCard

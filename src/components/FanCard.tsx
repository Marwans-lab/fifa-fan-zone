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

function getFrontFaceStyle(teamId: string | null, isFlipped: boolean): React.CSSProperties {
  const team = teamId ? getTeam(teamId) : null
  const bg = team
    ? `linear-gradient(160deg, ${team.colors[0]} 0%, ${team.colors[1]} 100%)`
    : 'linear-gradient(160deg, #1a2a1a 0%, #0d1a0d 50%, #001a0d 100%)'
  const shadow = team
    ? `0 16px 48px ${team.colors[0]}55, inset 0 1px 0 rgba(255,255,255,0.08)`
    : '0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
  return {
    ...faceBase,
    background: bg,
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: shadow,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 20px 20px',
    pointerEvents: isFlipped ? 'none' : 'auto',
  }
}

const backFaceStyle: React.CSSProperties = {
  ...faceBase,
  background: 'linear-gradient(160deg, #1a1a2a 0%, #0d0d1a 100%)',
  border: '1px solid var(--c-border-accent)',
  transform: 'rotateY(180deg)',
  display: 'flex',
  flexDirection: 'column',
  padding: '20px 20px 18px',
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ActionCircle({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        background: 'none', border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        fontFamily: 'inherit', padding: 0,
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 9, color: '#fff', letterSpacing: 1, textTransform: 'uppercase' }}>
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
        position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.28) 1.5px, transparent 1.5px)',
        backgroundSize: '16px 16px',
        mixBlendMode: 'overlay',
      }} />
      {/* Diagonal shimmer stripes */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(-55deg, transparent, transparent 18px, rgba(255,255,255,0.10) 18px, rgba(255,255,255,0.10) 19px)',
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
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
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
        style={{ width: 180, height: 180, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: '3px solid rgba(255,255,255,0.55)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', position: 'relative', zIndex: 2 }}
      />
    )
  }
  return (
    <div
      style={{
        width: 180, height: 180, borderRadius: '50%',
        background: 'rgba(0,0,0,0.28)', border: '2px dashed rgba(255,255,255,0.35)',
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
              <div style={{ fontSize: 14, letterSpacing: 2, color: '#ffffff', textTransform: 'uppercase' }}>
                Your Fan Card
              </div>
              <div style={{ fontSize: 11, color: '#ffffffaa', letterSpacing: 1 }}>
                Collector Edition
              </div>
            </div>
            <img src={qrLogo} width={40} height={35} alt="QR" style={{ opacity: 0.85 }} />
          </div>

          {/* Photo + motto */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <FanPhoto photoDataUrl={fanCard.photoDataUrl} />
            <div style={{ textAlign: 'center' }}>
              {fanCard.teamId ? (() => {
                const team = getTeam(fanCard.teamId)
                return (
                  <div style={{ fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,0.88)', letterSpacing: 0.5, fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {team && <span style={{ fontStyle: 'normal', fontSize: 22 }}>{team.flag}</span>}
                    {team ? team.motto : fanCard.teamId}
                  </div>
                )
              })() : (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
                  No team selected
                </div>
              )}
            </div>
          </div>

          <div style={{ fontSize: 14, color: '#ffffff66', display: 'flex', alignItems: 'center', gap: 4 }}>
            <img src={flipIcon} width={24} height={24} alt="" style={{ opacity: 0.5 }} /> Tap card to flip
          </div>
        </div>

        {/* ── BACK ──────────────────────────────────────────────── */}
        <div style={backFaceStyle} onClick={flipToFront}>
          <HolographicStripe />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--c-accent)', letterSpacing: 2, textTransform: 'uppercase' as const }}>
              Fan Profile
            </div>
          </div>

          {/* Wizard takes priority so Edit works on completed cards */}
          {wizardActive ? (

            /* ── Wizard ─────────────────────────────────────────── */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {PROFILE_QUESTIONS.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? 'var(--c-accent)' : 'rgba(255,255,255,0.12)', transition: `background var(--dur-slow) var(--ease-out)` }} />
                ))}
              </div>

              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-med)', color: 'var(--c-text-1)', marginBottom: 12, lineHeight: 1.4, letterSpacing: 0.1 }}>
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
                        border: `1px solid ${selected ? 'var(--c-accent)' : 'var(--c-border)'}`,
                        background: selected ? 'rgba(0,212,170,0.15)' : 'var(--glass-bg-subtle)',
                        color: selected ? 'var(--c-accent)' : 'var(--c-text-1)',
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
                  style={{ flex: 2, padding: '9px 0', borderRadius: 10, border: 'none', background: currentAnswer ? 'var(--c-accent)' : 'rgba(0,212,170,0.2)', color: currentAnswer ? '#000' : 'rgba(0,0,0,0.4)', fontSize: 12, fontWeight: 500, cursor: currentAnswer ? 'pointer' : 'default', fontFamily: 'inherit' }}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PROFILE_QUESTIONS.map(q => (
                <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                  <img src={q.iconSrc} width={24} height={24} alt="" style={{ opacity: 0.55, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 'var(--text-2xs)', letterSpacing: 2, color: 'var(--c-accent)', textTransform: 'uppercase' as const, marginBottom: 2 }}>
                      {q.category}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-1)', fontWeight: 'var(--weight-med)' }}>
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
                style={{ padding: '12px 28px', borderRadius: 24, border: '1px solid #ffffff44', background: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.3 }}
              >
                Complete your card
              </button>
            </div>

          )}

          {/* ── Action circles (Edit / Share / Save) ─────────────── */}
          {isComplete && !wizardActive && (
            <div
              style={{ display: 'flex', justifyContent: 'center', gap: 20, paddingTop: 14 }}
              onClick={e => e.stopPropagation()}
            >
              <ActionCircle icon={<img src={editIcon}  width={24} height={24} alt="" />} label="Edit"  onClick={handleEditTap} />
              <ActionCircle icon={<img src={shareIcon} width={24} height={24} alt="" />} label="Share" onClick={handleShareTap} />
              <ActionCircle icon={<img src={saveIcon}  width={24} height={24} alt="" />} label="Save"  onClick={handleSaveTap} />
            </div>
          )}

          {/* ── Tap to flip (pinned to bottom) ───────────────────── */}
          <div style={{ fontSize: 14, color: '#ffffff66', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 'auto', paddingTop: 12 }}>
            <img src={flipIcon} width={24} height={24} alt="" style={{ opacity: 0.5 }} /> Tap card to flip
          </div>
        </div>
      </div>
    </div>
  )
})

export default FanCard

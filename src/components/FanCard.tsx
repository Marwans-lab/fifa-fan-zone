import { useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import Button from './Button'
import { track } from '../lib/analytics'
import type { FanCard as FanCardData } from '../store/useStore'
import { getTeam } from '../data/teams'
import editIcon      from '../assets/icons/edit-white.svg'
import shareIcon     from '../assets/icons/share-white.svg'
import saveIcon      from '../assets/icons/save-white.svg'
import flipIconWhite from '../assets/icons/flip-white.svg'
import flipIconDark  from '../assets/icons/flip-dark.svg'
import tickBlack     from '../assets/icons/Tick-black.svg'
import stadiumIcon   from '../assets/icons/stadium-white.svg'
import styleIcon     from '../assets/icons/style-white.svg'
import devotionIcon  from '../assets/icons/devotion-white.svg'
import vibesIcon     from '../assets/icons/vibes-white.svg'
import prksIcon      from '../assets/icons/prks-white.svg'
import './FanCard.css'

// ─── Public handle (for Edit button) ─────────────────────────────────────────
export interface FanCardHandle {
  startEditing: () => void
  flipToBack: () => void
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

// ─── Front face dynamic style (team colors require inline) ───────────────────
function getFrontInlineStyle(teamId: string | null, isFlipped: boolean): React.CSSProperties {
  const team = teamId ? getTeam(teamId) : null
  const bg = team
    ? `linear-gradient(160deg, ${team.colors[0]} 0%, ${team.colors[1]} 100%)`
    : 'linear-gradient(160deg, var(--c-card-gradient-1) 0%, var(--c-card-gradient-2) 50%, var(--c-card-gradient-3) 100%)'
  return {
    background: bg,
    border: '1px solid var(--c-card-border)',
    pointerEvents: isFlipped ? 'none' : 'auto',
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ActionCircle({ icon, label, onClick, disabled, dataUi }: { icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; disabled?: boolean; dataUi?: string }) {
  return (
    <button className="f-fan-card__action"
      onClick={onClick}
      disabled={disabled}
      data-ui={dataUi}
    >
      <div className="f-fan-card__action-circle">
        {icon}
      </div>
      <span className="f-fan-card__action-label">
        {label}
      </span>
    </button>
  )
}

function CardTexture() {
  return (
    <>
      <div className="f-fan-card__texture-dots" />
      <div className="f-fan-card__texture-stripes" />
    </>
  )
}

function HolographicStripe() {
  return <div className="f-fan-card__holographic" />
}

function FanPhoto({ photoDataUrl }: { photoDataUrl: string | null }) {
  if (photoDataUrl) {
    return (
      <img className="f-fan-card__photo"
        src={photoDataUrl}
        alt="Fan photo"
      />
    )
  }
  return (
    <div className="f-fan-card__photo-placeholder">
      <img src={stadiumIcon} width={24} height={24} alt="" className="f-fan-card__photo-placeholder-icon" />
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
    flipToBack() {
      setIsFlipped(true)
      track('card_flipped_to_back')
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

  const rootClassName = `f-fan-card${isFlipped ? ' f-fan-card--flipped' : ''}`

  return (
    <div className={rootClassName}
      data-component="fan-card"
      onClick={isFlipped ? undefined : flipToBack}
      role="button"
      aria-label={isFlipped ? 'Fan card back' : 'Fan card – tap to flip'}
    >
      <div className="f-fan-card__inner">

        {/* ── FRONT ─────────────────────────────────────────────── */}
        <div className="f-fan-card__front"
          data-section="front-face"
          style={getFrontInlineStyle(fanCard.teamId, isFlipped)}
        >
          <CardTexture />
          <HolographicStripe />

          {/* Background photo layer — absolutely pinned to card, behind all content */}
          <div className="f-fan-card__photo-section" data-section="photo">
            <FanPhoto photoDataUrl={fanCard.photoDataUrl} />
          </div>

          {/* Content stack on top */}
          <div className="f-fan-card__front-content" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}>
            <div className="f-fan-card__team-badge" data-section="team">
              {fanCard.teamId ? (() => {
                const team = getTeam(fanCard.teamId)
                return (
                  <div className="f-fan-card__team-motto">
                    {team && <span className="f-fan-card__team-flag">{team.flag}</span>}
                    {team ? team.motto : fanCard.teamId}
                  </div>
                )
              })() : (
                <div className="f-fan-card__team-empty">
                  No team selected
                </div>
              )}
            </div>

            <div className="f-fan-card__flip-hint">
              <img src={flipIconWhite} width={24} height={24} alt="" className="f-fan-card__flip-hint-icon" /> Tap card to flip
            </div>
          </div>
        </div>

        {/* ── BACK ──────────────────────────────────────────────── */}
        <div className="f-fan-card__back" data-section="back-face" onClick={flipToFront}>
          <HolographicStripe />

          {/* Header */}
          <div className="f-fan-card__back-header">
            <div className="f-fan-card__back-title">
              Fan Profile
            </div>
          </div>

          {/* Wizard takes priority so Edit works on completed cards */}
          {wizardActive ? (

            /* ── Wizard ─────────────────────────────────────────── */
            <div className="f-fan-card__wizard" onClick={e => e.stopPropagation()}>
              <div className="f-fan-card__wizard-progress">
                {PROFILE_QUESTIONS.map((_, i) => (
                  <div key={i} className={`f-fan-card__wizard-bar${i <= step ? ' f-fan-card__wizard-bar--active' : ''}`} />
                ))}
              </div>

              <div className="f-fan-card__wizard-question">
                {currentQ.label}
              </div>

              <div className="f-fan-card__wizard-options">
                {currentQ.options.map(option => {
                  const selected = currentAnswer === option
                  return (
                    <button className={`f-fan-card__wizard-option${selected ? ' f-fan-card__wizard-option--selected' : ''}`}
                      key={option}
                      onClick={e => { e.stopPropagation(); handleSelect(currentQ.id, option) }}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              <div className="f-fan-card__wizard-nav">
                <Button variant="secondary"
                  className="f-fan-card__wizard-btn--back"
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button className="f-fan-card__wizard-btn--next"
                  onClick={handleNext}
                  disabled={!currentAnswer}
                >
                  {isLast ? (
                    <span className="f-fan-card__wizard-btn-content">
                      Save <img src={tickBlack} width={24} height={24} alt="" className="fan-card-save-icon" />
                    </span>
                  ) : (
                    <span className="f-fan-card__wizard-btn-content">
                      Next
                    </span>
                  )}
                </Button>
              </div>
            </div>

          ) : isComplete ? (

            /* ── Completed display rows ──────────────────────────── */
            <div className="f-fan-card__profile">
              {PROFILE_QUESTIONS.map(q => (
                <div key={q.id} className="f-fan-card__profile-row">
                  <img src={q.iconSrc} width={24} height={24} alt="" className="f-fan-card__profile-icon" />
                  <div className="f-fan-card__profile-text">
                    <div className="f-fan-card__profile-category">
                      {q.category}
                    </div>
                    <div className="f-fan-card__profile-answer">
                      {resolvedAnswer(q.id)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          ) : (

            /* ── Empty CTA ───────────────────────────────────────── */
            <div className="f-fan-card__cta" onClick={e => e.stopPropagation()}>
              <button className="f-fan-card__cta-button"
                onClick={startWizard}
              >
                Complete your card
              </button>
            </div>

          )}

          {/* ── Action circles (Edit / Share / Save) ─────────────── */}
          {isComplete && !wizardActive && (
            <div className="f-fan-card__actions"
              data-section="action-circles"
              onClick={e => e.stopPropagation()}
            >
              <ActionCircle icon={<img src={editIcon}  width={24} height={24} alt="" className="fan-card-edit-icon" />} label="Edit"  onClick={handleEditTap} dataUi="edit-btn" />
              <ActionCircle icon={<img src={shareIcon} width={24} height={24} alt="" className="fan-card-share-icon" />} label="Share" onClick={handleShareTap} dataUi="share-btn" />
              <ActionCircle icon={<img src={saveIcon}  width={24} height={24} alt="" className="fan-card-save-to-device-icon" />} label="Save"  onClick={handleSaveTap} dataUi="save-btn" />
            </div>
          )}

          {/* ── Tap to flip (pinned to bottom) ───────────────────── */}
          <div className="f-fan-card__back-flip-hint">
            <img src={flipIconDark} width={24} height={24} alt="" className="f-fan-card__back-flip-hint-icon" /> Tap card to flip
          </div>
        </div>
      </div>
    </div>
  )
})

export default FanCard

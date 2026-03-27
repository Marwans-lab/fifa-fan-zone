import { useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import FanCard, { type FanCardHandle } from '../components/FanCard'
import { track } from '../lib/analytics'
import { useStore, type FlowId } from '../store/useStore'
import { renderCardToBlob, buildShareText } from '../lib/cardExport'
import lockIcon    from '../assets/icons/Lock-white.svg'
import chevRight   from '../assets/icons/Chevron-right-white.svg'
import tickBlack   from '../assets/icons/Tick-black.svg'
import qrIcon      from '../assets/icons/qr-logo.svg'
import globeWhite  from '../assets/icons/globe-white.svg'
import globeDark   from '../assets/icons/globe-dark.svg'
import stadiumWhite from '../assets/icons/stadium-white.svg'
import stadiumDark from '../assets/icons/stadium-dark.svg'
import historyWhite from '../assets/icons/history-white.svg'
import historyDark from '../assets/icons/history-dark.svg'
import refereeWhite from '../assets/icons/referee-white.svg'
import refereeDark from '../assets/icons/referee-dark.svg'
import rankingWhite from '../assets/icons/ranking-white.svg'
import rankingDark from '../assets/icons/ranking-dark.svg'


// ─── Quiz icon mapping ────────────────────────────────────────────────────────
const QUIZ_ICONS: Record<string, { white: string; dark: string }> = {
  'the-connector':     { white: globeWhite,   dark: globeDark   },
  'the-architect':     { white: stadiumWhite,  dark: stadiumDark },
  'the-historian':     { white: historyWhite,  dark: historyDark },
  'the-referee':       { white: refereeWhite,  dark: refereeDark },
  'the-retrospective': { white: rankingWhite,  dark: rankingDark },
}

// ─── Milestone config ─────────────────────────────────────────────────────────
const MILESTONES = [
  { iconSrc: qrIcon,      label: 'Fan card',      key: 'card'     },
  { iconSrc: globeDark,    label: 'Connector',     key: 'the-connector'    },
  { iconSrc: stadiumDark,  label: 'Architect',     key: 'the-architect'    },
  { iconSrc: historyDark,  label: 'Historian',     key: 'the-historian'    },
] as const

function statusLabel(done: number): string {
  if (done === 0) return 'New arrival'
  if (done === 1) return 'Rising fan'
  if (done <= 2) return 'Quiz taker'
  if (done <= 3) return 'Top fan'
  return 'Quiz champion'
}

// ─── Journey Step ─────────────────────────────────────────────────────────────
function JourneyStep({
  iconSrc,
  label,
  isCompleted = false,
  isCurrent = false,
}: {
  iconSrc: string
  label: string
  isCompleted?: boolean
  isCurrent?: boolean
}) {
  const nodeStyle: React.CSSProperties = {
    width: 'var(--sp-11)', height: 'var(--sp-11)', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    transition: 'all var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default)',
    flexShrink: 0, position: 'relative',
    ...(isCompleted ? {
      background: 'var(--f-brand-color-text-default)', border: '1px solid var(--f-brand-color-text-default)',
      boxShadow: '0 0 25px rgba(0,0,0,0.15)',
      transform: 'scale(1.1)', zIndex: 20,
    } : isCurrent ? {
      background: 'rgba(0,0,0,0.06)', border: '1px solid var(--f-brand-color-border-default)',
      transform: 'scale(1.05)', zIndex: 20,
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    } : {
      background: 'rgba(0,0,0,0.02)', border: '1px solid var(--f-brand-color-border-default)',
      zIndex: 10,
    }),
  }

  return (
    <li className="card-journey-step-item" style={{
      position: 'relative', zIndex: 10,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--f-brand-space-sm)',
      width: 'var(--sp-11)', flexShrink: 0,
    }}>
      <div className="card-journey-step-node" style={nodeStyle}>
        {isCurrent && (
          <div className="animate-ping-slow card-journey-step-ping"
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(0,0,0,0.1)', pointerEvents: 'none',
            }}
          />
        )}
        {isCompleted ? (
          <img className="card-journey-step-icon-complete" src={tickBlack} width={20} height={20} alt="" style={{ position: 'relative', zIndex: 10, filter: 'invert(1)' }} />
        ) : (
          <img className="card-journey-step-icon" src={iconSrc} width={20} height={20} alt="" style={{ opacity: isCurrent ? 1 : 0.3, filter: 'invert(1)' }} />
        )}
      </div>
      <span className="card-journey-step-label" style={{
        font: 'var(--f-brand-type-caption)',
        letterSpacing: 'var(--tracking-semi)', textAlign: 'center',
        whiteSpace: 'nowrap', transition: 'color var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default)',
        color: isCompleted || isCurrent ? 'var(--f-brand-color-text-default)' : 'var(--f-brand-color-text-subtle)',
      }}>
        {label}
      </span>
    </li>
  )
}

// ─── Journey Card ─────────────────────────────────────────────────────────────
function JourneyCard({
  completedAt,
  quizCount,
  totalQuizzes,
  allComplete,
  cardComplete,
  completedFlows,
  onStartQuiz,
}: {
  completedAt: string | null
  quizCount: number
  totalQuizzes: number
  allComplete: boolean
  cardComplete: boolean
  completedFlows: Set<string>
  onStartQuiz: () => void
}) {
  const achieved = [
    completedAt !== null,
    completedFlows.has('the-connector'),
    completedFlows.has('the-architect'),
    completedFlows.has('the-historian'),
  ]
  const doneCount = achieved.filter(Boolean).length
  const status = statusLabel(doneCount)

  // Find first incomplete milestone for "current" indicator
  const currentIdx = achieved.findIndex(v => !v)

  return (
    <section className="card-journey-section"
      data-section="journey-card"
      aria-label="Your Journey Progress"
      style={{
        width: '100%',
        background: 'var(--f-brand-color-background-light)',
        borderRadius: 'var(--f-brand-radius-outer)',
        padding: 'var(--f-brand-space-md)',
        border: '1px solid var(--f-brand-color-border-default)',
        marginBottom: 'var(--f-brand-space-md)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="card-journey-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--f-brand-space-lg)' }}>
        <div className="card-journey-header-text">
          <h2 className="card-journey-title" style={{
            font: 'var(--f-brand-type-caption-medium)',
            letterSpacing: 'var(--tracking-wide)',
            color: 'var(--f-brand-color-text-muted)', marginBottom: 'var(--f-brand-space-2xs)',
          }}>
            Your journey
          </h2>
          <p className="card-journey-status" style={{
            font: 'var(--f-brand-type-headline-medium)',
            letterSpacing: 'var(--tracking-semi)', color: 'var(--f-brand-color-text-default)',
          }}>
            {status}
          </p>
        </div>
        <div className="card-journey-badge" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--sp-3) var(--sp-4)',
          background: allComplete ? 'rgba(0,212,170,0.1)' : 'rgba(0,0,0,0.04)',
          borderRadius: 9999,
          border: `1px solid ${allComplete ? 'rgba(0,212,170,0.25)' : 'var(--f-brand-color-border-default)'}`,
        }}>
          <span className="card-journey-badge-text" style={{
            font: 'var(--f-brand-type-caption)',
            color: allComplete ? 'var(--f-brand-color-accent)' : 'var(--f-brand-color-text-default)', lineHeight: 'var(--leading-none)',
          }}>
            {allComplete ? '✓ Complete' : `Step ${Math.min(doneCount + 1, 4)}/4`}
          </span>
        </div>
      </div>

      {/* Steps track */}
      <nav className="card-journey-nav" aria-label="Journey Steps">
        <ol className="card-journey-track" style={{ display: 'flex', alignItems: 'flex-start', width: '100%', position: 'relative', listStyle: 'none' }}>
          {MILESTONES.map((m, i) => {
            const done = achieved[i]
            const isCurrent = currentIdx === i
            const isLast = i === MILESTONES.length - 1
            return (
              <div className="card-journey-step-wrapper" key={m.key} style={{ display: 'contents' }}>
                <JourneyStep
                  iconSrc={m.iconSrc}
                  label={m.label}
                  isCompleted={done}
                  isCurrent={isCurrent}
                />
                {!isLast && (() => {
                  const nextDone = achieved[i + 1]
                  const isInactive = !done && !nextDone
                  const lineBg = done && nextDone
                    ? 'var(--f-brand-color-text-default)'                               // fully active
                    : done && !nextDone
                    ? 'linear-gradient(90deg, var(--f-brand-color-text-default), var(--f-brand-color-border-default))' // half active
                    : 'var(--f-brand-color-border-default)'                             // inactive
                  return (
                    <div className="card-journey-connector" style={{
                      flex: 1, height: 2, marginTop: 'calc(var(--sp-11) / 2)',
                      background: lineBg,
                      opacity: isInactive ? 0.4 : 1,
                      transition: 'all var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default)',
                    }} />
                  )
                })()}
              </div>
            )
          })}
        </ol>
      </nav>

      {/* Start Quiz CTA */}
      <button className="card-journey-cta"
        data-ui="start-quiz-btn"
        onClick={onStartQuiz}
        disabled={allComplete}
        style={{
          width: '100%', height: 'var(--sp-12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: allComplete ? 'rgba(0,212,170,0.1)' : !cardComplete ? 'var(--f-brand-color-background-primary)' : 'var(--f-brand-color-text-default)',
          color: allComplete ? 'var(--f-brand-color-accent)' : 'var(--f-brand-color-text-light)',
          font: 'var(--f-brand-type-body-medium)', fontWeight: 'var(--weight-bold)',
          fontSize: 'var(--text-md)', borderRadius: 9999,
          border: allComplete ? '1px solid rgba(0,212,170,0.25)' : 'none',
          marginTop: 'var(--sp-7)', cursor: allComplete ? 'default' : 'pointer',
          boxShadow: allComplete ? 'none' : !cardComplete ? '0 10px 30px rgba(142,33,87,0.3)' : '0 10px 30px rgba(0,0,0,0.12)',
          transition: 'all var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {allComplete ? 'All quizzes completed!' : !cardComplete ? 'Complete fan card' : 'Start quiz'}
      </button>
    </section>
  )
}

const RING_RADIUS = 32
const RING_STROKE = 4

// ─── Circular progress ring ───────────────────────────────────────────────────
function ProgressRing({
  radius,
  stroke,
  progress,
  color,
}: {
  radius: number
  stroke: number
  progress: number // 0–1
  color: string
}) {
  const norm = radius - stroke / 2
  const circ = 2 * Math.PI * norm
  const offset = circ * (1 - progress)
  return (
    <svg className="card-progress-ring"
      width={radius * 2}
      height={radius * 2}
      style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
    >
      {/* background track */}
      <circle
        className="card-progress-ring-track"
        cx={radius} cy={radius} r={norm}
        fill="none" stroke="var(--f-brand-color-border-default)" strokeWidth={stroke}
      />
      {/* progress arc */}
      {progress > 0 && (
        <circle
          className="card-progress-ring-arc"
          cx={radius} cy={radius} r={norm}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default)' }}
        />
      )}
    </svg>
  )
}


// ─── Generic quiz card (image, swipe, card-match) ───────────────────────────
function ExtraQuizCard({
  iconSrc,
  title,
  subtitle,
  result,
  locked,
  lockMessage,
  onStart,
}: {
  iconSrc: string
  title: string
  subtitle: string
  result: { score: number; total: number } | undefined
  locked: boolean
  lockMessage?: string
  onStart: () => void
}) {
  const done = !!result
  const [loading, setLoading] = useState(false)

  function handleClick() {
    if (loading) return
    setLoading(true)
    setTimeout(() => onStart(), 300)
  }

  return (
    <button className="card-quiz-card"
      data-ui="quiz-card-btn"
      onClick={locked ? undefined : handleClick}
      disabled={locked || loading}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--sp-5) var(--sp-4)', borderRadius: 'var(--f-brand-radius-outer)',
        minHeight: 120,
        border: `1px solid ${locked ? 'var(--f-brand-color-border-disabled)' : done ? 'rgba(0,212,170,0.25)' : 'var(--f-brand-color-border-default)'}`,
        background: 'var(--f-brand-color-background-light)',
        opacity: locked ? 0.55 : 1,
        cursor: locked ? 'not-allowed' : 'pointer',
        textAlign: 'left', font: 'var(--f-brand-type-body)', color: 'var(--f-brand-color-text-default)',
        transition: 'all var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div className="card-quiz-card-content" style={{ display: 'flex', alignItems: 'center', gap: 'var(--f-brand-space-md)' }}>
        <div className="card-quiz-card-ring-wrapper" style={{
          width: RING_RADIUS * 2, height: RING_RADIUS * 2,
          position: 'relative', flexShrink: 0,
        }}>
          <ProgressRing
            radius={RING_RADIUS}
            stroke={RING_STROKE}
            progress={done ? 1 : 0}
            color={done ? 'var(--f-brand-color-accent)' : 'var(--f-brand-color-border-default)'}
          />
          <div className="card-quiz-card-icon-circle" style={{
            position: 'absolute',
            top: RING_STROKE + 2, left: RING_STROKE + 2,
            width: (RING_RADIUS - RING_STROKE - 2) * 2,
            height: (RING_RADIUS - RING_STROKE - 2) * 2,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: locked
              ? 'rgba(0,0,0,0.04)'
              : done
              ? 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,212,170,0.05))'
              : 'linear-gradient(135deg, rgba(0,0,0,0.04), rgba(0,0,0,0.02))',
            boxShadow: locked ? 'none' : '0 6px 20px rgba(0,0,0,0.08)',
          }}>
            {locked ? (
              <img className="card-quiz-card-lock-icon" src={lockIcon} width={24} height={24} alt="" style={{ opacity: 0.4, filter: 'invert(1)' }} />
            ) : done ? (
              <img className="card-quiz-card-tick-icon" src={tickBlack} width={24} height={24} alt="" />
            ) : (
              <img className="card-quiz-card-quiz-icon" src={iconSrc} width={24} height={24} alt="" style={{ filter: 'invert(1)' }} />
            )}
          </div>
        </div>
        <div className="card-quiz-card-text">
          <h3 className="card-quiz-card-title" style={{
            font: 'var(--f-brand-type-headline-medium)',
            color: locked ? 'var(--f-brand-color-text-subtle)' : 'var(--f-brand-color-text-default)',
          }}>
            {title}
          </h3>
          <p className="card-quiz-card-subtitle" style={{ font: 'var(--f-brand-type-caption)', fontSize: 'var(--text-sm)', color: 'var(--f-brand-color-text-muted)', marginTop: 'var(--f-brand-space-xs)' }}>
            {done ? (
              <span className="card-quiz-card-result" style={{ color: 'var(--f-brand-color-text-default)', fontWeight: 'var(--weight-med)' }}>
                Completed · {result.score}/{result.total} correct
              </span>
            ) : locked ? (
              lockMessage ?? 'Complete your fan card to unlock'
            ) : (
              <span className="card-quiz-card-description" style={{ color: 'var(--f-brand-color-text-default)', fontWeight: 'var(--weight-med)' }}>
                {subtitle}
              </span>
            )}
          </p>
        </div>
      </div>
      {!locked && !done && (
        <div className="card-quiz-card-action" style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(0,0,0,0.04)', border: '1px solid var(--f-brand-color-border-default)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: 'var(--f-brand-space-2xs)',
        }}>
          {loading ? (
            <div className="card-quiz-card-spinner"
              aria-label="Loading"
              style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '2.5px solid var(--f-brand-color-border-default)',
                borderTopColor: 'var(--f-brand-color-accent)',
                animation: 'quiz-spin 0.6s linear infinite',
              }}
            />
          ) : (
            <img className="card-quiz-card-chevron" src={chevRight} width={24} height={24} alt="" style={{ opacity: 0.5, filter: 'invert(1)' }} />
          )}
        </div>
      )}
    </button>
  )
}

// ─── Main Card route ──────────────────────────────────────────────────────────
export default function Card() {
  const navigate = useNavigate()
  const { state, updateFanCard, isFlowUnlocked } = useStore()
  const quizRef = useRef<HTMLDivElement>(null)
  const fanCardRef = useRef<FanCardHandle>(null)
  const fanCardSectionRef = useRef<HTMLElement>(null)

  function handleSave(answers: Record<string, string>) {
    updateFanCard({ answers, completedAt: new Date().toISOString() })
  }

  const handleShare = useCallback(async () => {
    try {
      const blob = await renderCardToBlob(state.fanCard)
      const file = new File([blob], 'fan-card.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My FIFA Fan Card' })
      } else {
        await (window as any).QAApp.openNativeShare({
          title: 'My FIFA Fan Card',
          text: buildShareText(state.fanCard),
        })
      }
      track('card_shared')
    } catch {
      // user cancelled
    }
  }, [state.fanCard])

  const handleSaveToDevice = useCallback(async () => {
    try {
      const blob = await renderCardToBlob(state.fanCard)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = 'my-fan-card.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      track('card_saved_to_device')
    } catch {
      // silently fail
    }
  }, [state.fanCard])

  const cardComplete = state.fanCard.completedAt !== null

  const FLOWS: Array<{
    id: FlowId
    iconSrc: string
    title: string
    subtitle: string
    start: () => void
  }> = [
    {
      id: 'the-connector',
      iconSrc: QUIZ_ICONS['the-connector'].white,
      title: 'The Connector',
      subtitle: '5 rounds · Card Match',
      start: () => { track('quiz_card_tapped', { quizId: 'the-connector', type: 'card_match' }); navigate('/card-match', { state: { flowId: 'the-connector' } }) },
    },
    {
      id: 'the-architect',
      iconSrc: QUIZ_ICONS['the-architect'].white,
      title: 'The Architect',
      subtitle: '5 rounds · Card Match',
      start: () => { track('quiz_card_tapped', { quizId: 'the-architect', type: 'card_match' }); navigate('/card-match', { state: { flowId: 'the-architect' } }) },
    },
    {
      id: 'the-historian',
      iconSrc: QUIZ_ICONS['the-historian'].white,
      title: 'The Historian',
      subtitle: '10 statements · Swipe',
      start: () => { track('quiz_card_tapped', { quizId: 'the-historian', type: 'swipe' }); navigate('/swipe-quiz', { state: { quizId: 'the-historian' } }) },
    },
    {
      id: 'the-referee',
      iconSrc: QUIZ_ICONS['the-referee'].white,
      title: 'The Referee',
      subtitle: '5 questions · Quiz',
      start: () => { track('quiz_card_tapped', { quizId: 'the-referee', type: 'quiz' }); navigate('/quiz', { state: { quizId: 'the-referee' } }) },
    },
    {
      id: 'the-retrospective',
      iconSrc: QUIZ_ICONS['the-retrospective'].white,
      title: 'The Retrospective',
      subtitle: '5 questions · Ranking',
      start: () => { track('quiz_card_tapped', { quizId: 'the-retrospective', type: 'ranking' }); navigate('/ranking-quiz', { state: { quizId: 'the-retrospective' } }) },
    },
  ]

  // ── Journey card logic: compute total quizzes and find next available quiz ──
  const totalQuizzes = FLOWS.length
  const quizCount = FLOWS.filter(f => !!state.quizResults[f.id]).length
  const allQuizzesDone = quizCount >= totalQuizzes

  const handleJourneyStart = useCallback(() => {
    if (!cardComplete) {
      track('complete_fan_card_journey_tapped')
      fanCardSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => fanCardRef.current?.startEditing(), 500)
      return
    }

    track('card_start_quiz_tapped')

    // Find first unlocked, uncompleted flow
    for (const flow of FLOWS) {
      if (state.quizResults[flow.id]) continue
      if (isFlowUnlocked(flow.id)) {
        flow.start()
        return
      }
      break
    }

    // Fallback: scroll to quiz section
    quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [cardComplete, state.quizResults, isFlowUnlocked])

  return (
    <Screen>
      {/* ── Content ────────────────────────────────────────── */}
      <div className="f-page-enter hide-scrollbar"
        data-page="card"
        style={{
          flex: 1, position: 'relative',
          padding: 'var(--f-brand-space-md) var(--f-brand-space-lg)',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        }}
      >
          {/* ── Fan Card ──────────────────────────────────────── */}
          <section className="card-fan-card-section" data-section="fan-card" ref={fanCardSectionRef} aria-label="Your Fan Card" style={{ width: '100%', marginBottom: 'var(--f-brand-space-md)' }}>
            <FanCard
              ref={fanCardRef}
              fanCard={state.fanCard}
              onSave={handleSave}
              onShare={handleShare}
              onSaveToDevice={handleSaveToDevice}
            />
          </section>

          {/* ── Journey ───────────────────────────────────────── */}
          <div className="card-journey-wrapper" data-section="journey-card">
            <JourneyCard
              completedAt={state.fanCard.completedAt}
              quizCount={quizCount}
              totalQuizzes={totalQuizzes}
              allComplete={allQuizzesDone}
              cardComplete={cardComplete}
              completedFlows={new Set(FLOWS.filter(f => !!state.quizResults[f.id]).map(f => f.id))}
              onStartQuiz={handleJourneyStart}
            />
          </div>

          {/* ── Quizzes ───────────────────────────────────────── */}
          <section className="card-quiz-section" data-section="quiz-grid" ref={quizRef} style={{ paddingBottom: 'var(--f-brand-space-3xl)' }}>
            <div className="card-quiz-header" style={{ marginBottom: 'var(--f-brand-space-md)' }}>
              <h2 className="card-quiz-heading" style={{
                font: 'var(--f-brand-type-title-2)',
                letterSpacing: 'var(--tracking-tighter)', color: 'var(--f-brand-color-text-default)',
              }}>
                Earn Avios
              </h2>
              <p className="card-quiz-description" style={{
                font: 'var(--f-brand-type-subheading)',
                color: 'var(--c-text-2)', marginTop: 'var(--f-brand-space-2xs)',
              }}>
                Complete quizzes to climb the leaderboard
              </p>
            </div>

            <div className="f-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--f-brand-space-md)' }}>
              {FLOWS.map(flow => {
                const result = state.quizResults[flow.id]
                const locked = !cardComplete || !isFlowUnlocked(flow.id)
                const lockMessage = !cardComplete
                  ? 'Complete your fan card to unlock'
                  : 'Complete the previous quiz to unlock'
                return (
                  <ExtraQuizCard
                    key={flow.id}
                    iconSrc={flow.iconSrc}
                    title={flow.title}
                    subtitle={flow.subtitle}
                    result={result ? { score: result.score, total: result.total } : undefined}
                    locked={locked}
                    lockMessage={locked ? lockMessage : undefined}
                    onStart={flow.start}
                  />
                )
              })}
            </div>
          </section>
        </div>
    </Screen>
  )
}

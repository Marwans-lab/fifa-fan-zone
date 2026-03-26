import { useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import FanCard, { type FanCardHandle } from '../components/FanCard'
import { track } from '../lib/analytics'
import { useStore, type FlowId } from '../store/useStore'
import { renderCardToBlob, buildShareText } from '../lib/cardExport'
import lockIcon    from '../assets/icons/Lock-white.svg'
import chevRight   from '../assets/icons/Chevron-right-white.svg'
import tickBlack   from '../assets/icons/Tick-black.svg'
import targetIcon  from '../assets/icons/Target-white.svg'
import fireIcon    from '../assets/icons/Fire-white.svg'
import trophyIcon  from '../assets/icons/Trophy-white.svg'
import qrIcon      from '../assets/icons/qr-logo.svg'

// ─── Milestone config ─────────────────────────────────────────────────────────
const MILESTONES = [
  { iconSrc: qrIcon,     label: 'Fan card',   key: 'card'     },
  { iconSrc: targetIcon, label: '1st quiz',    key: 'quiz1'    },
  { iconSrc: fireIcon,   label: '3 quizzes',   key: 'quiz3'    },
  { iconSrc: trophyIcon, label: 'Champion',    key: 'champion' },
] as const

function statusLabel(done: number): string {
  if (done === 0) return 'New arrival'
  if (done === 1) return 'Rising fan'
  if (done === 2) return 'Quiz taker'
  if (done === 3) return 'Top fan'
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
    width: 'var(--sp-14)', height: 'var(--sp-14)', borderRadius: '50%',
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
    <li style={{
      position: 'relative', zIndex: 10,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--f-brand-space-sm)',
      width: 'var(--sp-14)', flexShrink: 0,
    }}>
      <div style={nodeStyle}>
        {isCurrent && (
          <div
            className="animate-ping-slow"
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(0,0,0,0.1)', pointerEvents: 'none',
            }}
          />
        )}
        {isCompleted ? (
          <img src={tickBlack} width={24} height={24} alt="" style={{ position: 'relative', zIndex: 10, filter: 'invert(1)' }} />
        ) : (
          <img src={iconSrc} width={24} height={24} alt="" style={{ opacity: isCurrent ? 1 : 0.3, filter: 'invert(1)' }} />
        )}
      </div>
      <span style={{
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
  onStartQuiz,
}: {
  completedAt: string | null
  quizCount: number
  onStartQuiz: () => void
}) {
  const achieved = [
    completedAt !== null,
    quizCount >= 1,
    quizCount >= 3,
    quizCount >= 5,
  ]
  const doneCount = achieved.filter(Boolean).length
  const status = statusLabel(doneCount)

  // Find first incomplete milestone for "current" indicator
  const currentIdx = achieved.findIndex(v => !v)

  return (
    <section
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--f-brand-space-lg)' }}>
        <div>
          <h2 style={{
            font: 'var(--f-brand-type-caption-medium)',
            letterSpacing: 'var(--tracking-wide)',
            color: 'var(--f-brand-color-text-muted)', marginBottom: 'var(--f-brand-space-2xs)',
          }}>
            Your journey
          </h2>
          <p style={{
            font: 'var(--f-brand-type-headline-medium)',
            letterSpacing: 'var(--tracking-semi)', color: 'var(--f-brand-color-text-default)',
          }}>
            {status}
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--sp-3) var(--sp-4)',
          background: 'rgba(0,0,0,0.04)',
          borderRadius: 9999,
          border: '1px solid var(--f-brand-color-border-default)',
        }}>
          <span style={{
            font: 'var(--f-brand-type-caption)',
            color: 'var(--f-brand-color-text-default)', lineHeight: 'var(--leading-none)',
          }}>
            Step {Math.min(doneCount + 1, 4)}/4
          </span>
        </div>
      </div>

      {/* Steps track */}
      <nav aria-label="Journey Steps">
        <ol style={{ display: 'flex', alignItems: 'flex-start', width: '100%', position: 'relative', listStyle: 'none' }}>
          {MILESTONES.map((m, i) => {
            const done = achieved[i]
            const isCurrent = currentIdx === i
            const isLast = i === MILESTONES.length - 1
            return (
              <div key={m.key} style={{ display: 'contents' }}>
                <JourneyStep
                  iconSrc={m.iconSrc}
                  label={m.label}
                  isCompleted={done}
                  isCurrent={isCurrent}
                />
                {!isLast && (() => {
                  const nextDone = achieved[i + 1]
                  const lineBg = done && nextDone
                    ? 'var(--f-brand-color-text-default)'                               // fully active
                    : done && !nextDone
                    ? 'linear-gradient(90deg, var(--f-brand-color-text-default), var(--f-brand-color-border-default))' // half active
                    : 'var(--f-brand-color-border-default)'                             // inactive
                  return (
                    <div style={{
                      flex: 1, height: 2, marginTop: 'var(--sp-7)',
                      background: lineBg,
                      transition: 'background var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default)',
                    }} />
                  )
                })()}
              </div>
            )
          })}
        </ol>
      </nav>

      {/* Start Quiz CTA */}
      <button
        onClick={onStartQuiz}
        style={{
          width: '100%', height: 'var(--sp-12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--f-brand-color-text-default)', color: 'var(--f-brand-color-text-light)',
          font: 'var(--f-brand-type-body-medium)', fontWeight: 'var(--weight-bold)',
          fontSize: 'var(--text-md)', borderRadius: 9999, border: 'none',
          marginTop: 'var(--sp-7)', cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          transition: 'all var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Start quiz
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
    <svg
      width={radius * 2}
      height={radius * 2}
      style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
    >
      {/* background track */}
      <circle
        cx={radius} cy={radius} r={norm}
        fill="none" stroke="var(--f-brand-color-border-default)" strokeWidth={stroke}
      />
      {/* progress arc */}
      {progress > 0 && (
        <circle
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
  emoji,
  title,
  subtitle,
  result,
  locked,
  lockMessage,
  onStart,
}: {
  emoji: string
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
    <button
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--f-brand-space-md)' }}>
        <div style={{
          width: RING_RADIUS * 2, height: RING_RADIUS * 2,
          position: 'relative', flexShrink: 0,
        }}>
          <ProgressRing
            radius={RING_RADIUS}
            stroke={RING_STROKE}
            progress={done ? 1 : 0}
            color={done ? 'var(--f-brand-color-accent)' : 'var(--f-brand-color-border-default)'}
          />
          <div style={{
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
              <img src={lockIcon} width={24} height={24} alt="" style={{ opacity: 0.4, filter: 'invert(1)' }} />
            ) : done ? (
              <img src={tickBlack} width={24} height={24} alt="" />
            ) : (
              <span style={{ fontSize: 'var(--text-2xl)' }}>{emoji}</span>
            )}
          </div>
        </div>
        <div>
          <h3 style={{
            font: 'var(--f-brand-type-headline-medium)',
            color: locked ? 'var(--f-brand-color-text-subtle)' : 'var(--f-brand-color-text-default)',
          }}>
            {title}
          </h3>
          <p style={{ font: 'var(--f-brand-type-caption)', fontSize: 'var(--text-sm)', color: 'var(--f-brand-color-text-muted)', marginTop: 'var(--f-brand-space-xs)' }}>
            {done ? (
              <span style={{ color: 'var(--f-brand-color-text-default)', fontWeight: 'var(--weight-med)' }}>
                Completed · {result.score}/{result.total} correct
              </span>
            ) : locked ? (
              lockMessage ?? 'Complete your fan card to unlock'
            ) : (
              <span style={{ color: 'var(--f-brand-color-text-default)', fontWeight: 'var(--weight-med)' }}>
                {subtitle}
              </span>
            )}
          </p>
        </div>
      </div>
      {!locked && !done && (
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(0,0,0,0.04)', border: '1px solid var(--f-brand-color-border-default)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: 'var(--f-brand-space-2xs)',
        }}>
          {loading ? (
            <div
              aria-label="Loading"
              style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '2.5px solid var(--f-brand-color-border-default)',
                borderTopColor: 'var(--f-brand-color-accent)',
                animation: 'quiz-spin 0.6s linear infinite',
              }}
            />
          ) : (
            <img src={chevRight} width={24} height={24} alt="" style={{ opacity: 0.5, filter: 'invert(1)' }} />
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
    emoji: string
    title: string
    subtitle: string
    start: () => void
  }> = [
    {
      id: 'the-connector',
      emoji: '✈️',
      title: 'The Connector',
      subtitle: '5 rounds · Card Match',
      start: () => { track('quiz_card_tapped', { quizId: 'the-connector', type: 'card_match' }); navigate('/card-match', { state: { flowId: 'the-connector' } }) },
    },
    {
      id: 'the-architect',
      emoji: '🏟',
      title: 'The Architect',
      subtitle: '5 rounds · Card Match',
      start: () => { track('quiz_card_tapped', { quizId: 'the-architect', type: 'card_match' }); navigate('/card-match', { state: { flowId: 'the-architect' } }) },
    },
    {
      id: 'the-historian',
      emoji: '📜',
      title: 'The Historian',
      subtitle: '10 statements · Swipe',
      start: () => { track('quiz_card_tapped', { quizId: 'the-historian', type: 'swipe' }); navigate('/swipe-quiz', { state: { quizId: 'the-historian' } }) },
    },
    {
      id: 'the-referee',
      emoji: '🟨',
      title: 'The Referee',
      subtitle: '5 questions · Quiz',
      start: () => { track('quiz_card_tapped', { quizId: 'the-referee', type: 'quiz' }); navigate('/quiz', { state: { quizId: 'the-referee' } }) },
    },
    {
      id: 'the-retrospective',
      emoji: '📊',
      title: 'The Retrospective',
      subtitle: '5 questions · Ranking',
      start: () => { track('quiz_card_tapped', { quizId: 'the-retrospective', type: 'ranking' }); navigate('/ranking-quiz', { state: { quizId: 'the-retrospective' } }) },
    },
  ]

  return (
    <Screen>
      {/* ── Content ────────────────────────────────────────── */}
      <div
        className="f-page-enter hide-scrollbar"
        style={{
          flex: 1, position: 'relative',
          padding: 'var(--f-brand-space-md) var(--f-brand-space-lg)',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        }}
      >
          {/* ── Fan Hub Header ─────────────────────────────────── */}
          <header style={{
            textAlign: 'center',
            paddingTop: 'var(--sp-6)',
            paddingBottom: 'var(--sp-6)',
            position: 'relative',
          }}>
            {/* Ambient brand glow */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '-40%', left: '50%', transform: 'translateX(-50%)',
                width: '120%', height: '160%',
                background: 'radial-gradient(ellipse at center, rgba(200,16,46,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <h1 style={{
              font: 'var(--f-brand-type-title-2)',
              fontStyle: 'italic',
              letterSpacing: 'var(--tracking-tight)',
              color: 'var(--c-text-1)',
              position: 'relative',
            }}>
              FIFA Fan Zone
            </h1>
            <p style={{
              font: 'var(--f-brand-type-subheading)',
              fontSize: 'var(--text-sm)',
              color: 'var(--c-text-2)',
              marginTop: 'var(--sp-2)',
              position: 'relative',
            }}>
              {cardComplete ? 'Welcome back, fan!' : 'Your fan card is almost ready'}
            </p>
          </header>

          {/* ── Fan Card ──────────────────────────────────────── */}
          <section ref={fanCardSectionRef} aria-label="Your Fan Card" style={{ width: '100%', marginBottom: 'var(--f-brand-space-md)' }}>
            <FanCard
              ref={fanCardRef}
              fanCard={state.fanCard}
              onSave={handleSave}
              onShare={handleShare}
              onSaveToDevice={handleSaveToDevice}
            />
          </section>

          {/* ── Complete fan card CTA ────────────────────────────── */}
          {!cardComplete && (
            <Button
              fullWidth
              onClick={() => {
                track('complete_fan_card_tapped')
                fanCardSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                setTimeout(() => fanCardRef.current?.flipToBack(), 500)
              }}
              style={{ marginBottom: 'var(--f-brand-space-md)' }}
            >
              Complete fan card
            </Button>
          )}

          {/* ── Journey ───────────────────────────────────────── */}
          <JourneyCard
            completedAt={state.fanCard.completedAt}
            quizCount={Object.keys(state.quizResults).length}
            onStartQuiz={() => {
              track('card_start_quiz_tapped')
              quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          />

          {/* ── Quizzes ───────────────────────────────────────── */}
          <section ref={quizRef} style={{ paddingBottom: 'var(--f-brand-space-3xl)' }}>
            <div style={{ marginBottom: 'var(--f-brand-space-md)' }}>
              <h2 style={{
                font: 'var(--f-brand-type-title-2)',
                letterSpacing: 'var(--tracking-tighter)', color: 'var(--f-brand-color-text-light)',
              }}>
                Earn Avios
              </h2>
              <p style={{
                font: 'var(--f-brand-type-subheading)',
                color: 'rgba(255,255,255,0.5)', marginTop: 'var(--f-brand-space-2xs)',
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
                    emoji={flow.emoji}
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

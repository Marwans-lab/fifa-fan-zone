import { useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import FanCard from '../components/FanCard'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { renderCardToBlob, buildShareText } from '../lib/cardExport'
import { QUIZZES } from '../data/quizzes'
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
    width: 56, height: 56, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
    transition: 'all 700ms ease',
    flexShrink: 0, position: 'relative',
    ...(isCompleted ? {
      background: 'var(--c-text-1)', border: '1px solid var(--c-text-1)',
      boxShadow: '0 0 25px rgba(255,255,255,0.4)',
      transform: 'scale(1.1)', zIndex: 20,
    } : isCurrent ? {
      background: 'var(--c-surface-raise)', border: '1px solid var(--c-border-raise)',
      transform: 'scale(1.05)', zIndex: 20,
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    } : {
      background: 'var(--glass-bg-subtle)', border: '1px solid rgba(255,255,255,0.1)',
      zIndex: 10,
    }),
  }

  return (
    <li style={{
      position: 'relative', zIndex: 10,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-3)',
      width: 56, flexShrink: 0,
    }}>
      <div style={nodeStyle}>
        {isCurrent && (
          <div
            className="animate-ping-slow"
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
            }}
          />
        )}
        {isCompleted ? (
          <img src={tickBlack} width={22} height={22} alt="" style={{ position: 'relative', zIndex: 10 }} />
        ) : (
          <img src={iconSrc} width={16} height={16} alt="" style={{ opacity: isCurrent ? 1 : 0.3 }} />
        )}
      </div>
      <span style={{
        fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-reg)',
        fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-snug)', textAlign: 'center',
        whiteSpace: 'nowrap', transition: 'color 500ms ease',
        color: isCompleted || isCurrent ? 'var(--c-text-1)' : 'var(--c-text-3)',
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
        background: 'var(--glass-bg)',
        borderRadius: 'var(--r-xl)',
        padding: 'var(--sp-8)',
        border: '1px solid var(--c-border)',
        marginBottom: 'var(--sp-4)',
        boxShadow: 'var(--glass-shine)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-10)' }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-med)',
            fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wide)',
            color: 'var(--c-text-2)', marginBottom: 'var(--sp-1)',
          }}>
            Your journey
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-med)',
            fontSize: 'var(--text-lg)', letterSpacing: 'var(--tracking-snug)', color: 'var(--c-text-1)',
          }}>
            {status}
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--sp-3) var(--sp-4)',
          background: 'var(--c-surface-press)',
          borderRadius: 'var(--r-full)',
          border: '1px solid var(--c-surface-press)',
        }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-reg)',
            fontSize: 'var(--text-xs)', color: 'var(--c-text-1)', lineHeight: 1,
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

            // Progress line states:
            // 1. Both sides done → fully active (solid white)
            // 2. Left done, right undone → half active (gradient white→dim)
            // 3. Both sides undone → inactive (low opacity)
            let lineBackground = 'rgba(255,255,255,0.08)'
            if (!isLast) {
              const leftDone = achieved[i]
              const rightDone = achieved[i + 1]
              if (leftDone && rightDone) {
                lineBackground = '#ffffff'
              } else if (leftDone && !rightDone) {
                lineBackground = 'linear-gradient(90deg, #ffffff, rgba(255,255,255,0.08))'
              }
            }

            return (
              <div key={m.key} style={{ display: 'contents' }}>
                <JourneyStep
                  iconSrc={m.iconSrc}
                  label={m.label}
                  isCompleted={done}
                  isCurrent={isCurrent}
                />
                {!isLast && (
                  <div style={{
                    flex: 1, height: 2, marginTop: 27,
                    background: lineBackground,
                    transition: 'background 700ms ease',
                  }} />
                )}
              </div>
            )
          })}
        </ol>
      </nav>

      {/* Start Quiz CTA */}
      <button
        onClick={onStartQuiz}
        className="btn btn-primary"
        style={{
          width: '100%',
          marginTop: 'var(--sp-7)',
          boxShadow: '0 10px 30px rgba(255,255,255,0.12)',
        }}
      >
        Start quiz
      </button>
    </section>
  )
}

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
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke}
      />
      {/* progress arc */}
      {progress > 0 && (
        <circle
          cx={radius} cy={radius} r={norm}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      )}
    </svg>
  )
}

// ─── Quiz card ────────────────────────────────────────────────────────────────
type QuizCardState = 'active' | 'done' | 'locked'

const RING_RADIUS = 40
const RING_STROKE = 3.5

function QuizCard({
  quiz,
  cardState,
  progress,
  onStart,
}: {
  quiz: (typeof QUIZZES)[number]
  cardState: QuizCardState
  progress: number
  onStart: () => void
}) {
  const locked = cardState === 'locked'
  const done   = cardState === 'done'

  return (
    <button
      onClick={locked ? undefined : onStart}
      disabled={locked}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--sp-5) var(--sp-4)', borderRadius: 'var(--r-xl)',
        minHeight: 120,
        border: `1px solid ${locked ? 'rgba(255,255,255,0.06)' : done ? 'var(--c-border-accent)' : 'var(--c-border)'}`,
        background: locked ? 'var(--glass-bg-subtle)' : done ? 'rgba(0,212,170,0.06)' : 'var(--glass-bg-subtle)',
        opacity: locked ? 0.55 : 1,
        cursor: locked ? 'not-allowed' : 'pointer',
        textAlign: 'left', fontFamily: 'inherit', color: 'var(--c-text-1)',
        transition: 'all 400ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
        {/* Circular thumbnail with progress ring */}
        <div style={{
          width: RING_RADIUS * 2, height: RING_RADIUS * 2,
          position: 'relative', flexShrink: 0,
        }}>
          <ProgressRing
            radius={RING_RADIUS}
            stroke={RING_STROKE}
            progress={done ? 1 : 0}
            color={done ? 'var(--c-accent)' : 'rgba(255,255,255,0.3)'}
          />
          {/* Inner circle */}
          <div style={{
            position: 'absolute',
            top: RING_STROKE + 2, left: RING_STROKE + 2,
            width: (RING_RADIUS - RING_STROKE - 2) * 2,
            height: (RING_RADIUS - RING_STROKE - 2) * 2,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: locked
              ? 'rgba(255,255,255,0.04)'
              : done
              ? 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,212,170,0.05))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
            boxShadow: locked ? 'none' : '0 6px 20px rgba(0,0,0,0.25)',
          }}>
            {locked ? (
              <img src={lockIcon} width={20} height={20} alt="" style={{ opacity: 0.4 }} />
            ) : done ? (
              <img src={tickBlack} width={22} height={22} alt="" style={{ filter: 'invert(1)' }} />
            ) : (
              <span style={{ fontSize: 30 }}>{quiz.emoji}</span>
            )}
          </div>
        </div>

        {/* Text */}
        <div>
          <h3 style={{
            fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-med)',
            fontSize: 'var(--text-lg)',
            color: locked ? 'var(--c-text-2)' : 'var(--c-text-1)',
          }}>
            {quiz.title}
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)', marginTop: 'var(--sp-2)' }}>
            {done ? (
              <span style={{ color: 'var(--c-accent)', fontWeight: 'var(--weight-med)' }}>
                Completed · {Math.round(progress * quiz.questions.length)}/{quiz.questions.length} correct
              </span>
            ) : locked ? (
              'Complete previous quiz to unlock'
            ) : (
              <span style={{ color: 'var(--c-accent)', fontWeight: 'var(--weight-med)' }}>
                {quiz.questions.length} questions · {quiz.questions.length * 15}s
              </span>
            )}
          </p>
        </div>
      </div>

      {!locked && !done && (
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--glass-bg-subtle)', border: '1px solid var(--c-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: 'var(--sp-1)',
        }}>
          <img src={chevRight} width={16} height={16} alt="" style={{ opacity: 0.5 }} />
        </div>
      )}
    </button>
  )
}

// ─── Main Card route ──────────────────────────────────────────────────────────
export default function Card() {
  const navigate = useNavigate()
  const { state, updateFanCard } = useStore()
  const quizRef = useRef<HTMLDivElement>(null)

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

  function getCardState(i: number): QuizCardState {
    const quizId = QUIZZES[i].id
    if (state.quizResults[quizId]) return 'done'
    if (i === 0) return 'active'
    const prevId = QUIZZES[i - 1].id
    return state.quizResults[prevId] ? 'active' : 'locked'
  }

  function getProgress(i: number): number {
    const result = state.quizResults[QUIZZES[i].id]
    if (!result) return 0
    return result.score / result.total
  }

  function handleStartQuiz(quizId: string) {
    track('quiz_card_tapped', { quizId })
    navigate('/quiz', { state: { quizId } })
  }

  return (
    <Screen>
      <div
        className="page-in hide-scrollbar"
        style={{
          flex: 1, position: 'relative',
          padding: 'var(--sp-4) var(--sp-6)',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        }}
      >

          {/* ── Fan Card ──────────────────────────────────────── */}
          <section aria-label="Your Fan Card" style={{ width: '100%', marginBottom: 'var(--sp-4)' }}>
            <FanCard
              fanCard={state.fanCard}
              onSave={handleSave}
              onShare={handleShare}
              onSaveToDevice={handleSaveToDevice}
            />
          </section>

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
          <section ref={quizRef} style={{ paddingBottom: 'var(--sp-12)' }}>
            <div style={{ marginBottom: 'var(--sp-4)' }}>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-thin)',
                fontSize: 'var(--text-2xl)', letterSpacing: 'var(--tracking-tight)', color: 'var(--c-text-1)',
              }}>
                Earn Avios
              </h2>
              <p style={{
                fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-reg)',
                color: 'var(--c-text-2)', fontSize: 'var(--text-sm)', marginTop: 'var(--sp-1)',
              }}>
                Complete quizzes to climb the leaderboard
              </p>
            </div>

            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              {QUIZZES.map((quiz, i) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  cardState={getCardState(i)}
                  progress={getProgress(i)}
                  onStart={() => handleStartQuiz(quiz.id)}
                />
              ))}
            </div>
          </section>
        </div>
    </Screen>
  )
}

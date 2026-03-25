import { useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import FanCard from '../components/FanCard'
import { track } from '../lib/analytics'
import { useStore, type FlowId } from '../store/useStore'
import { renderCardToBlob, buildShareText } from '../lib/cardExport'
import { QUIZZES } from '../data/quizzes'
import { DRAG_DROP_QUIZZES } from '../data/dragDropQuizzes'
import { IMAGE_QUIZZES } from '../data/imageQuizzes'
import { SWIPE_QUIZZES } from '../data/swipeQuizzes'
import { RANKING_QUIZZES } from '../data/rankingQuizzes'
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
      width: 56, flexShrink: 0,
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
        fontFamily: 'var(--f-base-type-family-secondary)', fontWeight: '400',
        fontSize: 12, letterSpacing: '-0.02em', textAlign: 'center',
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
            fontFamily: 'var(--f-base-type-family-secondary)', fontWeight: '500',
            fontSize: 12, letterSpacing: '0.05em',
            color: 'var(--f-brand-color-text-muted)', marginBottom: 'var(--f-brand-space-2xs)',
          }}>
            Your journey
          </h2>
          <p style={{
            fontFamily: 'var(--f-base-type-family-secondary)', fontWeight: '500',
            fontSize: 18, letterSpacing: '-0.02em', color: 'var(--f-brand-color-text-default)',
          }}>
            {status}
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '10px 16px',
          background: 'rgba(0,0,0,0.04)',
          borderRadius: 9999,
          border: '1px solid var(--f-brand-color-border-default)',
        }}>
          <span style={{
            fontFamily: 'var(--f-base-type-family-secondary)', fontWeight: '400',
            fontSize: 12, color: 'var(--f-brand-color-text-default)', lineHeight: 1,
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
                      flex: 1, height: 2, marginTop: 27,
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
          width: '100%', height: 48,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--f-brand-color-text-default)', color: 'var(--f-brand-color-text-light)',
          fontFamily: 'var(--f-base-type-family-secondary)', fontWeight: '600',
          fontSize: 15, borderRadius: 9999, border: 'none',
          marginTop: 28, cursor: 'pointer',
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

// ─── Quiz card ────────────────────────────────────────────────────────────────
type QuizCardState = 'active' | 'done' | 'locked'

const RING_RADIUS = 40
const RING_STROKE = 3.5

function QuizCard({
  quiz,
  cardState,
  progress,
  lockMessage,
  onStart,
}: {
  quiz: (typeof QUIZZES)[number]
  cardState: QuizCardState
  progress: number
  lockMessage?: string
  onStart: () => void
}) {
  const locked = cardState === 'locked'
  const done   = cardState === 'done'
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
        padding: '18px 14px', borderRadius: 'var(--f-brand-radius-outer)',
        minHeight: 120,
        border: `1px solid ${locked ? 'var(--f-brand-color-border-disabled)' : done ? 'rgba(0,212,170,0.25)' : 'var(--f-brand-color-border-default)'}`,
        background: 'var(--f-brand-color-background-light)',
        opacity: locked ? 0.55 : 1,
        cursor: locked ? 'not-allowed' : 'pointer',
        textAlign: 'left', fontFamily: 'inherit', color: 'var(--f-brand-color-text-default)',
        transition: 'all var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--f-brand-space-md)' }}>
        {/* Circular thumbnail with progress ring */}
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
          {/* Inner circle */}
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
              <span style={{ fontSize: 30 }}>{quiz.emoji}</span>
            )}
          </div>
        </div>

        {/* Text */}
        <div>
          <h3 style={{
            fontFamily: 'var(--f-base-type-family-secondary)', fontWeight: '500',
            fontSize: '18',
            color: locked ? 'var(--f-brand-color-text-subtle)' : 'var(--f-brand-color-text-default)',
          }}>
            {quiz.title}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--f-brand-color-text-muted)', marginTop: 'var(--f-brand-space-xs)' }}>
            {done ? (
              <span style={{ color: 'var(--f-brand-color-text-default)', fontWeight: '500' }}>
                Completed · {Math.round(progress * quiz.questions.length)}/{quiz.questions.length} correct
              </span>
            ) : locked ? (
              lockMessage ?? 'Complete previous quiz to unlock'
            ) : (
              <span style={{ color: 'var(--f-brand-color-text-default)', fontWeight: '500' }}>
                {quiz.questions.length} questions · {quiz.questions.length * 15}s
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

// ─── Drag-drop quiz card ─────────────────────────────────────────────────────
function DragDropQuizCard({
  quiz: ddQuiz,
  result,
  locked,
  onStart,
}: {
  quiz: (typeof DRAG_DROP_QUIZZES)[number]
  result: { score: number; total: number } | undefined
  locked: boolean
  onStart: () => void
}) {
  const done = !!result
  const totalPairs = ddQuiz.questions.reduce((sum, q) => sum + q.pairs.length, 0)
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
        padding: '18px 14px', borderRadius: 'var(--f-brand-radius-outer)',
        minHeight: 120,
        border: `1px solid ${locked ? 'var(--f-brand-color-border-disabled)' : done ? 'rgba(0,212,170,0.25)' : 'var(--f-brand-color-border-default)'}`,
        background: 'var(--f-brand-color-background-light)',
        opacity: locked ? 0.55 : 1,
        cursor: locked ? 'not-allowed' : 'pointer',
        textAlign: 'left', fontFamily: 'inherit', color: 'var(--f-brand-color-text-default)',
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
              <span style={{ fontSize: '28' }}>{ddQuiz.emoji}</span>
            )}
          </div>
        </div>
        <div>
          <h3 style={{
            fontFamily: 'var(--f-base-type-family-secondary)', fontWeight: '500',
            fontSize: '18',
            color: locked ? 'var(--f-brand-color-text-subtle)' : 'var(--f-brand-color-text-default)',
          }}>
            {ddQuiz.title}
          </h3>
          <p style={{ fontSize: '13', color: 'var(--f-brand-color-text-muted)', marginTop: 'var(--f-brand-space-xs)' }}>
            {done ? (
              <span style={{ color: 'var(--f-brand-color-text-default)', fontWeight: '500' }}>
                Completed · {result.score}/{result.total} correct
              </span>
            ) : locked ? (
              'Complete your fan card to unlock'
            ) : (
              <span style={{ color: 'var(--f-brand-color-text-default)', fontWeight: '500' }}>
                {totalPairs} matches · Drag & Drop
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
        padding: '18px 14px', borderRadius: 'var(--f-brand-radius-outer)',
        minHeight: 120,
        border: `1px solid ${locked ? 'var(--f-brand-color-border-disabled)' : done ? 'rgba(0,212,170,0.25)' : 'var(--f-brand-color-border-default)'}`,
        background: 'var(--f-brand-color-background-light)',
        opacity: locked ? 0.55 : 1,
        cursor: locked ? 'not-allowed' : 'pointer',
        textAlign: 'left', fontFamily: 'inherit', color: 'var(--f-brand-color-text-default)',
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
              <span style={{ fontSize: '28' }}>{emoji}</span>
            )}
          </div>
        </div>
        <div>
          <h3 style={{
            fontFamily: 'var(--f-base-type-family-secondary)', fontWeight: '500',
            fontSize: '18',
            color: locked ? 'var(--f-brand-color-text-subtle)' : 'var(--f-brand-color-text-default)',
          }}>
            {title}
          </h3>
          <p style={{ fontSize: '13', color: 'var(--f-brand-color-text-muted)', marginTop: 'var(--f-brand-space-xs)' }}>
            {done ? (
              <span style={{ color: 'var(--f-brand-color-text-default)', fontWeight: '500' }}>
                Completed · {result.score}/{result.total} correct
              </span>
            ) : locked ? (
              lockMessage ?? 'Complete your fan card to unlock'
            ) : (
              <span style={{ color: 'var(--f-brand-color-text-default)', fontWeight: '500' }}>
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

  function getCardState(i: number): QuizCardState {
    if (!cardComplete) return 'locked'
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

  function handleStartDragDropQuiz(quizId: string) {
    track('quiz_card_tapped', { quizId, type: 'drag_drop' })
    navigate('/drag-drop-quiz', { state: { quizId } })
  }

  function handleStartImageQuiz(quizId: string) {
    track('quiz_card_tapped', { quizId, type: 'image' })
    navigate('/image-quiz', { state: { quizId } })
  }

  function handleStartSwipeQuiz(quizId: string) {
    track('quiz_card_tapped', { quizId, type: 'swipe' })
    navigate('/swipe-quiz', { state: { quizId } })
  }

  function handleStartCardMatch() {
    track('quiz_card_tapped', { quizId: 'card-match', type: 'card_match' })
    navigate('/card-match')
  }

  function handleStartRankingQuiz(quizId: string) {
    track('quiz_card_tapped', { quizId, type: 'ranking' })
    navigate('/ranking-quiz', { state: { quizId } })
  }

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

          {/* ── Fan Card ──────────────────────────────────────── */}
          <section aria-label="Your Fan Card" style={{ width: '100%', marginBottom: 'var(--f-brand-space-md)' }}>
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
          <section ref={quizRef} style={{ paddingBottom: 'var(--f-brand-space-3xl)' }}>
            <div style={{ marginBottom: 'var(--f-brand-space-md)' }}>
              <h2 style={{
                fontFamily: 'var(--f-base-type-family-primary)', fontWeight: '100',
                fontSize: 28, letterSpacing: '-0.04em', color: 'var(--f-brand-color-text-light)',
              }}>
                Earn Avios
              </h2>
              <p style={{
                fontFamily: 'var(--f-base-type-family-secondary)', fontWeight: '400',
                color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 'var(--f-brand-space-2xs)',
              }}>
                Complete quizzes to climb the leaderboard
              </p>
            </div>

            <div className="f-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--f-brand-space-md)' }}>
              {QUIZZES.map((quiz, i) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  cardState={getCardState(i)}
                  progress={getProgress(i)}
                  lockMessage={!cardComplete ? 'Complete your fan card to unlock' : undefined}
                  onStart={() => handleStartQuiz(quiz.id)}
                />
              ))}
              {DRAG_DROP_QUIZZES.map(ddQuiz => (
                <DragDropQuizCard
                  key={ddQuiz.id}
                  quiz={ddQuiz}
                  result={state.quizResults[ddQuiz.id]}
                  locked={!cardComplete}
                  onStart={() => handleStartDragDropQuiz(ddQuiz.id)}
                />
              ))}
              {IMAGE_QUIZZES.map(iq => (
                <ExtraQuizCard
                  key={iq.id}
                  emoji={iq.emoji}
                  title={iq.title}
                  subtitle={`${iq.questions.length} questions · Image Quiz`}
                  result={state.quizResults[iq.id]}
                  locked={!cardComplete}
                  onStart={() => handleStartImageQuiz(iq.id)}
                />
              ))}
              {SWIPE_QUIZZES.map(sq => {
                const swipeLocked = !cardComplete || (sq.unlockedBy ? !state.quizResults[sq.unlockedBy] : false)
                return (
                  <ExtraQuizCard
                    key={sq.id}
                    emoji={sq.emoji}
                    title={sq.title}
                    subtitle={`${sq.statements.length} statements · Swipe`}
                    result={state.quizResults[sq.id]}
                    locked={swipeLocked}
                    lockMessage={!cardComplete ? 'Complete your fan card to unlock' : 'Complete the previous quiz to unlock'}
                    onStart={() => handleStartSwipeQuiz(sq.id)}
                  />
                )
              })}
              <ExtraQuizCard
                emoji="🃏"
                title="Card Match"
                subtitle="Match the pairs · Memory Game"
                result={state.quizResults['card-match']}
                locked={!cardComplete}
                onStart={handleStartCardMatch}
              />
              {RANKING_QUIZZES.map(rq => {
                const rqResult = state.quizResults[rq.id]
                const flowLocked = !cardComplete || !isFlowUnlocked(rq.id as FlowId)
                return (
                  <ExtraQuizCard
                    key={rq.id}
                    emoji={rq.emoji}
                    title={rq.title}
                    subtitle={`${rq.questions.length} questions · Ranking`}
                    result={rqResult ? { score: rqResult.score, total: rqResult.total } : undefined}
                    locked={flowLocked}
                    onStart={() => handleStartRankingQuiz(rq.id)}
                  />
                )
              })}
            </div>
          </section>
        </div>
    </Screen>
  )
}

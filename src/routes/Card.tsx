import { useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import FanCard from '../components/FanCard'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { renderCardToBlob, buildShareText } from '../lib/cardExport'
import { QUIZZES } from '../data/quizzes'
import { DRAG_DROP_QUIZZES } from '../data/dragDropQuizzes'
import { IMAGE_QUIZZES } from '../data/imageQuizzes'
import { SWIPE_QUIZZES } from '../data/swipeQuizzes'
import lockIcon    from '../assets/icons/Lock-white.svg'
import chevRight   from '../assets/icons/Chevron-right-white.svg'
import tickBlack   from '../assets/icons/Tick-black.svg'
import tickWhite   from '../assets/icons/Tick-white.svg'
import targetIcon  from '../assets/icons/Target-white.svg'
import fireIcon    from '../assets/icons/Fire-white.svg'
import trophyIcon  from '../assets/icons/Trophy-white.svg'
import qrIcon      from '../assets/icons/qr-logo.svg'
import '../styles/fds-card-hub.css'

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
  const nodeModifier = isCompleted
    ? 'f-journey-card__milestone-node--completed'
    : isCurrent
    ? 'f-journey-card__milestone-node--current'
    : 'f-journey-card__milestone-node--pending'

  const labelModifier = isCompleted || isCurrent
    ? 'f-journey-card__milestone-label--active'
    : 'f-journey-card__milestone-label--inactive'

  return (
    <li className="f-journey-card__milestone">
      <div className={`f-journey-card__milestone-node ${nodeModifier}`}>
        {isCurrent && <div className="f-journey-card__milestone-ping" />}
        {isCompleted ? (
          <img src={tickWhite} width={24} height={24} alt="" style={{ position: 'relative', zIndex: 10 }} />
        ) : (
          <img
            src={iconSrc}
            width={24}
            height={24}
            alt=""
            style={{
              opacity: isCurrent ? 1 : 0.5,
              filter: 'brightness(0)',
            }}
          />
        )}
      </div>
      <span className={`f-journey-card__milestone-label ${labelModifier}`}>
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
  const currentIdx = achieved.findIndex(v => !v)

  return (
    <section className="f-journey-card" aria-label="Your Journey Progress">
      {/* Header */}
      <div className="f-journey-card__header">
        <div>
          <h2 className="f-journey-card__label">Your journey</h2>
          <p className="f-journey-card__status">{status}</p>
        </div>
        <div className="f-journey-card__step-badge">
          Step {Math.min(doneCount + 1, 4)}/4
        </div>
      </div>

      {/* Steps track */}
      <nav aria-label="Journey Steps">
        <ol className="f-journey-card__track">
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
                  const lineModifier = done && nextDone
                    ? 'f-journey-card__progress--full'
                    : done && !nextDone
                    ? 'f-journey-card__progress--half'
                    : 'f-journey-card__progress--empty'
                  return <div className={`f-journey-card__progress ${lineModifier}`} />
                })()}
              </div>
            )
          })}
        </ol>
      </nav>

      {/* Start Quiz CTA */}
      <button className="f-journey-card__cta" onClick={onStartQuiz}>
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
  trackColor,
  color,
}: {
  radius: number
  stroke: number
  progress: number
  trackColor: string
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
      <circle
        cx={radius} cy={radius} r={norm}
        fill="none" stroke={trackColor} strokeWidth={stroke}
      />
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

  const stateClass = done
    ? 'f-quiz-card--done'
    : locked
    ? 'f-quiz-card--locked'
    : ''

  const innerBg = locked
    ? 'var(--f-brand-color-background-default)'
    : done
    ? 'var(--f-brand-color-background-success-accent)'
    : 'var(--f-brand-color-background-default)'

  return (
    <button
      className={`f-quiz-card ${stateClass}`}
      onClick={locked ? undefined : handleClick}
      disabled={locked || loading}
    >
      <div className="f-quiz-card__content">
        <div className="f-quiz-card__icon">
          <ProgressRing
            radius={RING_RADIUS}
            stroke={RING_STROKE}
            progress={done ? 1 : 0}
            trackColor="var(--f-brand-color-background-disabled)"
            color="var(--f-brand-color-background-primary)"
          />
          <div
            className="f-quiz-card__icon-inner"
            style={{
              top: RING_STROKE + 2, left: RING_STROKE + 2,
              width: (RING_RADIUS - RING_STROKE - 2) * 2,
              height: (RING_RADIUS - RING_STROKE - 2) * 2,
              background: innerBg,
            }}
          >
            {locked ? (
              <img src={lockIcon} width={24} height={24} alt="" style={{ opacity: 0.4, filter: 'brightness(0)' }} />
            ) : done ? (
              <img src={tickBlack} width={24} height={24} alt="" />
            ) : (
              <span style={{ fontSize: 'var(--text-2xl)' }}>{quiz.emoji}</span>
            )}
          </div>
        </div>

        <div>
          <h3 className="f-quiz-card__title">{quiz.title}</h3>
          <p className={`f-quiz-card__progress ${done ? 'f-quiz-card__progress--done' : ''}`}>
            {done ? (
              <>Completed · {Math.round(progress * quiz.questions.length)}/{quiz.questions.length} correct</>
            ) : locked ? (
              lockMessage ?? 'Complete previous quiz to unlock'
            ) : (
              <>{quiz.questions.length} questions · {quiz.questions.length * 15}s</>
            )}
          </p>
        </div>
      </div>

      {!locked && !done && (
        <div className="f-quiz-card__arrow">
          {loading ? (
            <div className="f-quiz-card__spinner" aria-label="Loading" />
          ) : (
            <img src={chevRight} width={24} height={24} alt="" style={{ opacity: 0.5, filter: 'brightness(0)' }} />
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

  const stateClass = done
    ? 'f-quiz-card--done'
    : locked
    ? 'f-quiz-card--locked'
    : ''

  const innerBg = locked
    ? 'var(--f-brand-color-background-default)'
    : done
    ? 'var(--f-brand-color-background-success-accent)'
    : 'var(--f-brand-color-background-default)'

  return (
    <button
      className={`f-quiz-card ${stateClass}`}
      onClick={locked ? undefined : handleClick}
      disabled={locked || loading}
    >
      <div className="f-quiz-card__content">
        <div className="f-quiz-card__icon">
          <ProgressRing
            radius={RING_RADIUS}
            stroke={RING_STROKE}
            progress={done ? 1 : 0}
            trackColor="var(--f-brand-color-background-disabled)"
            color="var(--f-brand-color-background-primary)"
          />
          <div
            className="f-quiz-card__icon-inner"
            style={{
              top: RING_STROKE + 2, left: RING_STROKE + 2,
              width: (RING_RADIUS - RING_STROKE - 2) * 2,
              height: (RING_RADIUS - RING_STROKE - 2) * 2,
              background: innerBg,
            }}
          >
            {locked ? (
              <img src={lockIcon} width={24} height={24} alt="" style={{ opacity: 0.4, filter: 'brightness(0)' }} />
            ) : done ? (
              <img src={tickBlack} width={24} height={24} alt="" />
            ) : (
              <span style={{ fontSize: 'var(--text-2xl)' }}>{ddQuiz.emoji}</span>
            )}
          </div>
        </div>

        <div>
          <h3 className="f-quiz-card__title">{ddQuiz.title}</h3>
          <p className={`f-quiz-card__progress ${done ? 'f-quiz-card__progress--done' : ''}`}>
            {done ? (
              <>Completed · {result.score}/{result.total} correct</>
            ) : locked ? (
              'Complete your fan card to unlock'
            ) : (
              <>{totalPairs} matches · Drag & Drop</>
            )}
          </p>
        </div>
      </div>

      {!locked && !done && (
        <div className="f-quiz-card__arrow">
          {loading ? (
            <div className="f-quiz-card__spinner" aria-label="Loading" />
          ) : (
            <img src={chevRight} width={24} height={24} alt="" style={{ opacity: 0.5, filter: 'brightness(0)' }} />
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
  onStart,
}: {
  emoji: string
  title: string
  subtitle: string
  result: { score: number; total: number } | undefined
  locked: boolean
  onStart: () => void
}) {
  const done = !!result
  const [loading, setLoading] = useState(false)

  function handleClick() {
    if (loading) return
    setLoading(true)
    setTimeout(() => onStart(), 300)
  }

  const stateClass = done
    ? 'f-quiz-card--done'
    : locked
    ? 'f-quiz-card--locked'
    : ''

  const innerBg = locked
    ? 'var(--f-brand-color-background-default)'
    : done
    ? 'var(--f-brand-color-background-success-accent)'
    : 'var(--f-brand-color-background-default)'

  return (
    <button
      className={`f-quiz-card ${stateClass}`}
      onClick={locked ? undefined : handleClick}
      disabled={locked || loading}
    >
      <div className="f-quiz-card__content">
        <div className="f-quiz-card__icon">
          <ProgressRing
            radius={RING_RADIUS}
            stroke={RING_STROKE}
            progress={done ? 1 : 0}
            trackColor="var(--f-brand-color-background-disabled)"
            color="var(--f-brand-color-background-primary)"
          />
          <div
            className="f-quiz-card__icon-inner"
            style={{
              top: RING_STROKE + 2, left: RING_STROKE + 2,
              width: (RING_RADIUS - RING_STROKE - 2) * 2,
              height: (RING_RADIUS - RING_STROKE - 2) * 2,
              background: innerBg,
            }}
          >
            {locked ? (
              <img src={lockIcon} width={24} height={24} alt="" style={{ opacity: 0.4, filter: 'brightness(0)' }} />
            ) : done ? (
              <img src={tickBlack} width={24} height={24} alt="" />
            ) : (
              <span style={{ fontSize: 'var(--text-2xl)' }}>{emoji}</span>
            )}
          </div>
        </div>

        <div>
          <h3 className="f-quiz-card__title">{title}</h3>
          <p className={`f-quiz-card__progress ${done ? 'f-quiz-card__progress--done' : ''}`}>
            {done ? (
              <>Completed · {result.score}/{result.total} correct</>
            ) : locked ? (
              'Complete your fan card to unlock'
            ) : (
              <>{subtitle}</>
            )}
          </p>
        </div>
      </div>

      {!locked && !done && (
        <div className="f-quiz-card__arrow">
          {loading ? (
            <div className="f-quiz-card__spinner" aria-label="Loading" />
          ) : (
            <img src={chevRight} width={24} height={24} alt="" style={{ opacity: 0.5, filter: 'brightness(0)' }} />
          )}
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

  return (
    <Screen>
      <div
        className="f-card-hub page-in hide-scrollbar"
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
              <h2 className="f-card-hub__section-title">Earn Avios</h2>
              <p className="f-card-hub__section-subtitle">
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
              {SWIPE_QUIZZES.map(sq => (
                <ExtraQuizCard
                  key={sq.id}
                  emoji={sq.emoji}
                  title={sq.title}
                  subtitle={`${sq.statements.length} statements · Swipe`}
                  result={state.quizResults[sq.id]}
                  locked={!cardComplete}
                  onStart={() => handleStartSwipeQuiz(sq.id)}
                />
              ))}
              <ExtraQuizCard
                emoji="🃏"
                title="Card Match"
                subtitle="Match the pairs · Memory Game"
                result={state.quizResults['card-match']}
                locked={!cardComplete}
                onStart={handleStartCardMatch}
              />
            </div>
          </section>
        </div>
    </Screen>
  )
}

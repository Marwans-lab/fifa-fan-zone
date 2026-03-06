import { useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import FanCard from '../components/FanCard'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { renderCardToBlob, buildShareText } from '../lib/cardExport'
import { QUIZZES } from '../data/quizzes'

// ─── Progress card ─────────────────────────────────────────────────────────────
const MILESTONES = [
  { icon: '🪪', label: 'Fan Card',    key: 'card'     },
  { icon: '🎯', label: '1st Quiz',    key: 'quiz1'    },
  { icon: '🔥', label: '3 Quizzes',   key: 'quiz3'    },
  { icon: '🏆', label: 'Champion',    key: 'champion' },
] as const

function statusLabel(done: number): string {
  if (done === 0) return 'New Arrival'
  if (done === 1) return 'Rising Fan'
  if (done === 2) return 'Quiz Taker'
  if (done === 3) return 'Top Fan'
  return 'Quiz Champion'
}

function ProgressCard({
  completedAt,
  quizCount,
  points,
}: {
  completedAt: string | null
  quizCount: number
  points: number
}) {
  const achieved = [
    completedAt !== null,
    quizCount >= 1,
    quizCount >= 3,
    quizCount >= 5,
  ]
  const doneCount = achieved.filter(Boolean).length
  const status = statusLabel(doneCount)

  return (
    <div style={{
      width: '100%',
      padding: 'var(--sp-4) var(--sp-5)',
      background: 'var(--glass-bg)',
      border: '1px solid var(--c-border)',
      borderRadius: 'var(--r-md)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      boxShadow: 'var(--glass-shine)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
        <div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginBottom: 2 }}>
            Your journey
          </div>
          <div style={{ fontSize: 'var(--text-md)', fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-light)', letterSpacing: 'var(--tracking-tight)', color: 'var(--c-text-1)' }}>
            {status}
          </div>
        </div>
        {points > 0 && (
          <div style={{
            fontSize: 'var(--text-xs)', color: 'var(--c-accent)',
            background: 'rgba(0,212,170,0.08)',
            border: '1px solid rgba(0,212,170,0.2)',
            borderRadius: 'var(--r-full)',
            padding: '4px 10px',
            letterSpacing: 'var(--tracking-wide)',
            fontWeight: 'var(--weight-med)',
          }}>
            {points} pts
          </div>
        )}
      </div>

      {/* Milestone track */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {MILESTONES.map((m, i) => {
          const done = achieved[i]
          const isLast = i === MILESTONES.length - 1
          return (
            <div key={m.key} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1 }}>
              {/* Node */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-1)' }}>
                <div style={{
                  width: 32, height: 32,
                  borderRadius: '50%',
                  background: done ? '#ffffff' : 'var(--c-surface-raise)',
                  border: `1.5px solid ${done ? '#ffffff' : 'var(--c-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: done ? 14 : 16,
                  fontWeight: done ? 700 : 400,
                  color: done ? '#000' : 'var(--c-text-3)',
                  transition: 'all var(--dur-base) var(--ease-out)',
                  flexShrink: 0,
                }}>
                  {done ? '✓' : m.icon}
                </div>
                <div style={{ fontSize: 'var(--text-2xs)', color: done ? 'var(--c-text-2)' : 'var(--c-text-3)', letterSpacing: 'var(--tracking-wide)', whiteSpace: 'nowrap' }}>
                  {m.label}
                </div>
              </div>
              {/* Connector */}
              {!isLast && (
                <div style={{
                  flex: 1,
                  height: 2,
                  marginBottom: 20,
                  background: done && achieved[i + 1] ? 'var(--c-accent)' : done ? `linear-gradient(90deg, var(--c-accent), var(--c-border))` : 'var(--c-border)',
                  transition: 'background var(--dur-slow) var(--ease-out)',
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Circular progress ring (SVG) ──────────────────────────────────────────────
function ProgressRing({
  progress,
  size = 72,
  strokeWidth = 3,
  color = 'var(--c-accent)',
  children,
}: {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
  children: React.ReactNode
}) {
  const r = (size - strokeWidth * 2) / 2
  const cx = size / 2
  const circumference = 2 * Math.PI * r

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
      >
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#1e1e1e" strokeWidth={strokeWidth} />
        {progress > 0 && (
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 400ms ease' }}
          />
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: strokeWidth * 2,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'var(--c-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ─── Single quiz card ──────────────────────────────────────────────────────────
type QuizCardState = 'active' | 'done' | 'locked'

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

  const ringColor = 'var(--c-accent)'
  const overlayIcon = done ? '✓' : locked ? '🔒' : null

  return (
    <button
      onClick={locked ? undefined : onStart}
      disabled={locked}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-4)',
        padding: 'var(--sp-4)',
        minHeight: 104,
        width: '100%',
        background: done ? 'rgba(0,212,170,0.05)' : 'var(--glass-bg)',
        border: `1px solid ${done ? 'rgba(0,212,170,0.2)' : 'var(--c-border)'}`,
        borderRadius: 'var(--r-md)',
        cursor: locked ? 'default' : 'pointer',
        opacity: locked ? 0.6 : 1,
        textAlign: 'left',
        fontFamily: 'inherit',
        color: 'var(--c-text-1)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        boxShadow: 'var(--glass-shine)',
        transition: 'opacity var(--dur-base) var(--ease-out)',
      }}
    >
      <ProgressRing progress={progress} color={ringColor}>
        {overlayIcon ? (
          <span style={{ fontSize: done ? 22 : 18 }}>{overlayIcon}</span>
        ) : (
          <span style={{ fontSize: 26 }}>{quiz.emoji}</span>
        )}
      </ProgressRing>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-med)', marginBottom: 5 }}>
          {quiz.title}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: done ? 'var(--c-accent)' : locked ? 'var(--c-text-3)' : 'var(--c-accent)', letterSpacing: 'var(--tracking-wide)' }}>
          {done
            ? `Completed · ${Math.round(progress * quiz.questions.length)}/${quiz.questions.length} correct`
            : locked
            ? 'Complete the previous quiz to unlock'
            : `${quiz.questions.length} questions · ${quiz.questions.length * 15}s`}
        </div>
      </div>

      {!locked && !done && (
        <span style={{ color: 'var(--c-text-2)', fontSize: 18, flexShrink: 0 }}>›</span>
      )}
    </button>
  )
}

// ─── Main Card route ───────────────────────────────────────────────────────────
export default function Card() {
  const navigate    = useNavigate()
  const { state, updateFanCard, resetState } = useStore()
  const quizRef     = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const [saving,  setSaving]  = useState(false)

  function handleSave(answers: Record<string, string>) {
    updateFanCard({ answers, completedAt: new Date().toISOString() })
  }

  const handleShare = useCallback(async () => {
    setSharing(true)
    try {
      const blob = await renderCardToBlob(state.fanCard)
      const file = new File([blob], 'fan-card.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My FIFA Fan Card' })
      } else {
        await window.QAApp.openNativeShare({
          title: 'My FIFA Fan Card',
          text: buildShareText(state.fanCard),
        })
      }
      track('card_shared')
    } catch {
      // user cancelled — not an error
    } finally {
      setSharing(false)
    }
  }, [state.fanCard])

  const handleSaveToDevice = useCallback(async () => {
    setSaving(true)
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
    } finally {
      setSaving(false)
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
        className="page-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--sp-6)',
          padding: 'var(--sp-6) var(--sp-4) var(--sp-8)',
          width: '100%',
          maxWidth: 400,
          margin: '0 auto',
        }}
      >
        {/* ── Fan Card ────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-light)',
            letterSpacing: 'var(--tracking-tight)',
            marginBottom: 'var(--sp-1)',
          }}>
            {state.fanCard.completedAt ? 'Your Fan Card' : state.fanCard.teamId ? 'Card Created!' : 'Your Fan Card'}
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)' }}>
            {state.fanCard.completedAt
              ? 'Tap to flip & view your profile'
              : state.fanCard.teamId
              ? 'Flip to complete your fan profile'
              : 'Tap to flip & complete your profile'}
          </p>
        </div>

        <div style={{ width: '100%' }}>
          <FanCard fanCard={state.fanCard} onSave={handleSave} onShare={handleShare} onSaveToDevice={handleSaveToDevice} />
        </div>

        {/* ── Progress card ─────────────────────────────────────── */}
        <ProgressCard
          completedAt={state.fanCard.completedAt}
          quizCount={Object.keys(state.quizResults).length}
          points={state.points}
        />

        {/* ── Start Quiz CTA (scrolls down) ─────────────────────── */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <Button
            fullWidth
            onClick={() => {
              track('card_start_quiz_tapped')
              quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            Start Quiz
          </Button>
        </div>

        {/* ── Quiz selection ────────────────────────────────────── */}
        <div ref={quizRef} style={{ width: '100%' }}>
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-light)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--sp-1)',
            }}>Earn Avios</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)' }}>
              Complete quizzes to climb the leaderboard
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
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
        </div>
        {/* ── Start fresh ───────────────────────────────────────── */}
        <button
          onClick={() => { resetState(); navigate('/') }}
          style={{
            background: 'none', border: 'none',
            color: 'var(--c-text-3)',
            fontSize: 'var(--text-xs)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: 'var(--tracking-wide)',
            padding: 'var(--sp-2)',
            marginTop: 'var(--sp-2)',
          }}
        >
          Start fresh
        </button>
      </div>
    </Screen>
  )
}


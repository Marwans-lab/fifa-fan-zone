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
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    transition: 'all 700ms ease',
    flexShrink: 0, position: 'relative',
    ...(isCompleted ? {
      background: '#ffffff', border: '1px solid #ffffff',
      boxShadow: '0 0 25px rgba(255,255,255,0.4)',
      transform: 'scale(1.1)', zIndex: 20,
    } : isCurrent ? {
      background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)',
      transform: 'scale(1.05)', zIndex: 20,
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    } : {
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
      zIndex: 10,
    }),
  }

  return (
    <li style={{
      position: 'relative', zIndex: 10,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
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
        fontSize: 12, letterSpacing: '-0.02em', textAlign: 'center',
        whiteSpace: 'nowrap', transition: 'color 500ms ease',
        color: isCompleted || isCurrent ? '#ffffff' : 'rgba(255,255,255,0.3)',
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
}: {
  completedAt: string | null
  quizCount: number
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
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: 32,
        border: '1px solid rgba(255,255,255,0.15)',
        marginBottom: 24,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-med)',
            fontSize: 12, letterSpacing: '0.05em',
            color: 'rgba(255,255,255,0.7)', marginBottom: 4,
          }}>
            Your journey
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-med)',
            fontSize: 18, letterSpacing: '-0.02em', color: '#ffffff',
          }}>
            {status}
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '10px 16px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 9999,
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-reg)',
            fontSize: 12, color: '#ffffff', lineHeight: 1,
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
                {!isLast && (
                  <div style={{
                    flex: 1, height: 2, marginTop: 27,
                    background: done
                      ? 'linear-gradient(90deg, #ffffff, rgba(255,255,255,0.2))'
                      : 'rgba(255,255,255,0.1)',
                  }} />
                )}
              </div>
            )
          })}
        </ol>
      </nav>
    </section>
  )
}

// ─── Quiz card ────────────────────────────────────────────────────────────────
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

  return (
    <button
      onClick={locked ? undefined : onStart}
      disabled={locked}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 10, borderRadius: 20,
        border: `1px solid ${locked ? 'rgba(255,255,255,0.08)' : done ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.1)'}`,
        background: locked ? 'rgba(255,255,255,0.02)' : done ? 'rgba(0,212,170,0.05)' : 'rgba(255,255,255,0.05)',
        opacity: locked ? 0.8 : 1,
        cursor: locked ? 'not-allowed' : 'pointer',
        textAlign: 'left', fontFamily: 'inherit', color: 'var(--c-text-1)',
        transition: 'all 400ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Thumbnail */}
        <div style={{
          width: 96, height: 96, borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
          boxShadow: locked ? 'none' : '0 10px 25px rgba(0,0,0,0.3)',
          transition: 'transform 300ms ease',
          background: locked
            ? 'rgba(255,255,255,0.06)'
            : done
            ? 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,212,170,0.05))'
            : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        }}>
          {locked ? (
            <img src={lockIcon} width={24} height={24} alt="" style={{ opacity: 0.5 }} />
          ) : (
            <span style={{ fontSize: 36 }}>{quiz.emoji}</span>
          )}
        </div>

        {/* Text */}
        <div>
          <h3 style={{
            fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-med)',
            fontSize: 'var(--text-lg)',
            color: locked ? 'rgba(255,255,255,0.7)' : '#ffffff',
          }}>
            {quiz.title}
          </h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
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
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: 8,
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

  const subtitle = state.fanCard.completedAt
    ? 'Tap to flip & view your profile'
    : state.fanCard.teamId
    ? 'Flip to complete your fan profile'
    : 'Tap to flip & complete your profile'

  return (
    <Screen>
      {/* ── Background blobs ─────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }} aria-hidden="true">
        <div
          className="animate-blob-slow"
          style={{ position: 'absolute', top: '5%', left: '-10%', width: 500, height: 500, background: 'rgba(142,33,87,0.3)', borderRadius: '50%', filter: 'blur(120px)' }}
        />
        <div
          className="animate-blob-reverse"
          style={{ position: 'absolute', bottom: '5%', right: '-10%', width: 600, height: 600, background: 'rgba(142,33,87,0.4)', borderRadius: '50%', filter: 'blur(140px)' }}
        />
        <div
          className="animate-blob-float"
          style={{ position: 'absolute', top: '45%', left: '15%', width: 350, height: 350, background: 'rgba(142,33,87,0.2)', borderRadius: '50%', filter: 'blur(100px)' }}
        />
      </div>

      {/* ── Glass container ──────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', minHeight: '100%',
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(45px)', WebkitBackdropFilter: 'blur(45px)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Noise texture overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, opacity: 0.02, pointerEvents: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* ── Content ────────────────────────────────────────── */}
        <div
          className="page-in hide-scrollbar"
          style={{
            flex: 1, position: 'relative', zIndex: 20,
            padding: '48px 24px',
            overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Header */}
          <header style={{ textAlign: 'center', marginBottom: 48 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-thin)',
              fontSize: 28, letterSpacing: '-0.04em', marginBottom: 8,
              color: '#ffffff', lineHeight: 1.1,
            }}>
              FIFA Fan Zone
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-med)',
              fontSize: 12, letterSpacing: '0.05em',
              color: 'rgba(255,255,255,0.7)',
            }}>
              {subtitle}
            </p>
          </header>

          {/* ── Fan Card ──────────────────────────────────────── */}
          <section aria-label="Your Fan Card" style={{ width: '100%', marginBottom: 40 }}>
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
          />

          {/* ── Start Quiz CTA ────────────────────────────────── */}
          <button
            onClick={() => {
              track('card_start_quiz_tapped')
              quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            style={{
              width: '100%', height: 56,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#ffffff', color: '#8E2157',
              fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-bold)',
              fontSize: 16, borderRadius: 9999, border: 'none',
              marginBottom: 56, cursor: 'pointer',
              boxShadow: '0 20px 50px rgba(255,255,255,0.15)',
              transition: 'all 150ms ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Start quiz
          </button>

          {/* ── Quizzes ───────────────────────────────────────── */}
          <section ref={quizRef} style={{ paddingBottom: 48 }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-thin)',
                fontSize: 28, letterSpacing: '-0.04em', color: '#ffffff',
              }}>
                Earn Avios
              </h2>
              <p style={{
                fontFamily: 'var(--font-body)', fontWeight: 'var(--weight-reg)',
                color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4,
              }}>
                Complete quizzes to climb the leaderboard
              </p>
            </div>

            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
      </div>
    </Screen>
  )
}

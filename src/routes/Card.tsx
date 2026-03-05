import { useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import FanCard, { type FanCardHandle } from '../components/FanCard'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { renderCardToBlob, buildShareText } from '../lib/cardExport'
import { QUIZZES } from '../data/quizzes'

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
  progress: number // 0..1
  onStart: () => void
}) {
  const locked = cardState === 'locked'
  const done   = cardState === 'done'

  const overlayIcon = done ? '✓' : locked ? '🔒' : null

  return (
    <button
      onClick={locked ? undefined : onStart}
      disabled={locked}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px',
        // 1.3× height: base ~80px → 104px via padding + min-height
        minHeight: 104,
        width: '100%',
        background: done
          ? 'rgba(0,212,170,0.06)'
          : locked
          ? 'rgba(255,255,255,0.02)'
          : 'var(--color-surface)',
        border: `1px solid ${done ? 'rgba(0,212,170,0.25)' : locked ? '#1e1e1e' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-md)',
        cursor: locked ? 'default' : 'pointer',
        opacity: locked ? 0.45 : 1,
        textAlign: 'left',
        fontFamily: 'inherit',
        color: 'var(--color-text-primary)',
        transition: 'opacity 200ms ease, border-color 200ms ease',
      }}
    >
      {/* Square image container */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 8,
          background: done
            ? 'rgba(0,212,170,0.12)'
            : locked
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(200,16,46,0.10)',
          border: `2px solid ${done ? '#00d4aa' : locked ? '#2a2a2a' : '#c8102e'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {overlayIcon ? (
          <span style={{ fontSize: done ? 22 : 18 }}>{overlayIcon}</span>
        ) : (
          <span style={{ fontSize: 28 }}>{quiz.emoji}</span>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>
          {quiz.title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: 5,
          }}
        >
          {quiz.description}
        </div>
        <div style={{ fontSize: 11, color: done ? '#00d4aa' : locked ? '#444' : 'var(--color-accent)' }}>
          {done
            ? `Completed · ${Math.round(progress * quiz.questions.length)}/${quiz.questions.length} correct`
            : locked
            ? 'Complete the previous quiz to unlock'
            : `${quiz.questions.length} questions · ${quiz.questions.length * 15}s`}
        </div>
      </div>

      {!locked && !done && (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 18, flexShrink: 0 }}>›</span>
      )}
    </button>
  )
}

// ─── Main Card route ───────────────────────────────────────────────────────────
export default function Card() {
  const navigate    = useNavigate()
  const { state, updateFanCard } = useStore()
  const cardRef     = useRef<FanCardHandle>(null)
  const quizRef     = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const [saving,  setSaving]  = useState(false)

  function handleSave(answers: Record<string, string>) {
    updateFanCard({ answers, completedAt: new Date().toISOString() })
  }

  const handleEdit = useCallback(() => {
    cardRef.current?.startEditing()
  }, [])

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

  // Unlock logic: quiz i is unlocked when quiz i-1 is done
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
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-6)',
          padding: 'var(--space-6) var(--space-4) var(--space-8)',
          width: '100%',
          maxWidth: 400,
          margin: '0 auto',
        }}
      >
        {/* ── Fan Card ────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-1)' }}>
            Your Fan Card
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Tap to flip &amp; complete your profile
          </p>
        </div>

        <FanCard ref={cardRef} fanCard={state.fanCard} onSave={handleSave} />

        {/* ── Edit / Share / Save actions ──────────────────────── */}
        <div style={{ display: 'flex', gap: 'var(--space-5)', justifyContent: 'center' }}>
          <ActionBtn icon="✏" label="Edit"  onClick={handleEdit} />
          <ActionBtn icon="⤴" label="Share" onClick={handleShare} loading={sharing} />
          <ActionBtn icon="⬇" label="Save"  onClick={handleSaveToDevice} loading={saving} />
        </div>

        {/* ── Start Quiz CTA (scrolls down) ─────────────────────── */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Button
            fullWidth
            onClick={() => {
              track('card_start_quiz_tapped')
              quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            Start Quiz
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => { track('card_back_tapped'); navigate(-1) }}
          >
            Back
          </Button>
        </div>

        {/* ── Quiz selection ────────────────────────────────────── */}
        <div ref={quizRef} style={{ width: '100%' }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Earn Avios</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Complete quizzes to climb the leaderboard
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
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
      </div>
    </Screen>
  )
}

// ─── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({
  icon, label, onClick, loading,
}: {
  icon: string
  label: string
  onClick: () => void
  loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        background: 'none',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 20px',
        cursor: loading ? 'default' : 'pointer',
        opacity: loading ? 0.5 : 1,
        color: 'var(--color-text-primary)',
        fontFamily: 'inherit',
        transition: 'opacity var(--transition-fast)',
      }}
    >
      <span style={{ fontSize: 20 }}>{loading ? '…' : icon}</span>
      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{label}</span>
    </button>
  )
}

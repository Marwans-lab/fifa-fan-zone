import { useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import FanCard, { type FanCardHandle } from '../components/FanCard'
import { track } from '../lib/analytics'
import { useStore, type AppState } from '../store/useStore'
import { renderCardToBlob, buildShareText } from '../lib/cardExport'

// ─── Progress card ─────────────────────────────────────────────────────────────
const MILESTONES = [
  { id: 'card',     label: 'Fan Card',    emoji: '🪪', check: (s: AppState) => s.fanCard.completedAt !== null },
  { id: 'quiz1',    label: '1st Quiz',    emoji: '🎯', check: (s: AppState) => Object.keys(s.quizResults).length >= 1 },
  { id: 'quiz3',    label: '3 Quizzes',   emoji: '🔥', check: (s: AppState) => Object.keys(s.quizResults).length >= 3 },
  { id: 'champion', label: 'Champion',    emoji: '🏆', check: (s: AppState) => Object.keys(s.quizResults).length >= 5 },
]

const STATUS_LEVELS = [
  { label: 'New Arrival',    emoji: '👋', minMilestones: 0 },
  { label: 'Rising Fan',     emoji: '⚡', minMilestones: 1 },
  { label: 'Quiz Taker',     emoji: '🎯', minMilestones: 2 },
  { label: 'Top Fan',        emoji: '🔥', minMilestones: 3 },
  { label: 'Quiz Champion',  emoji: '🏆', minMilestones: 4 },
]

function ProgressCard({ state }: { state: AppState }) {
  const done = MILESTONES.filter(m => m.check(state))
  const doneCount = done.length
  const status = [...STATUS_LEVELS].reverse().find(s => doneCount >= s.minMilestones)!
  const totalPoints = Object.values(state.quizResults).reduce((sum, r) => sum + r.score * 10, 0)

  return (
    <div
      style={{
        width: '100%',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
            Your Journey
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {status.emoji} {status.label}
          </div>
        </div>
        {totalPoints > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#c8102e' }}>{totalPoints}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>pts earned</div>
          </div>
        )}
      </div>

      {/* Milestone track */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {MILESTONES.map((m, i) => {
          const achieved = m.check(state)
          const isLast = i === MILESTONES.length - 1
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 'none' : 1, minWidth: 0 }}>
              {/* Node */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: achieved ? '#c8102e' : 'transparent',
                    border: `2px solid ${achieved ? '#c8102e' : '#333'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    transition: 'background 300ms ease, border-color 300ms ease',
                  }}
                >
                  {achieved ? m.emoji : <span style={{ fontSize: 10, color: '#555' }}>○</span>}
                </div>
                <span style={{ fontSize: 9, color: achieved ? 'var(--color-text-primary)' : '#444', whiteSpace: 'nowrap' }}>
                  {m.label}
                </span>
              </div>
              {/* Connector line */}
              {!isLast && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    marginBottom: 16,
                    background: MILESTONES[i + 1].check(state) || achieved ? '#c8102e' : '#222',
                    transition: 'background 300ms ease',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Card() {
  const navigate = useNavigate()
  const { state, updateFanCard } = useStore()
  const cardRef = useRef<FanCardHandle>(null)
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

  return (
    <Screen centered>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-6)',
          padding: 'var(--space-6) var(--space-4)',
          width: '100%',
          maxWidth: 400,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-1)' }}>
            Your Fan Card
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Tap to flip &amp; complete your profile
          </p>
        </div>

        <FanCard ref={cardRef} fanCard={state.fanCard} onSave={handleSave} />

        {/* ── Progress card ─────────────────────────────────────── */}
        <ProgressCard state={state} />

        {/* ── Edit / Share / Save actions ──────────────────────── */}
        <div style={{ display: 'flex', gap: 'var(--space-5)', justifyContent: 'center' }}>
          <ActionBtn icon="✏" label="Edit"  onClick={handleEdit} />
          <ActionBtn icon="⤴" label="Share" onClick={handleShare} loading={sharing} />
          <ActionBtn icon="⬇" label="Save"  onClick={handleSaveToDevice} loading={saving} />
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Button
            fullWidth
            onClick={() => { track('card_to_quiz_tapped'); navigate('/quiz') }}
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

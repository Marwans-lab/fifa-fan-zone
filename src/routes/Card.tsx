import { useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import FanCard, { type FanCardHandle } from '../components/FanCard'
import { track } from '../lib/analytics'
import { useStore, type AppState } from '../store/useStore'
import { renderCardToBlob, buildShareText } from '../lib/cardExport'
import { QUIZZES } from '../data/quizzes'

// ─── Progress card ─────────────────────────────────────────────────────────────
const MILESTONES = [
  { id: 'card',     label: 'Fan Card',  emoji: '🪪', check: (s: AppState) => s.fanCard.completedAt !== null },
  { id: 'quiz1',    label: '1st Quiz',  emoji: '🎯', check: (s: AppState) => Object.keys(s.quizResults).length >= 1 },
  { id: 'quiz3',    label: '3 Quizzes', emoji: '🔥', check: (s: AppState) => Object.keys(s.quizResults).length >= 3 },
  { id: 'champion', label: 'Champion',  emoji: '🏆', check: (s: AppState) => Object.keys(s.quizResults).length >= 5 },
]

const STATUS_LEVELS = [
  { label: 'New Arrival',   emoji: '👋', min: 0 },
  { label: 'Rising Fan',    emoji: '⚡', min: 1 },
  { label: 'Quiz Taker',    emoji: '🎯', min: 2 },
  { label: 'Top Fan',       emoji: '🔥', min: 3 },
  { label: 'Quiz Champion', emoji: '🏆', min: 4 },
]

function ProgressCard({ state }: { state: AppState }) {
  const doneCount = MILESTONES.filter(m => m.check(state)).length
  const status = [...STATUS_LEVELS].reverse().find(s => doneCount >= s.min)!
  const totalPoints = Object.values(state.quizResults).reduce((sum, r) => sum + r.score * 10, 0)

  return (
    <div style={{ width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Your Journey</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{status.emoji} {status.label}</div>
        </div>
        {totalPoints > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#c8102e' }}>{totalPoints}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>pts earned</div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {MILESTONES.map((m, i) => {
          const achieved = m.check(state)
          const nextAchieved = i < MILESTONES.length - 1 && MILESTONES[i + 1].check(state)
          const isLast = i === MILESTONES.length - 1
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 'none' : 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: achieved ? '#fff' : 'transparent', border: '2px solid ' + (achieved ? '#fff' : '#333'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'background 300ms ease, border-color 300ms ease' }}>
                  {achieved ? <span style={{ fontSize: 14, fontWeight: 700, color: '#000' }}>✓</span> : <span style={{ fontSize: 10, color: '#555' }}>○</span>}
                </div>
                <span style={{ fontSize: 9, color: achieved ? 'var(--color-text-primary)' : '#444', whiteSpace: 'nowrap' }}>{m.label}</span>
              </div>
              {!isLast && <div style={{ flex: 1, height: 2, marginBottom: 16, background: nextAchieved ? '#c8102e' : '#222', transition: 'background 300ms ease' }} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Quiz card ─────────────────────────────────────────────────────────────────
type QuizCardState = 'active' | 'done' | 'locked'

function QuizCard({ quiz, cardState, progress, onStart }: {
  quiz: (typeof QUIZZES)[number]; cardState: QuizCardState; progress: number; onStart: () => void
}) {
  const locked = cardState === 'locked'
  const done   = cardState === 'done'
  const overlayIcon = done ? '✓' : locked ? '🔒' : null

  return (
    <button
      onClick={locked ? undefined : onStart}
      disabled={locked}
      style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: 16, minHeight: 125, width: '100%',
        background: done ? 'rgba(0,212,170,0.06)' : locked ? 'rgba(255,255,255,0.02)' : 'var(--color-surface)',
        border: '1px solid ' + (done ? 'rgba(0,212,170,0.25)' : locked ? '#1e1e1e' : 'var(--color-border)'),
        borderRadius: 'var(--radius-md)', cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.45 : 1,
        textAlign: 'left', fontFamily: 'inherit', color: 'var(--color-text-primary)',
        transition: 'opacity 200ms ease, border-color 200ms ease',
      }}
    >
      <div style={{ width: 64, height: 64, borderRadius: 8, flexShrink: 0, background: done ? 'rgba(0,212,170,0.12)' : locked ? 'rgba(255,255,255,0.03)' : 'rgba(200,16,46,0.10)', border: '2px solid ' + (done ? '#00d4aa' : locked ? '#2a2a2a' : '#c8102e'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {overlayIcon ? <span style={{ fontSize: done ? 22 : 18 }}>{overlayIcon}</span> : <span style={{ fontSize: 28 }}>{quiz.emoji}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{quiz.title}</div>
        <div style={{ fontSize: 11, color: done ? '#00d4aa' : locked ? '#444' : 'var(--color-accent)' }}>
          {done ? 'Completed · ' + Math.round(progress * quiz.questions.length) + '/' + quiz.questions.length + ' correct' : locked ? 'Complete the previous quiz to unlock' : quiz.questions.length + ' questions · ' + quiz.questions.length * 15 + 's'}
        </div>
      </div>
      {!locked && !done && <span style={{ color: 'var(--color-text-secondary)', fontSize: 18, flexShrink: 0 }}>›</span>}
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

  const handleEdit = useCallback(() => { cardRef.current?.startEditing() }, [])

  const handleShare = useCallback(async () => {
    setSharing(true)
    try {
      const blob = await renderCardToBlob(state.fanCard)
      const file = new File([blob], 'fan-card.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My FIFA Fan Card' })
      } else {
        await window.QAApp.openNativeShare({ title: 'My FIFA Fan Card', text: buildShareText(state.fanCard) })
      }
      track('card_shared')
    } catch { /* user cancelled */ } finally { setSharing(false) }
  }, [state.fanCard])

  const handleSaveToDevice = useCallback(async () => {
    setSaving(true)
    try {
      const blob = await renderCardToBlob(state.fanCard)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = 'my-fan-card.png'
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      track('card_saved_to_device')
    } finally { setSaving(false) }
  }, [state.fanCard])

  function getCardState(i: number): QuizCardState {
    const id = QUIZZES[i].id
    if (state.quizResults[id]) return 'done'
    if (i === 0) return 'active'
    return state.quizResults[QUIZZES[i - 1].id] ? 'active' : 'locked'
  }

  function getProgress(i: number) {
    const r = state.quizResults[QUIZZES[i].id]
    return r ? r.score / r.total : 0
  }

  return (
    <Screen>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)', padding: 'var(--space-6) var(--space-4) var(--space-8)', width: '100%', maxWidth: 400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-1)' }}>Your Fan Card</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Tap to flip &amp; complete your profile</p>
        </div>

        <FanCard ref={cardRef} fanCard={state.fanCard} onSave={handleSave} />

        <div style={{ display: 'flex', gap: 'var(--space-5)', justifyContent: 'center' }}>
          <ActionBtn icon="✏" label="Edit"  onClick={handleEdit} />
          <ActionBtn icon="⤴" label="Share" onClick={handleShare} loading={sharing} />
          <ActionBtn icon="⬇" label="Save"  onClick={handleSaveToDevice} loading={saving} />
        </div>

        <ProgressCard state={state} />

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Button fullWidth onClick={() => { track('card_start_quiz_tapped'); quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
            Start Quiz
          </Button>
          <Button variant="ghost" fullWidth onClick={() => { track('card_back_tapped'); navigate(-1) }}>
            Back
          </Button>
        </div>

        <div ref={quizRef} style={{ width: '100%' }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Earn Avios</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Complete quizzes to climb the leaderboard</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {QUIZZES.map((quiz, i) => (
              <QuizCard key={quiz.id} quiz={quiz} cardState={getCardState(i)} progress={getProgress(i)} onStart={() => { track('quiz_card_tapped', { quizId: quiz.id }); navigate('/quiz', { state: { quizId: quiz.id } }) }} />
            ))}
          </div>
        </div>
      </div>
    </Screen>
  )
}

// ─── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, onClick, loading }: { icon: string; label: string; onClick: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 20px', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.5 : 1, color: 'var(--color-text-primary)', fontFamily: 'inherit', transition: 'opacity var(--transition-fast)' }}>
      <span style={{ fontSize: 20 }}>{loading ? '…' : icon}</span>
      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{label}</span>
    </button>
  )
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { QUIZZES, type Quiz, type QuizQuestion } from '../data/quizzes'

const QUESTION_TIME = 15

// ─── Deterministic mock percentages (stable across re-renders) ──────────────────
function getMockPercentages(question: QuizQuestion, chosenId: string | null): Record<string, number> {
  const seed = question.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const opts = question.options
  const weights = opts.map((o, i) => {
    const base = ((seed * (i + 7)) % 40) + 10
    return o.id === question.correctId ? base + 30 : base
  })
  const total = weights.reduce((a, b) => a + b, 0)
  const pcts  = weights.map(w => Math.floor((w / total) * 100))
  const diff  = 100 - pcts.reduce((a, b) => a + b, 0)
  pcts[pcts.length - 1] += diff
  return Object.fromEntries(opts.map((o, i) => [o.id, pcts[i]]))
}

// ─── Option button with letter badge + percentage ──────────────────────────────
function OptionButton({
  opt, chosenId, correctId, revealed, percentages, onSelect,
}: {
  opt: { id: string; label: string }
  chosenId: string | null
  correctId: string
  revealed: boolean
  percentages: Record<string, number> | null
  onSelect: (id: string) => void
}) {
  const LETTERS = ['A', 'B', 'C', 'D']
  const idx     = ['a', 'b', 'c', 'd'].indexOf(opt.id)
  const letter  = LETTERS[idx] ?? opt.id.toUpperCase()

  const isCorrect  = opt.id === correctId
  const isChosen   = chosenId === opt.id
  const isWrong    = revealed && isChosen && !isCorrect

  let borderColor = '#3a3a3a'
  let bgColor     = '#1e1e1e'
  let textColor   = '#fff'
  let badgeBg     = '#2a2a2a'
  let badgeColor  = '#888'

  if (!revealed && isChosen) {
    borderColor = 'var(--color-accent)'; bgColor = 'rgba(0,212,170,0.12)'
    badgeBg = 'var(--color-accent)'; badgeColor = '#000'
  } else if (revealed && isCorrect) {
    borderColor = '#00d4aa'; bgColor = 'rgba(0,212,170,0.12)'
    textColor = '#00d4aa'; badgeBg = '#00d4aa'; badgeColor = '#000'
  } else if (isWrong) {
    borderColor = '#ff4d4d'; bgColor = 'rgba(255,77,77,0.12)'
    textColor = '#ff4d4d'; badgeBg = '#ff4d4d'; badgeColor = '#fff'
  } else if (revealed) {
    textColor = '#555'; borderColor = '#222'; bgColor = '#141414'
    badgeBg = '#222'; badgeColor = '#444'
  }

  const pct = percentages?.[opt.id]

  return (
    <button
      onClick={() => onSelect(opt.id)}
      disabled={revealed}
      style={{
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '0 16px', height: 58, width: '100%',
        background: bgColor, border: '1.5px solid ' + borderColor,
        borderRadius: 14, cursor: revealed ? 'default' : 'pointer',
        fontFamily: 'inherit', color: textColor, textAlign: 'left',
        transition: 'all 150ms ease',
      }}
    >
      {/* Percentage fill bar */}
      {revealed && pct !== undefined && (
        <div style={{ position: 'absolute', inset: 0, width: pct + '%', background: isCorrect ? 'rgba(0,212,170,0.08)' : isWrong ? 'rgba(255,77,77,0.08)' : 'rgba(255,255,255,0.04)', transition: 'width 500ms ease', pointerEvents: 'none' }} />
      )}

      {/* Letter badge */}
      <div style={{ width: 28, height: 28, borderRadius: 8, background: badgeBg, color: badgeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, zIndex: 1, transition: 'all 150ms ease' }}>
        {revealed && isCorrect ? '✓' : revealed && isWrong ? '✗' : letter}
      </div>

      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, zIndex: 1 }}>{opt.label}</span>

      {/* Percentage label */}
      {revealed && pct !== undefined && (
        <span style={{ fontSize: 12, fontWeight: 600, color: isCorrect ? '#00d4aa' : isWrong ? '#ff4d4d' : '#555', zIndex: 1, flexShrink: 0 }}>{pct}%</span>
      )}
    </button>
  )
}

// ─── Question screen ───────────────────────────────────────────────────────────
interface QuestionScreenProps {
  quiz: Quiz; question: QuizQuestion; qIndex: number; total: number; score: number
  chosenId: string | null; revealed: boolean; timeLeft: number
  onSelect: (id: string) => void; onNext: () => void; onBack: () => void
}

function QuestionScreen({ quiz, question, qIndex, total, score, chosenId, revealed, timeLeft, onSelect, onNext, onBack }: QuestionScreenProps) {
  const isLast      = qIndex === total - 1
  const timerPct    = (timeLeft / QUESTION_TIME) * 100
  const timerColor  = timeLeft > 5 ? 'var(--color-accent)' : '#ffb800'
  const percentages = revealed ? getMockPercentages(question, chosenId) : null

  // Slide animation
  const [slideStyle, setSlideStyle] = useState<React.CSSProperties>({})
  const animating = useRef(false)

  // Enter animation on qIndex change
  useEffect(() => {
    setSlideStyle({ transform: 'translateX(60px)', opacity: 0, transition: 'none' })
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSlideStyle({ transform: 'translateX(0)', opacity: 1, transition: 'transform 280ms cubic-bezier(0.4,0,0.2,1), opacity 280ms ease' })
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [qIndex])

  function handleNext() {
    if (animating.current) return
    animating.current = true
    setSlideStyle({ transform: 'translateX(-60px)', opacity: 0, transition: 'transform 220ms cubic-bezier(0.4,0,0.2,1), opacity 220ms ease' })
    setTimeout(() => { animating.current = false; onNext() }, 230)
  }

  return (
    <Screen>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', maxWidth: 420, margin: '0 auto', width: '100%' }}>
        {/* Top bar — fixed, no animation */}
        <div style={{ padding: 'var(--space-4) var(--space-4) 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 10 }}>
            <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'none', color: '#fff', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>‹</button>
            <div style={{ flex: 1, height: 4, background: '#2a2a2a', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: ((qIndex + (revealed ? 1 : 0)) / total) * 100 + '%', background: 'var(--color-accent)', borderRadius: 2, transition: 'width 300ms ease' }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{qIndex + 1}/{total}</span>
          </div>
          <div style={{ height: 2, background: '#2a2a2a', borderRadius: 1, overflow: 'hidden', marginBottom: 'var(--space-4)' }}>
            <div style={{ height: '100%', width: timerPct + '%', background: timerColor, borderRadius: 1, transition: 'width 1s linear, background 1s ease' }} />
          </div>
        </div>

        {/* Animated content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...slideStyle }}>
          {/* Header */}
          <div style={{ margin: '0 var(--space-4)', height: 180, borderRadius: 'var(--radius-md)', background: question.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, marginBottom: 'var(--space-5)', boxShadow: '0 8px 32px ' + question.accentColor + '66' }}>
            {quiz.emoji}
          </div>

          {/* Question text */}
          <div style={{ padding: '0 var(--space-6)', fontSize: 20, fontWeight: 600, color: '#fff', lineHeight: 1.35, textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            {question.question}
          </div>

          {/* Options */}
          <div style={{ padding: '0 var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: 1 }}>
            {question.options.map(opt => (
              <OptionButton key={opt.id} opt={opt} chosenId={chosenId} correctId={question.correctId} revealed={revealed} percentages={percentages} onSelect={onSelect} />
            ))}
          </div>

          {/* Score + Next */}
          <div style={{ padding: 'var(--space-5) var(--space-4) var(--space-8)' }}>
            {revealed && (
              <div style={{ textAlign: 'center', fontSize: 13, color: chosenId === question.correctId ? 'var(--color-accent)' : '#ff4d4d', marginBottom: 'var(--space-3)', fontWeight: 600 }}>
                {chosenId === question.correctId ? '✓ Correct! +1 point' : chosenId ? '✗ Incorrect' : "⏱ Time's up!"}
              </div>
            )}
            <button
              onClick={handleNext}
              disabled={!revealed}
              style={{ width: '100%', padding: '16px 0', borderRadius: 50, border: 'none', background: revealed ? '#ffffff' : '#2a2a2a', color: revealed ? '#c8102e' : '#555', fontSize: 15, fontWeight: 700, cursor: revealed ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all 200ms ease' }}
            >
              {isLast && revealed ? 'Finish · ' + score + '/' + total : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </Screen>
  )
}

// ─── Main quiz route ───────────────────────────────────────────────────────────
export default function QuizRoute() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { addPoints, recordQuizResult } = useStore()

  // Find quiz from navigation state
  const quizId   = (location.state as { quizId?: string } | null)?.quizId
  const quizIdx  = quizId ? QUIZZES.findIndex(q => q.id === quizId) : 0
  const quiz     = QUIZZES[Math.max(0, quizIdx)]

  const [qIdx,      setQIdx]      = useState(0)
  const [score,     setScore]     = useState(0)
  const [chosenId,  setChosenId]  = useState<string | null>(null)
  const [revealed,  setRevealed]  = useState(false)
  const [timeLeft,  setTimeLeft]  = useState(QUESTION_TIME)

  const question = quiz.questions[qIdx]
  const total    = quiz.questions.length
  const isLast   = qIdx === total - 1

  // Timer
  useEffect(() => {
    if (revealed) return
    if (timeLeft <= 0) { setRevealed(true); track('quiz_question_timeout', { quizId: quiz.id, qIdx }); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [revealed, timeLeft, quiz.id, qIdx])

  const handleSelect = useCallback((id: string) => {
    if (revealed) return
    setChosenId(id)
    setRevealed(true)
    const correct = id === question.correctId
    if (correct) setScore(s => s + 1)
    track('quiz_answer', { quizId: quiz.id, qIdx, correct })
  }, [revealed, question.correctId, quiz.id, qIdx])

  const handleNext = useCallback(() => {
    if (isLast) {
      setScore(finalScore => {
        addPoints(finalScore)
        recordQuizResult(quiz.id, finalScore, total)
        track('quiz_completed', { quizId: quiz.id, score: finalScore, total })
        navigate('/results', { state: { score: finalScore, total, quizTitle: quiz.title } })
        return finalScore
      })
    } else {
      setQIdx(i => i + 1)
      setChosenId(null)
      setRevealed(false)
      setTimeLeft(QUESTION_TIME)
    }
  }, [isLast, quiz, total, addPoints, recordQuizResult, navigate])

  const handleBack = useCallback(() => {
    track('quiz_abandoned', { quizId: quiz.id, qIdx })
    navigate(-1)
  }, [quiz.id, qIdx, navigate])

  return (
    <QuestionScreen
      quiz={quiz} question={question} qIndex={qIdx} total={total} score={score}
      chosenId={chosenId} revealed={revealed} timeLeft={timeLeft}
      onSelect={handleSelect} onNext={handleNext} onBack={handleBack}
    />
  )
}

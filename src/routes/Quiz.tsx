import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { QUIZZES, type Quiz, type QuizQuestion } from '../data/quizzes'

const QUESTION_TIME = 15 // seconds

// ─── Option state colours ──────────────────────────────────────────────────────
function optionStyle(
  optId: string,
  chosenId: string | null,
  correctId: string,
  revealed: boolean
): React.CSSProperties {
  if (!revealed) {
    const selected = chosenId === optId
    return {
      padding: '14px 20px',
      borderRadius: 50,
      border: `1px solid ${selected ? 'var(--color-accent)' : '#3a3a3a'}`,
      background: selected ? 'rgba(0,212,170,0.15)' : '#1e1e1e',
      color: '#fff',
      fontSize: 15,
      cursor: 'pointer',
      fontFamily: 'inherit',
      textAlign: 'center',
      transition: 'all 150ms ease',
      width: '100%',
    }
  }
  if (optId === correctId) {
    return {
      padding: '14px 20px',
      borderRadius: 50,
      border: '1px solid #00d4aa',
      background: 'rgba(0,212,170,0.25)',
      color: '#00d4aa',
      fontSize: 15,
      cursor: 'default',
      fontFamily: 'inherit',
      textAlign: 'center',
      width: '100%',
      fontWeight: 700,
    }
  }
  if (optId === chosenId && chosenId !== correctId) {
    return {
      padding: '14px 20px',
      borderRadius: 50,
      border: '1px solid #ff4d4d',
      background: 'rgba(255,77,77,0.2)',
      color: '#ff4d4d',
      fontSize: 15,
      cursor: 'default',
      fontFamily: 'inherit',
      textAlign: 'center',
      width: '100%',
    }
  }
  return {
    padding: '14px 20px',
    borderRadius: 50,
    border: '1px solid #2a2a2a',
    background: '#141414',
    color: '#555',
    fontSize: 15,
    cursor: 'default',
    fontFamily: 'inherit',
    textAlign: 'center',
    width: '100%',
  }
}

// ─── Selection screen ──────────────────────────────────────────────────────────
function SelectionScreen({ onStart }: { onStart: (idx: number) => void }) {
  const navigate = useNavigate()

  return (
    <Screen>
      <div
        style={{
          padding: 'var(--space-6) var(--space-4)',
          maxWidth: 420,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-1)' }}>
            Earn Avios
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Pick a quiz and test your football knowledge
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {QUIZZES.map((quiz, i) => (
            <button
              key={quiz.id}
              onClick={() => onStart(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-4)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                color: 'var(--color-text-primary)',
                transition: 'border-color var(--transition-fast)',
              }}
            >
              {/* Emoji thumbnail */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 'var(--radius-md)',
                  background: quiz.questions[0].accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  flexShrink: 0,
                }}
              >
                {quiz.emoji}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
                  {quiz.title}
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {quiz.description}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--color-accent)',
                    marginTop: 4,
                  }}
                >
                  {quiz.questions.length} questions · {quiz.questions.length * QUESTION_TIME}s
                </div>
              </div>

              <span style={{ color: 'var(--color-text-secondary)', fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: 'var(--space-6)',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            width: '100%',
            textAlign: 'center',
            padding: 'var(--space-3)',
          }}
        >
          ← Back
        </button>
      </div>
    </Screen>
  )
}

// ─── Question screen ───────────────────────────────────────────────────────────
interface QuestionScreenProps {
  quiz: Quiz
  question: QuizQuestion
  qIndex: number
  total: number
  score: number
  chosenId: string | null
  revealed: boolean
  timeLeft: number
  onSelect: (id: string) => void
  onNext: () => void
  onBack: () => void
}

function QuestionScreen({
  quiz, question, qIndex, total, score,
  chosenId, revealed, timeLeft,
  onSelect, onNext, onBack,
}: QuestionScreenProps) {
  const isLast = qIndex === total - 1
  const timerPct = (timeLeft / QUESTION_TIME) * 100
  const timerColor = timeLeft > 5 ? 'var(--color-accent)' : '#ffb800'

  return (
    <Screen>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          maxWidth: 420,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* ── Top bar ──────────────────────────────────────────── */}
        <div style={{ padding: 'var(--space-4) var(--space-4) 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 10 }}>
            {/* Back button */}
            <button
              onClick={onBack}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '1px solid var(--color-border)',
                background: 'none', color: '#fff',
                cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}
            >
              ‹
            </button>

            {/* Progress bar */}
            <div style={{ flex: 1, height: 4, background: '#2a2a2a', borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${((qIndex + (revealed ? 1 : 0)) / total) * 100}%`,
                  background: 'var(--color-accent)',
                  borderRadius: 2,
                  transition: 'width 300ms ease',
                }}
              />
            </div>

            {/* Question count */}
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
              {qIndex + 1}/{total}
            </span>
          </div>

          {/* Timer bar */}
          <div style={{ height: 2, background: '#2a2a2a', borderRadius: 1, overflow: 'hidden', marginBottom: 'var(--space-4)' }}>
            <div
              style={{
                height: '100%',
                width: `${timerPct}%`,
                background: timerColor,
                borderRadius: 1,
                transition: 'width 1s linear, background 1s ease',
              }}
            />
          </div>
        </div>

        {/* ── Question header (colour block) ───────────────────── */}
        <div
          style={{
            margin: '0 var(--space-4)',
            height: 140,
            borderRadius: 'var(--radius-md)',
            background: question.accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 56,
            marginBottom: 'var(--space-5)',
          }}
        >
          {quiz.emoji}
        </div>

        {/* ── Question text ────────────────────────────────────── */}
        <div
          style={{
            padding: '0 var(--space-6)',
            fontSize: 20,
            fontWeight: 600,
            color: '#fff',
            lineHeight: 1.35,
            textAlign: 'center',
            marginBottom: 'var(--space-6)',
            flex: 0,
          }}
        >
          {question.question}
        </div>

        {/* ── Options ──────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            padding: '0 var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          {question.options.map(opt => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              disabled={revealed}
              style={optionStyle(opt.id, chosenId, question.correctId, revealed)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ── Score + Next ─────────────────────────────────────── */}
        <div style={{ padding: 'var(--space-5) var(--space-4) var(--space-8)' }}>
          {revealed && (
            <div
              style={{
                textAlign: 'center',
                fontSize: 13,
                color: chosenId === question.correctId ? 'var(--color-accent)' : '#ff4d4d',
                marginBottom: 'var(--space-3)',
                fontWeight: 600,
              }}
            >
              {chosenId === question.correctId
                ? '✓ Correct! +1 point'
                : chosenId
                ? '✗ Incorrect'
                : '⏱ Time\'s up!'}
            </div>
          )}

          <button
            onClick={onNext}
            disabled={!revealed}
            style={{
              width: '100%',
              padding: '16px 0',
              borderRadius: 50,
              border: 'none',
              background: revealed ? '#ffffff' : '#2a2a2a',
              color: revealed ? '#c8102e' : '#555',
              fontSize: 15,
              fontWeight: 700,
              cursor: revealed ? 'pointer' : 'default',
              fontFamily: 'inherit',
              transition: 'all 200ms ease',
            }}
          >
            {isLast && revealed ? `Finish · ${score}/${total}` : 'Next'}
          </button>
        </div>
      </div>
    </Screen>
  )
}

// ─── Main quiz route ───────────────────────────────────────────────────────────
export default function QuizRoute() {
  const navigate = useNavigate()
  const { addPoints } = useStore()

  const [phase, setPhase]       = useState<'selection' | 'playing'>('selection')
  const [quizIdx, setQuizIdx]   = useState(0)
  const [qIdx, setQIdx]         = useState(0)
  const [score, setScore]       = useState(0)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)

  const quiz     = QUIZZES[quizIdx]
  const question = quiz?.questions[qIdx]
  const total    = quiz?.questions.length ?? 0
  const isLast   = qIdx === total - 1

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || revealed) return
    if (timeLeft <= 0) {
      setRevealed(true)
      track('quiz_question_timeout', { quizId: quiz.id, qIdx })
      return
    }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, revealed, timeLeft, quiz?.id, qIdx])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const startQuiz = useCallback((idx: number) => {
    setQuizIdx(idx)
    setQIdx(0)
    setScore(0)
    setChosenId(null)
    setRevealed(false)
    setTimeLeft(QUESTION_TIME)
    setPhase('playing')
    track('quiz_started', { quizId: QUIZZES[idx].id })
  }, [])

  const handleSelect = useCallback((id: string) => {
    if (revealed) return
    setChosenId(id)
    setRevealed(true)
    const correct = id === question.correctId
    if (correct) setScore(s => s + 1)
    track('quiz_answer', { quizId: quiz.id, qIdx, correct })
  }, [revealed, question?.correctId, quiz?.id, qIdx])

  const handleNext = useCallback(() => {
    if (isLast) {
      // Use functional updater to get latest score after the last answer
      setScore(finalScore => {
        addPoints(finalScore)
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
  }, [isLast, quiz, total, addPoints, navigate])

  const handleBack = useCallback(() => {
    setPhase('selection')
    track('quiz_abandoned', { quizId: quiz?.id, qIdx })
  }, [quiz?.id, qIdx])

  // ── Render ─────────────────────────────────────────────────────────────────
  if (phase === 'selection') {
    return <SelectionScreen onStart={startQuiz} />
  }

  return (
    <QuestionScreen
      quiz={quiz}
      question={question}
      qIndex={qIdx}
      total={total}
      score={score}
      chosenId={chosenId}
      revealed={revealed}
      timeLeft={timeLeft}
      onSelect={handleSelect}
      onNext={handleNext}
      onBack={handleBack}
    />
  )
}

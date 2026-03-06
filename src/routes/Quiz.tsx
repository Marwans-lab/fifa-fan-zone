import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { QUIZZES, type Quiz, type QuizQuestion } from '../data/quizzes'
import chevLeft from '../assets/icons/Chevron-left-white.svg'

const QUESTION_TIME = 15 // seconds
const OPTION_LETTERS = ['A', 'B', 'C', 'D']

// ─── Mock answer-percentage distribution ──────────────────────────────────────
// Generates stable mock percentages per question (seeded by question id).
// Correct answer always gets the plurality; total sums to 100.
function getMockPercentages(
  question: QuizQuestion,
  revealedChoiceId: string | null,
): Record<string, number> {
  // Simple deterministic seed from question id character codes
  const seed = question.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const n = question.options.length
  const weights = question.options.map((opt, i) => {
    const base = ((seed * (i + 7) * 31) % 40) + 5 // 5..44
    return opt.id === question.correctId ? base + 30 : base
  })
  const total = weights.reduce((a, b) => a + b, 0)
  let remaining = 100
  const pcts: Record<string, number> = {}
  question.options.forEach((opt, i) => {
    const pct = i === n - 1
      ? remaining
      : Math.round((weights[i] / total) * 100)
    pcts[opt.id] = pct
    remaining -= pct
  })
  return pcts
}

// ─── Option button ─────────────────────────────────────────────────────────────
function OptionButton({
  letter,
  label,
  optId,
  chosenId,
  correctId,
  revealed,
  percentage,
  onSelect,
}: {
  letter: string
  label: string
  optId: string
  chosenId: string | null
  correctId: string
  revealed: boolean
  percentage: number
  onSelect: () => void
}) {
  const isChosen  = chosenId === optId
  const isCorrect = optId === correctId
  const isWrong   = isChosen && !isCorrect

  // colours
  let borderColor = 'var(--c-border)'
  let badgeBg     = 'var(--c-surface-raise)'
  let textColor   = 'var(--c-text-1)'
  let badgeColor  = 'var(--c-text-3)'

  if (!revealed && isChosen) {
    borderColor = 'var(--c-accent)'
    badgeBg     = 'var(--c-accent)'
    badgeColor  = '#000'
  } else if (revealed && isCorrect) {
    borderColor = 'var(--c-correct)'
    badgeBg     = 'var(--c-correct)'
    badgeColor  = '#fff'
    textColor   = 'var(--c-correct)'
  } else if (revealed && isWrong) {
    borderColor = 'var(--c-error)'
    badgeBg     = 'var(--c-error)'
    badgeColor  = '#fff'
    textColor   = 'var(--c-error)'
  } else if (revealed) {
    borderColor = 'var(--c-border)'
    textColor   = 'var(--c-text-3)'
    badgeColor  = 'var(--c-text-3)'
  }

  return (
    <button
      onClick={revealed ? undefined : onSelect}
      disabled={revealed}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        padding: '0 20px 0 16px',
        height: 58,
        borderRadius: 50,
        border: `1.5px solid ${borderColor}`,
        background: revealed && isCorrect
          ? 'rgba(52,219,128,0.08)'
          : revealed && isWrong
          ? 'rgba(217,87,87,0.08)'
          : 'var(--c-surface)',
        cursor: revealed ? 'default' : 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        overflow: 'hidden',
        transition: 'border-color 200ms ease, background 200ms ease',
      }}
    >
      {/* Percentage fill bar — always rendered so CSS transition fires left→right */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: revealed ? `${percentage}%` : '0%',
          background: isCorrect
            ? 'rgba(52,219,128,0.12)'
            : isWrong
            ? 'rgba(217,87,87,0.10)'
            : 'rgba(255,255,255,0.04)',
          borderRadius: 50,
          transition: revealed ? 'width 600ms ease' : 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Letter badge */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: badgeBg,
          color: badgeColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
          transition: 'background 200ms ease, color 200ms ease',
          zIndex: 1,
        }}
      >
        {revealed && isCorrect ? '✓' : revealed && isWrong ? '✗' : letter}
      </div>

      {/* Option label */}
      <span
        style={{
          flex: 1,
          fontSize: 15,
          color: textColor,
          fontWeight: isChosen ? 600 : 400,
          transition: 'color 200ms ease',
          zIndex: 1,
        }}
      >
        {label}
      </span>

      {/* Percentage (after reveal) */}
      {revealed && (
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: isCorrect ? 'var(--c-correct)' : isWrong ? 'var(--c-error)' : 'var(--c-text-3)',
            flexShrink: 0,
            zIndex: 1,
          }}
        >
          {percentage}%
        </span>
      )}
    </button>
  )
}

// ─── Circular countdown timer ─────────────────────────────────────────────────
function CircularTimer({ timeLeft, size = 44 }: { timeLeft: number; size?: number }) {
  const R = (size - 8) / 2
  const circumference = 2 * Math.PI * R
  const offset = circumference * (1 - timeLeft / QUESTION_TIME)
  const cx = size / 2
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={3} />
        <circle
          cx={cx} cy={cx} r={R}
          fill="none"
          stroke="#ffffff"
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)', color: '#ffffff' }}>
        {timeLeft}
      </div>
    </div>
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
  slideStyle: React.CSSProperties
  onSelect: (id: string) => void
  onNext: () => void
  onBack: () => void
}

function QuestionScreen({
  quiz, question, qIndex, total, score,
  chosenId, revealed, timeLeft, slideStyle,
  onSelect, onNext, onBack,
}: QuestionScreenProps) {
  const isLast = qIndex === total - 1
  const percentages = revealed ? getMockPercentages(question, chosenId) : {}

  return (
    <Screen>
      <div
        className="page-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          maxWidth: 420,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* ── Top bar (NOT animated — stays fixed) ─────────────── */}
        <div style={{ padding: 'var(--sp-4)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <button onClick={onBack} className="btn-icon"><img src={chevLeft} width={24} height={24} alt="Back" /></button>
            <div style={{ flex: 1, height: 4, background: 'var(--c-surface-raise)', borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${((qIndex + (revealed ? 1 : 0)) / total) * 100}%`,
                  background: 'var(--c-accent)',
                  borderRadius: 2,
                  transition: 'width 300ms ease',
                }}
              />
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-2)', flexShrink: 0 }}>
              {qIndex + 1}/{total}
            </span>
          </div>
        </div>

        {/* ── Animated content (header + question + options only) ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...slideStyle, overflow: 'hidden' }}>
          {/* Question image header */}
          <div
            style={{
              position: 'relative',
              margin: '0 var(--sp-4)',
              height: 180,
              borderRadius: 'var(--r-lg)',
              background: question.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 64,
              marginBottom: 'var(--sp-5)',
              flexShrink: 0,
              overflow: 'hidden',
              boxShadow: `0 8px 32px ${question.accentColor}55, inset 0 1px 0 rgba(255,255,255,0.15)`,
            }}
          >
            {quiz.emoji}
            {/* Depth overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(0,0,0,0.18) 100%)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Timer — between image and question */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-4)', flexShrink: 0 }}>
            <CircularTimer timeLeft={timeLeft} size={64} />
          </div>

          {/* Question text */}
          <div
            style={{
              padding: '0 var(--sp-6)',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--weight-light)',
              color: 'var(--c-text-1)',
              lineHeight: 'var(--leading-tight)',
              letterSpacing: 'var(--tracking-tight)',
              textAlign: 'center',
              marginBottom: 'var(--sp-6)',
              flexShrink: 0,
            }}
          >
            {question.question}
          </div>

          {/* Options */}
          <div
            style={{
              flex: 1,
              padding: '0 var(--sp-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--sp-3)',
            }}
          >
            {question.options.map((opt, i) => (
              <OptionButton
                key={opt.id}
                letter={OPTION_LETTERS[i]}
                label={opt.label}
                optId={opt.id}
                chosenId={chosenId}
                correctId={question.correctId}
                revealed={revealed}
                percentage={percentages[opt.id] ?? 0}
                onSelect={() => onSelect(opt.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Fixed bottom: score feedback + Next CTA (no slide) ── */}
        <div style={{ padding: 'var(--sp-5) var(--sp-4) var(--sp-8)', flexShrink: 0 }}>
            {revealed && (
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 'var(--text-sm)',
                  color: chosenId === question.correctId ? 'var(--c-correct)' : 'var(--c-error)',
                  marginBottom: 'var(--sp-3)',
                  fontWeight: 'var(--weight-med)',
                  letterSpacing: 'var(--tracking-wide)',
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
              className="btn"
              style={{
                width: '100%',
                padding: '16px 0',
                borderRadius: 50,
                border: 'none',
                background: revealed ? '#ffffff' : 'var(--c-surface-raise)',
                color: revealed ? 'var(--c-brand)' : 'var(--c-text-3)',
                fontSize: 'var(--text-md)',
                fontWeight: 'var(--weight-bold)',
                cursor: revealed ? 'pointer' : 'default',
                fontFamily: 'inherit',
                transition: 'background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)',
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
  const location = useLocation()
  const { addPoints, recordQuizResult } = useStore()

  const quizId      = (location.state as { quizId?: string } | null)?.quizId
  const quizIdx     = quizId ? QUIZZES.findIndex(q => q.id === quizId) : 0
  const resolvedIdx = quizIdx >= 0 ? quizIdx : 0

  const [qIdx,      setQIdx]      = useState(0)
  const [score,     setScore]     = useState(0)
  const [chosenId,  setChosenId]  = useState<string | null>(null)
  const [revealed,  setRevealed]  = useState(false)
  const [timeLeft,  setTimeLeft]  = useState(QUESTION_TIME)

  // ── MAR-39: slide animation state ──────────────────────────────────────────
  const [slideStyle, setSlideStyle] = useState<React.CSSProperties>({
    transform: 'translateX(0)', opacity: 1,
    transition: 'transform 280ms ease, opacity 280ms ease',
    overflow: 'hidden',
  })
  const isAnimating = useRef(false)

  const quiz     = QUIZZES[resolvedIdx]
  const question = quiz?.questions[qIdx]
  const total    = quiz?.questions.length ?? 0
  const isLast   = qIdx === total - 1

  // Slide-in on question index change
  useEffect(() => {
    setSlideStyle({
      transform: 'translateX(60px)', opacity: 0,
      transition: 'none',
      overflow: 'hidden',
    })
    const raf = requestAnimationFrame(() => {
      setSlideStyle({
        transform: 'translateX(0)', opacity: 1,
        transition: 'transform 280ms ease, opacity 280ms ease',
        overflow: 'hidden',
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [qIdx])

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (revealed) return
    if (timeLeft <= 0) {
      setRevealed(true)
      track('quiz_question_timeout', { quizId: quiz.id, qIdx })
      return
    }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [revealed, timeLeft, quiz?.id, qIdx])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelect = useCallback((id: string) => {
    if (revealed) return
    setChosenId(id)
    setRevealed(true)
    const correct = id === question.correctId
    if (correct) setScore(s => s + 1)
    track('quiz_answer', { quizId: quiz.id, qIdx, correct })
  }, [revealed, question?.correctId, quiz?.id, qIdx])

  const handleNext = useCallback(() => {
    if (isAnimating.current) return
    if (isLast) {
      setScore(finalScore => {
        addPoints(finalScore)
        recordQuizResult(quiz.id, finalScore, total)
        track('quiz_completed', { quizId: quiz.id, score: finalScore, total })
        navigate('/results', { state: { score: finalScore, total, quizTitle: quiz.title } })
        return finalScore
      })
      return
    }

    // Slide out left, then advance
    isAnimating.current = true
    setSlideStyle({
      transform: 'translateX(-60px)', opacity: 0,
      transition: 'transform 240ms ease, opacity 240ms ease',
      overflow: 'hidden',
    })
    setTimeout(() => {
      setQIdx(i => i + 1)
      setChosenId(null)
      setRevealed(false)
      setTimeLeft(QUESTION_TIME)
      isAnimating.current = false
      // slide-in triggered by qIdx useEffect above
    }, 250)
  }, [isLast, quiz, total, addPoints, recordQuizResult, navigate])

  const handleBack = useCallback(() => {
    track('quiz_abandoned', { quizId: quiz?.id, qIdx })
    navigate(-1)
  }, [quiz?.id, qIdx, navigate])

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
      slideStyle={slideStyle}
      onSelect={handleSelect}
      onNext={handleNext}
      onBack={handleBack}
    />
  )
}

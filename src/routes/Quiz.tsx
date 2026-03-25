import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { QUIZZES, type Quiz, type QuizQuestion } from '../data/quizzes'

const QUESTION_TIME = 15 // seconds
const OPTION_LETTERS = ['A', 'B', 'C', 'D']

// ─── Mock answer-percentage distribution ──────────────────────────────────────
function getMockPercentages(
  question: QuizQuestion,
  revealedChoiceId: string | null,
): Record<string, number> {
  const seed = question.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const n = question.options.length
  const weights = question.options.map((opt, i) => {
    const base = ((seed * (i + 7) * 31) % 40) + 5
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

  // Build BEM class
  let className = 'f-quiz-option'
  if (!revealed && isChosen) className += ' f-quiz-option--selected'
  else if (revealed && isCorrect) className += ' f-quiz-option--correct'
  else if (revealed && isWrong) className += ' f-quiz-option--wrong'

  // Badge + text colors based on state
  let badgeBg    = 'var(--f-brand-color-background-disabled)'
  let badgeColor = 'var(--f-brand-color-text-secondary)'
  let textColor  = 'var(--f-brand-color-text-heading)'

  if (!revealed && isChosen) {
    badgeBg    = 'var(--f-brand-color-background-primary)'
    badgeColor = '#ffffff'
  } else if (revealed && isCorrect) {
    badgeBg    = 'var(--f-brand-color-border-success)'
    badgeColor = '#ffffff'
    textColor  = 'var(--f-brand-color-icon-success)'
  } else if (revealed && isWrong) {
    badgeBg    = 'var(--f-brand-color-border-error)'
    badgeColor = '#ffffff'
    textColor  = 'var(--f-brand-color-border-error)'
  } else if (revealed) {
    textColor  = 'var(--f-brand-color-text-secondary)'
    badgeColor = 'var(--f-brand-color-text-secondary)'
  }

  // Percentage fill color
  const fillBg = isCorrect
    ? 'var(--f-brand-color-background-success-accent)'
    : isWrong
    ? 'var(--f-brand-color-background-error)'
    : 'rgba(0,0,0,0.03)'

  return (
    <button
      onClick={revealed ? undefined : onSelect}
      disabled={revealed}
      className={className}
    >
      {/* Percentage fill bar */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: revealed ? `${percentage}%` : '0%',
          background: fillBg,
          borderRadius: 'var(--f-brand-radius-base)',
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
          fontSize: 'var(--text-2sm)',
          fontWeight: 'var(--f-brand-type-body-medium-weight)',
          flexShrink: 0,
          transition: 'background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)',
          zIndex: 1,
        }}
      >
        {revealed && isCorrect ? '✓' : revealed && isWrong ? '✗' : letter}
      </div>

      {/* Option label */}
      <span
        style={{
          flex: 1,
          fontFamily: 'var(--f-brand-type-body-medium-family)',
          fontSize: 'var(--f-brand-type-body-medium-size)',
          fontWeight: isChosen ? 'var(--f-brand-type-body-medium-weight)' : 'var(--weight-reg)',
          color: textColor,
          transition: 'color var(--dur-base) var(--ease-out)',
          zIndex: 1,
        }}
      >
        {label}
      </span>

      {/* Percentage (after reveal) */}
      {revealed && (
        <span
          style={{
            fontSize: 'var(--text-2sm)',
            fontWeight: 'var(--f-brand-type-body-medium-weight)',
            color: isCorrect
              ? 'var(--f-brand-color-icon-success)'
              : isWrong
              ? 'var(--f-brand-color-border-error)'
              : 'var(--f-brand-color-text-secondary)',
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
function CircularTimer({ timeLeft, size = 64 }: { timeLeft: number; size?: number }) {
  const R = (size - 8) / 2
  const circumference = 2 * Math.PI * R
  const offset = circumference * (1 - timeLeft / QUESTION_TIME)
  const cx = size / 2
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={cx} cy={cx} r={R}
          fill="none"
          stroke="var(--f-brand-color-background-disabled)"
          strokeWidth={3}
        />
        <circle
          cx={cx} cy={cx} r={R}
          fill="none"
          stroke="var(--f-brand-color-background-primary)"
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--f-brand-type-headline-medium-family)',
          fontSize: 'var(--f-brand-type-headline-medium-size)',
          fontWeight: 'var(--f-brand-type-headline-medium-weight)',
          color: 'var(--f-brand-color-text-heading)',
        }}
      >
        {timeLeft}
      </div>
    </div>
  )
}

// ─── Back button (ghost, 44px touch) ──────────────────────────────────────────
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="f-button--ghost"
      aria-label="Back"
      style={{
        width: 44,
        height: 44,
        minHeight: 44,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        flexShrink: 0,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <path
          d="M15 19l-7-7 7-7"
          stroke="var(--f-brand-color-text-heading)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
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
    <div
      style={{
        background: 'var(--f-brand-color-background-default)',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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
        {/* ── Top bar ─────────────────────────────────────────── */}
        <div style={{ padding: 'var(--sp-4)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <BackButton onClick={onBack} />
            {/* Progress bar */}
            <div
              style={{
                flex: 1,
                height: 4,
                background: 'var(--f-brand-color-background-disabled)',
                borderRadius: 'var(--f-brand-radius-rounded)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${((qIndex + (revealed ? 1 : 0)) / total) * 100}%`,
                  background: 'var(--f-brand-color-background-primary)',
                  borderRadius: 'var(--f-brand-radius-rounded)',
                  transition: 'width 300ms ease',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: 'var(--f-brand-type-body-medium-family)',
                fontSize: 'var(--f-brand-type-body-medium-size)',
                color: 'var(--f-brand-color-text-secondary)',
                flexShrink: 0,
              }}
            >
              {qIndex + 1}/{total}
            </span>
          </div>
        </div>

        {/* ── Animated content ──────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...slideStyle, overflow: 'hidden' }}>
          {/* Question image header */}
          <div
            style={{
              position: 'relative',
              margin: '0 var(--sp-4)',
              height: 180,
              borderRadius: 'var(--f-brand-radius-base)',
              background: question.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 64,
              marginBottom: 'var(--sp-5)',
              flexShrink: 0,
              overflow: 'hidden',
              boxShadow: `0 8px 32px ${question.accentColor}55`,
            }}
          >
            {quiz.emoji}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(0,0,0,0.18) 100%)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Timer */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-4)', flexShrink: 0 }}>
            <CircularTimer timeLeft={timeLeft} size={64} />
          </div>

          {/* Question text — FDS Title 4 */}
          <div
            style={{
              padding: '0 var(--sp-6)',
              fontFamily: 'var(--f-brand-type-title-4-family)',
              fontSize: 'var(--f-brand-type-title-4-size)',
              fontWeight: 'var(--f-brand-type-title-4-weight)',
              lineHeight: 'var(--f-brand-type-title-4-line)',
              color: 'var(--f-brand-color-text-heading)',
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

        {/* ── Fixed bottom: score feedback + Next CTA ──────── */}
        <div style={{ padding: 'var(--sp-5) var(--sp-4) var(--sp-8)', flexShrink: 0 }}>
          {revealed && (
            <div
              style={{
                textAlign: 'center',
                fontFamily: 'var(--f-brand-type-body-medium-family)',
                fontSize: 'var(--f-brand-type-body-medium-size)',
                fontWeight: 'var(--f-brand-type-body-medium-weight)',
                color: chosenId === question.correctId
                  ? 'var(--f-brand-color-icon-success)'
                  : 'var(--f-brand-color-border-error)',
                marginBottom: 'var(--sp-3)',
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
            className={`f-button ${revealed ? 'f-button--primary' : ''}`}
            style={{
              width: '100%',
              ...(!revealed ? {
                background: 'var(--f-brand-color-background-disabled)',
                color: 'var(--f-brand-color-text-secondary)',
                cursor: 'default',
              } : {}),
            }}
          >
            {isLast && revealed ? `Finish · ${score}/${total}` : 'Next'}
          </button>
        </div>
      </div>
    </div>
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

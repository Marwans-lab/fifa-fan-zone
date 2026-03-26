import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore, FLOW_IDS, type FlowId } from '../store/useStore'
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
  let borderColor = 'var(--f-brand-color-border-default)'
  let badgeBg     = 'var(--f-brand-color-background-light)'
  let textColor   = 'var(--f-brand-color-text-default)'
  let badgeColor  = 'var(--f-brand-color-text-muted)'

  if (!revealed && isChosen) {
    borderColor = 'var(--f-brand-color-accent)'
    badgeBg     = 'var(--f-brand-color-accent)'
    badgeColor  = 'var(--f-brand-color-text-default)'
  } else if (revealed && isCorrect) {
    borderColor = 'var(--f-brand-color-border-success)'
    badgeBg     = 'var(--f-brand-color-border-success)'
    badgeColor  = 'var(--f-brand-color-text-light)'
    textColor   = 'var(--f-brand-color-border-success)'
  } else if (revealed && isWrong) {
    borderColor = 'var(--f-brand-color-status-error)'
    badgeBg     = 'var(--f-brand-color-status-error)'
    badgeColor  = 'var(--f-brand-color-text-light)'
    textColor   = 'var(--f-brand-color-status-error)'
  } else if (revealed) {
    borderColor = 'var(--f-brand-color-border-default)'
    textColor   = 'var(--f-brand-color-text-muted)'
    badgeColor  = 'var(--f-brand-color-text-muted)'
  }

  return (
    <button
      onClick={revealed ? undefined : onSelect}
      disabled={revealed}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-3)',
        width: '100%',
        padding: '0 var(--sp-5) 0 var(--sp-4)',
        height: 'var(--sp-14)',
        borderRadius: 'var(--f-brand-radius-rounded)',
        border: `1.5px solid ${borderColor}`,
        background: revealed && isCorrect
          ? 'rgba(52,219,128,0.08)'
          : revealed && isWrong
          ? 'rgba(217,87,87,0.08)'
          : 'var(--f-brand-color-background-light)',
        cursor: revealed ? 'default' : 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        overflow: 'hidden',
        transition: 'border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
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
          borderRadius: 'var(--f-brand-radius-rounded)',
          transition: revealed ? 'width var(--f-brand-motion-duration-gentle) var(--f-brand-motion-easing-default)' : 'none',
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
          fontWeight: 500,
          flexShrink: 0,
          transition: 'background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
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
          transition: 'color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
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
            fontWeight: 500,
            color: isCorrect ? 'var(--f-brand-color-border-success)' : isWrong ? 'var(--f-brand-color-status-error)' : 'var(--f-brand-color-text-muted)',
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
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={cx} cy={cx} r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={3} />
        <circle
          cx={cx} cy={cx} r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear', color: 'var(--f-brand-color-text-light)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, fontFamily: 'var(--f-base-type-family-secondary)', color: 'var(--f-brand-color-text-light)' }}>
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
        className="f-page-enter"
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
        <div style={{ padding: 'var(--f-brand-space-md)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--f-brand-space-sm)' }}>
            <button onClick={onBack} className="f-button f-button--ghost"><img src={chevLeft} width={24} height={24} alt="Back" /></button>
            <div style={{ flex: 1, height: 4, background: 'var(--f-brand-color-background-light)', borderRadius: 'var(--f-brand-radius-rounded)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${((qIndex + (revealed ? 1 : 0)) / total) * 100}%`,
                  background: 'var(--f-brand-color-accent)',
                  borderRadius: 'var(--f-brand-radius-rounded)',
                  transition: 'width var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
                }}
              />
            </div>
            <span style={{ fontSize: '11', color: 'var(--f-brand-color-text-subtle)', flexShrink: 0 }}>
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
              margin: '0 var(--f-brand-space-md)',
              height: 180,
              borderRadius: 'var(--f-brand-radius-inner)',
              background: question.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 64,
              marginBottom: 'var(--f-brand-space-md)',
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
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--f-brand-space-md)', flexShrink: 0 }}>
            <CircularTimer timeLeft={timeLeft} size={64} />
          </div>

          {/* Question text */}
          <div
            style={{
              padding: '0 var(--f-brand-space-lg)',
              fontFamily: 'var(--f-base-type-family-primary)',
              fontSize: '22',
              fontWeight: '300',
              color: 'var(--f-brand-color-text-default)',
              lineHeight: '1.12',
              letterSpacing: '-0.03em',
              textAlign: 'center',
              marginBottom: 'var(--f-brand-space-lg)',
              flexShrink: 0,
            }}
          >
            {question.question}
          </div>

          {/* Options */}
          <div
            style={{
              flex: 1,
              padding: '0 var(--f-brand-space-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--f-brand-space-sm)',
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
        <div style={{ padding: 'var(--f-brand-space-md) var(--f-brand-space-md) var(--f-brand-space-xl)', flexShrink: 0 }}>
            {revealed && (
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '13',
                  color: chosenId === question.correctId ? 'var(--f-brand-color-border-success)' : 'var(--f-brand-color-status-error)',
                  marginBottom: 'var(--f-brand-space-sm)',
                  fontWeight: '500',
                  letterSpacing: '0.05em',
                }}
              >
                {chosenId === question.correctId
                  ? '✓ Correct! +1 point'
                  : chosenId
                  ? '✗ Not quite'
                  : '⏱ Time\'s up!'}
              </div>
            )}
            <button
              onClick={onNext}
              disabled={!revealed}
              className="f-button"
              style={{
                width: '100%',
                padding: 'var(--sp-4) 0',
                borderRadius: 'var(--f-brand-radius-rounded)',
                border: 'none',
                background: revealed ? 'var(--f-brand-color-text-light)' : 'var(--f-brand-color-background-light)',
                color: revealed ? 'var(--f-brand-color-primary)' : 'var(--f-brand-color-text-muted)',
                fontSize: '15',
                fontWeight: '500',
                cursor: revealed ? 'pointer' : 'default',
                fontFamily: 'inherit',
                transition: 'background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
              }}
            >
              {isLast && revealed ? `Finish · ${score}/${total}` : 'Next question'}
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
  const { addPoints, recordQuizResult, completeFlow } = useStore()

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
    transition: 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
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
        transition: 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
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
        if ((FLOW_IDS as readonly string[]).includes(quiz.id)) {
          completeFlow(quiz.id as FlowId)
        }
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
      transition: 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
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
  }, [isLast, quiz, total, addPoints, recordQuizResult, completeFlow, navigate])

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

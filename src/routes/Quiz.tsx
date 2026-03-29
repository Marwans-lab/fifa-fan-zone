import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore, FLOW_IDS, type FlowId } from '../store/useStore'
import { QUIZZES, type Quiz, type QuizQuestion } from '../data/quizzes'

const QUESTION_TIME = 15
const OPTION_LETTERS = ['A', 'B', 'C', 'D']

// ─── Option button ─────────────────────────────────────────────────────────────
function OptionButton({
  letter,
  label,
  optId,
  chosenId,
  correctId,
  revealed,
  onSelect,
}: {
  letter: string
  label: string
  optId: string
  chosenId: string | null
  correctId: string
  revealed: boolean
  onSelect: () => void
}) {
  const isChosen  = chosenId === optId
  const isCorrect = optId === correctId
  const isWrong   = isChosen && !isCorrect

  let rowBg      = 'var(--c-lt-surface)'
  let rowBorder  = 'transparent'
  let badgeBg    = 'var(--c-lt-bg)'
  let badgeColor = 'var(--c-lt-text-1)'
  let textColor  = 'var(--c-lt-text-1)'

  if (!revealed && isChosen) {
    rowBorder  = 'var(--c-lt-brand)'
    badgeBg    = 'var(--c-lt-brand)'
    badgeColor = '#fff'
  } else if (revealed && isCorrect) {
    rowBg      = 'var(--c-correct-bg)'
    rowBorder  = 'var(--c-correct-border)'
    badgeBg    = 'var(--c-correct)'
    badgeColor = '#fff'
    textColor  = 'var(--c-lt-correct-dark)'
  } else if (revealed && isWrong) {
    rowBg      = 'var(--c-error-bg)'
    rowBorder  = 'var(--c-error-border)'
    badgeBg    = 'var(--c-error)'
    badgeColor = '#fff'
    textColor  = 'var(--c-error)'
  } else if (revealed) {
    badgeColor = 'var(--c-lt-text-2)'
    textColor  = 'var(--c-lt-text-2)'
  }

  return (
    <button
      className="quiz-option-btn"
      data-ui="answer-option-btn"
      onClick={revealed ? undefined : onSelect}
      disabled={revealed}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-4)',
        width: '100%',
        height: 56,
        paddingLeft: 'var(--sp-2)',
        paddingRight: 'var(--sp-6)',
        borderRadius: 52,
        border: `1.5px solid ${rowBorder}`,
        background: rowBg,
        boxShadow: '0px 2px 4px 0px var(--f-brand-color-shadow-default)',
        cursor: revealed ? 'default' : 'pointer',
        textAlign: 'left',
        transition: 'background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
      }}
    >
      {/* Letter badge */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: badgeBg,
        border: '1px solid var(--c-lt-surface)',
        color: badgeColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: 'var(--f-brand-type-body)',
        fontSize: 'var(--text-md)',
        flexShrink: 0,
        transition: 'background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
      }}>
        {revealed && isCorrect ? '✓' : revealed && isWrong ? '✗' : letter}
      </div>

      {/* Label */}
      <span style={{
        flex: 1,
        font: 'var(--f-brand-type-body)',
        fontSize: 'var(--text-md)',
        color: textColor,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        transition: 'color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
      }}>
        {label}
      </span>
    </button>
  )
}

// ─── Circular timer ────────────────────────────────────────────────────────────
function CircularTimer({ timeLeft }: { timeLeft: number }) {
  const size = 64
  const strokeW = 4
  const R = (size - strokeW) / 2
  const circ = 2 * Math.PI * R
  const offset = circ * (1 - timeLeft / QUESTION_TIME)
  const cx = size / 2
  const urgent = timeLeft <= 5

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={cx} cy={cx} r={R} fill="none" stroke="var(--c-lt-border)" strokeWidth={strokeW} />
        <circle
          cx={cx} cy={cx} r={R}
          fill="none"
          stroke={urgent ? 'var(--c-error)' : 'var(--c-lt-brand)'}
          strokeWidth={strokeW}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke var(--f-brand-motion-duration-instant)' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: 'var(--f-brand-type-headline)',
        fontSize: 'var(--text-lg)',
        color: urgent ? 'var(--c-error)' : 'var(--c-lt-text-1)',
        fontWeight: 'var(--weight-med)',
        transition: 'color var(--f-brand-motion-duration-instant)',
      }}>
        {String(timeLeft).padStart(2, '0')}
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
  const progressPct = ((qIndex + (revealed ? 1 : 0)) / total) * 100

  return (
    <Screen>
      <div
        data-page="quiz"
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          maxWidth: 420,
          margin: '0 auto',
          width: '100%',
          background: 'var(--c-lt-bg)',
        }}
      >
        {/* ── Header: close + progress bar ─── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-4)',
          padding: 'var(--sp-18) var(--sp-4) 0',
          flexShrink: 0,
        }}>
          <button
            data-ui="back-btn"
            onClick={onBack}
            aria-label="Close quiz"
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--c-lt-surface)',
              border: '1px solid var(--c-lt-surface)',
              boxShadow: '0px 2px 4px 0px var(--f-brand-color-shadow-default)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="var(--c-lt-text-1)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <div style={{
            flex: 1,
            height: 8,
            background: 'var(--c-lt-surface)',
            borderRadius: 64,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, var(--c-correct) 0%, var(--c-lt-correct-dark) 100%)',
              borderRadius: 64,
              transition: 'width var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
            }} />
          </div>
        </div>

        {/* ── Animated slide content ───────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...slideStyle, overflow: 'hidden' }}>

          {/* Banner image */}
          <div style={{
            margin: 'var(--sp-5) var(--sp-4) 0',
            height: 196,
            borderRadius: 'var(--f-brand-radius-inner)',
            overflow: 'hidden',
            flexShrink: 0,
            background: question.accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {quiz.bannerImage ? (
              <img
                src={quiz.bannerImage}
                alt=""
                aria-hidden="true"
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
            ) : (
              <span style={{ fontSize: 'var(--text-5xl)' }}>{quiz.emoji}</span>
            )}
          </div>

          {/* Question text */}
          <p style={{
            padding: 'var(--sp-6) var(--sp-4) 0',
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--weight-light)',
            fontSize: 'var(--text-2xl)',
            lineHeight: 'var(--leading-snug)',
            color: 'var(--c-lt-text-1)',
            textAlign: 'center',
            flexShrink: 0,
            margin: 0,
          }}>
            {question.question}
          </p>

          {/* Options */}
          <div style={{
            padding: 'var(--sp-6) var(--sp-4) 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-4)',
            flexShrink: 0,
          }}>
            {question.options.map((opt, i) => (
              <OptionButton
                key={opt.id}
                letter={OPTION_LETTERS[i]}
                label={opt.label}
                optId={opt.id}
                chosenId={chosenId}
                correctId={question.correctId}
                revealed={revealed}
                onSelect={() => onSelect(opt.id)}
              />
            ))}
          </div>

        </div>

        {/* ── Fixed bottom: timer + feedback + Next ── */}
        <div style={{ padding: '0 var(--sp-4) var(--sp-10)', flexShrink: 0 }}>

          {/* Timer */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: 'var(--sp-6) 0 var(--sp-4)' }}>
            <CircularTimer timeLeft={timeLeft} />
          </div>

          {/* Feedback */}
          {revealed && (
            <p style={{
              textAlign: 'center',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-med)',
              color: chosenId === question.correctId ? 'var(--c-lt-correct-dark)' : 'var(--c-error)',
              marginBottom: 'var(--sp-3)',
              margin: '0 0 var(--sp-3)',
            }}>
              {chosenId === question.correctId
                ? '✓ Correct!'
                : chosenId
                ? '✗ Not quite'
                : "⏱ Time's up!"}
            </p>
          )}

          {/* Next button */}
          <button
            data-ui="next-question-btn"
            onClick={revealed ? onNext : undefined}
            style={{
              width: '100%',
              height: 56,
              borderRadius: 32,
              border: 'none',
              background: revealed ? 'var(--c-lt-brand)' : 'var(--c-lt-border)',
              color: revealed ? '#fff' : 'var(--c-lt-text-2)',
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-med)',
              fontSize: 'var(--text-md)',
              cursor: revealed ? 'pointer' : 'default',
              transition: 'background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
            }}
          >
            {isLast && revealed ? `Finish · ${score + (chosenId === question.correctId ? 1 : 0)}/${total}` : 'Next'}
          </button>
        </div>
      </div>
    </Screen>
  )
}

// ─── Main quiz route ───────────────────────────────────────────────────────────
export default function QuizRoute() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { addPoints, recordQuizResult, completeFlow } = useStore()

  const quizId      = (location.state as { quizId?: string } | null)?.quizId
  const quizIdx     = quizId ? QUIZZES.findIndex(q => q.id === quizId) : 0
  const resolvedIdx = quizIdx >= 0 ? quizIdx : 0

  const [qIdx,     setQIdx]     = useState(0)
  const [score,    setScore]    = useState(0)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)

  const [slideStyle, setSlideStyle] = useState<React.CSSProperties>({
    transform: 'translateX(0)', opacity: 1,
    transition: 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
  })
  const isAnimating = useRef(false)

  const quiz     = QUIZZES[resolvedIdx]
  const question = quiz?.questions[qIdx]
  const total    = quiz?.questions.length ?? 0
  const isLast   = qIdx === total - 1

  // Slide-in on question change
  useEffect(() => {
    setSlideStyle({ transform: 'translateX(60px)', opacity: 0, transition: 'none' })
    const raf = requestAnimationFrame(() => {
      setSlideStyle({
        transform: 'translateX(0)', opacity: 1,
        transition: 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [qIdx])

  // Timer
  useEffect(() => {
    if (revealed) return
    if (timeLeft <= 0) {
      setRevealed(true)
      track('quiz_question_timeout', { quizId: quiz?.id, qIdx })
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
    track('quiz_answer', { quizId: quiz?.id, qIdx, correct })
  }, [revealed, question?.correctId, quiz?.id, qIdx])

  const handleNext = useCallback(() => {
    if (isAnimating.current || !revealed) return
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

    isAnimating.current = true
    setSlideStyle({
      transform: 'translateX(-60px)', opacity: 0,
      transition: 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
    })
    setTimeout(() => {
      setQIdx(i => i + 1)
      setChosenId(null)
      setRevealed(false)
      setTimeLeft(QUESTION_TIME)
      isAnimating.current = false
    }, 250)
  }, [isLast, revealed, quiz, total, addPoints, recordQuizResult, completeFlow, navigate])

  const handleBack = useCallback(() => {
    track('quiz_abandoned', { quizId: quiz?.id, qIdx })
    navigate(-1)
  }, [quiz?.id, qIdx, navigate])

  if (!quiz || !question) return null

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

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { IMAGE_QUIZZES, type ImageQuestion } from '../data/imageQuizzes'
import chevLeft from '../assets/icons/Chevron-left-white.svg'

const QUESTION_TIME = 15 // seconds

// ─── Tick icon (white, centered) ──────────────────────────────────────────────
function TickIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path
        d="M10 20L17 27L30 13"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Close icon (white, centered) ─────────────────────────────────────────────
function CloseIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path
        d="M12 12L28 28M28 12L12 28"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
        <circle cx={cx} cy={cx} r={R} fill="none" stroke="var(--c-surface-raise)" strokeWidth={3} />
        <circle
          cx={cx} cy={cx} r={R}
          fill="none"
          stroke="var(--c-text-1)"
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-med)', fontFamily: 'var(--font-body)', color: 'var(--c-text-1)' }}>
        {timeLeft}
      </div>
    </div>
  )
}

// ─── Image option card ────────────────────────────────────────────────────────
function ImageOptionCard({
  option,
  revealed,
  isChosen,
  isCorrect,
  onSelect,
}: {
  option: { id: string; label: string; imageUrl: string }
  revealed: boolean
  isChosen: boolean
  isCorrect: boolean
  onSelect: () => void
}) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const showOverlay = revealed && (isChosen || isCorrect)
  const overlayColor = isCorrect
    ? 'var(--c-correct-overlay)'
    : 'var(--c-error-overlay)'

  // Border styling
  let borderColor = 'var(--c-border)'
  if (revealed && isCorrect) {
    borderColor = 'var(--c-correct)'
  } else if (revealed && isChosen && !isCorrect) {
    borderColor = 'var(--c-error)'
  } else if (!revealed && isChosen) {
    borderColor = 'var(--c-accent)'
  }

  return (
    <button
      onClick={revealed ? undefined : onSelect}
      disabled={revealed}
      aria-label={option.label}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1',
        borderRadius: 'var(--r-lg)',
        border: `2px solid ${borderColor}`,
        background: 'var(--c-surface)',
        overflow: 'hidden',
        cursor: revealed ? 'default' : 'pointer',
        padding: 0,
        fontFamily: 'inherit',
        transition: 'border-color 200ms ease, transform 150ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Image */}
      <img
        src={option.imageUrl}
        alt={option.label}
        onLoad={() => setImgLoaded(true)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: imgLoaded ? 1 : 0,
          transition: 'opacity 300ms ease',
        }}
      />

      {/* Loading placeholder */}
      {!imgLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--c-surface-raise)',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '2.5px solid var(--c-surface-raise)',
              borderTopColor: 'var(--c-accent)',
              animation: 'quiz-spin 0.6s linear infinite',
            }}
          />
        </div>
      )}

      {/* Feedback overlay — green for correct, red for wrong */}
      {showOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: overlayColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 200ms ease',
            zIndex: 2,
          }}
        >
          {isCorrect ? <TickIcon /> : <CloseIcon />}
        </div>
      )}

      {/* Label at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 'var(--sp-5) var(--sp-2) var(--sp-2)',
          background: 'linear-gradient(transparent, var(--c-image-scrim))',
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-med)',
            color: 'var(--c-text-1)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {option.label}
        </span>
      </div>
    </button>
  )
}

// ─── Question screen ──────────────────────────────────────────────────────────
function ImageQuestionScreen({
  question,
  qIndex,
  total,
  score,
  chosenId,
  revealed,
  timeLeft,
  slideStyle,
  onSelect,
  onNext,
  onBack,
}: {
  question: ImageQuestion
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
}) {
  const isLast = qIndex === total - 1

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
        {/* ── Top bar ─────────────────────────────────── */}
        <div style={{ padding: 'var(--sp-4)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <button onClick={onBack} className="btn-icon">
              <img src={chevLeft} width={24} height={24} alt="Back" />
            </button>
            <div style={{ flex: 1, height: 'var(--sp-1)', background: 'var(--c-surface-raise)', borderRadius: 'var(--r-xs)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${((qIndex + (revealed ? 1 : 0)) / total) * 100}%`,
                  background: 'var(--c-accent)',
                  borderRadius: 'var(--r-xs)',
                  transition: 'width 300ms ease',
                }}
              />
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-2)', flexShrink: 0 }}>
              {qIndex + 1}/{total}
            </span>
          </div>
        </div>

        {/* ── Animated content ─────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...slideStyle, overflow: 'hidden' }}>
          {/* Timer */}
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

          {/* 2×2 Image grid */}
          <div
            style={{
              padding: '0 var(--sp-4)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--sp-3)',
              flex: 1,
            }}
          >
            {question.options.map((opt) => (
              <ImageOptionCard
                key={opt.id}
                option={opt}
                revealed={revealed}
                isChosen={chosenId === opt.id}
                isCorrect={opt.id === question.correctId}
                onSelect={() => onSelect(opt.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Fixed bottom: feedback + Next CTA ────────── */}
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
              padding: 'var(--sp-4) 0',
              borderRadius: 'var(--r-full)',
              border: 'none',
              background: revealed ? 'var(--c-text-1)' : 'var(--c-surface-raise)',
              color: revealed ? 'var(--c-brand)' : 'var(--c-text-3)',
              fontSize: 'var(--text-md)',
              fontWeight: 'var(--weight-med)',
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

// ─── Main image quiz route ──────────────────────────────────────────────────
export default function ImageQuizRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addPoints, recordQuizResult } = useStore()

  const quizId = (location.state as { quizId?: string } | null)?.quizId
  const quizIdx = quizId ? IMAGE_QUIZZES.findIndex(q => q.id === quizId) : 0
  const resolvedIdx = quizIdx >= 0 ? quizIdx : 0

  const [qIdx, setQIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)

  // Slide animation state
  const [slideStyle, setSlideStyle] = useState<React.CSSProperties>({
    transform: 'translateX(0)', opacity: 1,
    transition: 'transform 280ms ease, opacity 280ms ease',
    overflow: 'hidden',
  })
  const isAnimating = useRef(false)

  const quiz = IMAGE_QUIZZES[resolvedIdx]
  const question = quiz?.questions[qIdx]
  const total = quiz?.questions.length ?? 0
  const isLast = qIdx === total - 1

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

  // Timer
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

  // Handlers
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
    }, 250)
  }, [isLast, quiz, total, addPoints, recordQuizResult, navigate])

  const handleBack = useCallback(() => {
    track('quiz_abandoned', { quizId: quiz?.id, qIdx })
    navigate(-1)
  }, [quiz?.id, qIdx, navigate])

  return (
    <ImageQuestionScreen
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

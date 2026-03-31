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
    <svg className="image-quiz-icon-tick-svg" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path className="image-quiz-icon-tick-path"
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
    <svg className="image-quiz-icon-close-svg" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path className="image-quiz-icon-close-path"
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
    <div className="image-quiz-timer-wrapper" style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg className="image-quiz-timer-svg" width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle className="image-quiz-timer-track" cx={cx} cy={cx} r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={3} />
        <circle
          className="image-quiz-timer-fill"
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
      <div className="image-quiz-timer-label" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--f-brand-type-subheading-medium)', color: 'var(--f-brand-color-text-light)' }}>
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
    ? 'rgba(52, 219, 128, 0.30)'
    : 'rgba(217, 87, 87, 0.30)'

  // Border styling
  let borderColor = 'var(--f-brand-color-border-default)'
  if (revealed && isCorrect) {
    borderColor = 'var(--f-brand-color-border-success)'
  } else if (revealed && isChosen && !isCorrect) {
    borderColor = 'var(--f-brand-color-status-error)'
  } else if (!revealed && isChosen) {
    borderColor = 'var(--f-brand-color-accent)'
  }

  return (
    <button className="image-quiz-option-button"
      onClick={revealed ? undefined : onSelect}
      disabled={revealed}
      aria-label={option.label}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1',
        borderRadius: 'var(--f-brand-radius-inner)',
        border: `2px solid ${borderColor}`,
        background: 'var(--f-brand-color-background-light)',
        overflow: 'hidden',
        cursor: revealed ? 'default' : 'pointer',
        padding: 0,
        fontFamily: 'inherit',
        transition: 'border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), transform var(--f-brand-motion-duration-fast) var(--f-brand-motion-easing-default)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Image */}
      <img className="image-quiz-option-image"
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
          transition: 'opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
        }}
      />

      {/* Loading placeholder */}
      {!imgLoaded && (
        <div className="image-quiz-option-placeholder"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--f-brand-color-background-light)',
          }}
        >
          <div className="image-quiz-option-spinner"
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '2.5px solid rgba(255,255,255,0.15)',
              borderTopColor: 'var(--f-brand-color-accent)',
              animation: 'quiz-spin 0.6s linear infinite',
            }}
          />
        </div>
      )}

      {/* Feedback overlay — green for correct, red for wrong */}
      {showOverlay && (
        <div className="image-quiz-option-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            background: overlayColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
            zIndex: 2,
          }}
        >
          {isCorrect ? <TickIcon /> : <CloseIcon />}
        </div>
      )}

      {/* Label at bottom */}
      <div className="image-quiz-option-label-wrapper"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 'var(--f-brand-space-md) var(--f-brand-space-xs) var(--f-brand-space-xs)',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          zIndex: 1,
        }}
      >
        <span className="image-quiz-option-label"
          style={{
            font: 'var(--f-brand-type-caption-medium)',
            fontSize: 'var(--text-sm)',
            color: 'var(--f-brand-color-text-light)',
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
      <div className="f-page-enter"
        data-page="image-quiz"
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
        <div className="image-quiz-header" data-section="header" style={{ padding: 'var(--f-brand-space-md)', flexShrink: 0 }}>
          <div className="image-quiz-header-row" style={{ display: 'flex', alignItems: 'center', gap: 'var(--f-brand-space-sm)' }}>
            <button onClick={onBack} className="f-button f-button--ghost image-quiz-back-btn" data-ui="back-btn">
              <img className="image-quiz-back-icon" src={chevLeft} width={24} height={24} alt="Back" />
            </button>
            <div className="image-quiz-progress-track" style={{ flex: 1, height: 4, background: 'var(--f-brand-color-background-light)', borderRadius: 'var(--f-brand-radius-rounded)', overflow: 'hidden' }}>
              <div className="image-quiz-progress-fill"
                style={{
                  height: '100%',
                  width: `${((qIndex + (revealed ? 1 : 0)) / total) * 100}%`,
                  background: 'var(--f-brand-color-accent)',
                  borderRadius: 'var(--f-brand-radius-rounded)',
                  transition: 'width var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
                }}
              />
            </div>
            <span className="image-quiz-question-counter" style={{ fontSize: 'var(--text-xs)', color: 'var(--f-brand-color-text-subtle)', flexShrink: 0 }}>
              {qIndex + 1}/{total}
            </span>
          </div>
        </div>

        {/* ── Animated content ─────────────────────────── */}
        <div className="image-quiz-content-animated" style={{ flex: 1, display: 'flex', flexDirection: 'column', ...slideStyle, overflow: 'hidden' }}>
          {/* Timer */}
          <div className="image-quiz-timer-section" data-section="timer" style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--f-brand-space-md)', flexShrink: 0 }}>
            <CircularTimer timeLeft={timeLeft} size={64} />
          </div>

          {/* Question text */}
          <div className="image-quiz-question-text"
            data-section="question"
            style={{
              padding: '0 var(--f-brand-space-lg)',
              font: 'var(--f-brand-type-title-3)',
              fontSize: 'var(--text-xl)',
              color: 'var(--f-brand-color-text-default)',
              lineHeight: 'var(--leading-tight)',
              letterSpacing: 'var(--tracking-tight)',
              textAlign: 'center',
              marginBottom: 'var(--f-brand-space-lg)',
              flexShrink: 0,
            }}
          >
            {question.question}
          </div>

          {/* 2×2 Image grid */}
          <div className="image-quiz-options-grid"
            data-section="image-grid"
            style={{
              padding: '0 var(--f-brand-space-md)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--f-brand-space-sm)',
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
        <div className="image-quiz-footer" style={{ padding: 'var(--f-brand-space-md) var(--f-brand-space-md) var(--f-brand-space-xl)', flexShrink: 0 }}>
          {revealed && (
            <div className="image-quiz-feedback-message"
              style={{
                textAlign: 'center',
                fontSize: 'var(--text-sm)',
                color: chosenId === question.correctId ? 'var(--f-brand-color-border-success)' : 'var(--f-brand-color-status-error)',
                marginBottom: 'var(--f-brand-space-sm)',
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
          <button className="f-button"
            onClick={onNext}
            disabled={!revealed}
            data-ui="next-btn"
            style={{
              width: '100%',
              padding: 'var(--sp-4) 0',
              borderRadius: 'var(--f-brand-radius-rounded)',
              border: 'none',
              background: revealed ? 'var(--f-brand-color-text-light)' : 'var(--f-brand-color-background-light)',
              color: revealed ? 'var(--f-brand-color-primary)' : 'var(--f-brand-color-text-muted)',
              font: 'var(--f-brand-type-body-medium)',
              fontSize: 'var(--text-md)',
              cursor: revealed ? 'pointer' : 'default',
              transition: 'background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
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
    transition: 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
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
        transition: 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
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
      transition: 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
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

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore, type FlowId } from '../store/useStore'
import { RANKING_QUIZZES, type RankingItem } from '../data/rankingQuizzes'
import chevLeft from '../assets/icons/Chevron-left-white.svg'

const QUESTION_TIME = 15

// ─── Shuffle items (Fisher-Yates) ────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Circular countdown timer ────────────────────────────────────────────────
function CircularTimer({ timeLeft, size = 44 }: { timeLeft: number; size?: number }) {
  const R = (size - 8) / 2
  const circumference = 2 * Math.PI * R
  const offset = circumference * (1 - timeLeft / QUESTION_TIME)
  const cx = size / 2
  return (
    <div className="ranking-quiz-timer-wrapper" style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg className="ranking-quiz-timer-svg" width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle className="ranking-quiz-timer-track" cx={cx} cy={cx} r={R} fill="none" stroke="var(--c-surface)" strokeWidth={3} />
        <circle
          className="ranking-quiz-timer-fill"
          cx={cx} cy={cx} r={R}
          fill="none"
          stroke="var(--c-white)"
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="ranking-quiz-timer-label" style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        font: 'var(--f-brand-type-subheading-medium)', color: 'var(--c-white)',
      }}>
        {timeLeft}
      </div>
    </div>
  )
}

// ─── Draggable ranking item ──────────────────────────────────────────────────
interface RankItemProps {
  item: RankingItem
  index: number
  revealed: boolean
  correctIndex: number
  isDragging: boolean
  dragOffset: number
  onDragStart: (index: number, y: number) => void
}

function RankItem({
  item, index, revealed, correctIndex, isDragging, dragOffset, onDragStart,
}: RankItemProps) {
  const isCorrectPosition = index === correctIndex
  const positionLabel = index + 1

  let borderColor = 'var(--c-border)'
  let bg = 'var(--c-surface)'
  if (revealed && isCorrectPosition) {
    borderColor = 'var(--c-correct-border)'
    bg = 'var(--c-correct-bg)'
  } else if (revealed && !isCorrectPosition) {
    borderColor = 'var(--c-error-border)'
    bg = 'var(--c-error-bg)'
  } else if (isDragging) {
    borderColor = 'var(--c-accent)'
    bg = 'var(--c-accent-bg)'
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (revealed) return
    onDragStart(index, e.touches[0].clientY)
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (revealed) return
    onDragStart(index, e.clientY)
  }

  return (
    <div
      className="ranking-quiz-item-row"
      data-section="rank-item"
      onTouchStart={handleTouchStart}
      onMouseDown={handleMouseDown}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-3)',
        padding: '0 var(--sp-4)',
        height: 58,
        borderRadius: 'var(--r-full)',
        border: `1.5px solid ${borderColor}`,
        background: bg,
        cursor: revealed ? 'default' : 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: isDragging ? 'none' : 'transform 200ms ease, border-color 200ms ease, background 200ms ease',
        transform: isDragging ? `translateY(${dragOffset}px) scale(1.03)` : 'translateY(0) scale(1)',
        zIndex: isDragging ? 10 : 1,
        position: 'relative',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
        touchAction: 'none',
      }}
    >
      {/* Position badge */}
      <div className="ranking-quiz-item-badge" style={{
        width: 28, height: 28, borderRadius: '50%',
        background: revealed
          ? isCorrectPosition ? 'var(--c-correct)' : 'var(--c-error)'
          : 'var(--c-surface-raise)',
        color: revealed
          ? 'var(--c-white)'
          : 'var(--c-text-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-med)', flexShrink: 0,
        transition: 'background 200ms ease, color 200ms ease',
      }}>
        {revealed ? (isCorrectPosition ? '✓' : '✗') : positionLabel}
      </div>

      {/* Label */}
      <span className="ranking-quiz-item-label" style={{
        flex: 1, fontSize: 'var(--text-md)', color: 'var(--c-text-1)',
        fontWeight: isDragging ? 600 : 400,
      }}>
        {item.label}
      </span>

      {/* Drag handle */}
      {!revealed && (
        <div className="ranking-quiz-item-handle" style={{
          display: 'flex', flexDirection: 'column', gap: 2,
          opacity: 0.3, flexShrink: 0, padding: '0 var(--sp-1)',
        }}>
          <div className="ranking-quiz-item-handle-line" style={{ width: 16, height: 2, background: 'var(--c-text-1)', borderRadius: 1 }} />
          <div className="ranking-quiz-item-handle-line" style={{ width: 16, height: 2, background: 'var(--c-text-1)', borderRadius: 1 }} />
          <div className="ranking-quiz-item-handle-line" style={{ width: 16, height: 2, background: 'var(--c-text-1)', borderRadius: 1 }} />
        </div>
      )}

      {/* Correct position hint after reveal */}
      {revealed && !isCorrectPosition && (
        <span className="ranking-quiz-item-hint" style={{
          fontSize: 'var(--text-xs)', color: 'var(--c-text-2)', flexShrink: 0,
        }}>
          #{correctIndex + 1}
        </span>
      )}
    </div>
  )
}

// ─── Main route ──────────────────────────────────────────────────────────────
export default function RankingQuizRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addPoints, recordQuizResult, completeFlow } = useStore()

  const quizId = (location.state as { quizId?: string } | null)?.quizId
  const quiz = RANKING_QUIZZES.find(q => q.id === quizId) ?? RANKING_QUIZZES[0]

  const [qIdx, setQIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)

  // Items in user's current order (shuffled on mount / question change)
  const [items, setItems] = useState<RankingItem[]>([])

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const dragStartY = useRef(0)
  const dragStartIdx = useRef(0)
  const itemHeight = 70 // 58px height + 12px gap

  // Slide animation
  const [slideStyle, setSlideStyle] = useState<React.CSSProperties>({
    transform: 'translateX(0)', opacity: 1,
    transition: 'transform 280ms ease, opacity 280ms ease',
  })
  const isAnimating = useRef(false)

  const question = quiz.questions[qIdx]
  const total = quiz.questions.length
  const isLast = qIdx === total - 1

  // Correct order map: item.id -> correct index
  const correctOrder = useRef<Map<string, number>>(new Map())

  // Initialize / reset items on question change
  useEffect(() => {
    const q = quiz.questions[qIdx]
    correctOrder.current = new Map(q.items.map((item, i) => [item.id, i]))
    setItems(shuffle(q.items))
    setRevealed(false)
    setTimeLeft(QUESTION_TIME)
    setDragIdx(null)
    setDragOffset(0)
  }, [qIdx, quiz])

  // Slide-in animation on question change
  useEffect(() => {
    setSlideStyle({
      transform: 'translateX(60px)', opacity: 0,
      transition: 'none',
    })
    const raf = requestAnimationFrame(() => {
      setSlideStyle({
        transform: 'translateX(0)', opacity: 1,
        transition: 'transform 280ms ease, opacity 280ms ease',
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
      // Score on timeout: count positions that are correct
      const pts = items.reduce((sum, item, i) =>
        sum + (correctOrder.current.get(item.id) === i ? 1 : 0), 0)
      setScore(s => s + pts)
      return
    }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [revealed, timeLeft, quiz.id, qIdx, items])

  // Drag handlers
  const handleDragStart = useCallback((index: number, y: number) => {
    if (revealed) return
    setDragIdx(index)
    setDragOffset(0)
    dragStartY.current = y
    dragStartIdx.current = index
  }, [revealed])

  useEffect(() => {
    if (dragIdx === null) return

    function handleMove(clientY: number) {
      const dy = clientY - dragStartY.current
      setDragOffset(dy)

      // Reorder if dragged past threshold
      const moveBy = Math.round(dy / itemHeight)
      if (moveBy !== 0) {
        setItems(prev => {
          const newItems = [...prev]
          const fromIdx = dragStartIdx.current
          const toIdx = Math.max(0, Math.min(newItems.length - 1, fromIdx + moveBy))
          if (fromIdx !== toIdx) {
            const [moved] = newItems.splice(fromIdx, 1)
            newItems.splice(toIdx, 0, moved)
            dragStartIdx.current = toIdx
            dragStartY.current += moveBy * itemHeight
            setDragOffset(dy - moveBy * itemHeight)
          }
          return newItems
        })
      }
    }

    function handleTouchMove(e: TouchEvent) {
      e.preventDefault()
      handleMove(e.touches[0].clientY)
    }
    function handleMouseMove(e: MouseEvent) {
      handleMove(e.clientY)
    }
    function handleEnd() {
      setDragIdx(null)
      setDragOffset(0)
    }

    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleEnd)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleEnd)

    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleEnd)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleEnd)
    }
  }, [dragIdx, itemHeight])

  const handleSubmit = useCallback(() => {
    if (revealed) return
    setRevealed(true)
    const pts = items.reduce((sum, item, i) =>
      sum + (correctOrder.current.get(item.id) === i ? 1 : 0), 0)
    setScore(s => s + pts)
    track('quiz_answer', { quizId: quiz.id, qIdx, correctPositions: pts })
  }, [revealed, items, quiz.id, qIdx])

  const handleNext = useCallback(() => {
    if (isAnimating.current) return
    if (isLast) {
      const finalScore = score
      addPoints(finalScore)
      recordQuizResult(quiz.id, finalScore, total * 4)
      // Mark the flow as completed if the quiz maps to a flow
      const flowId = quiz.id as FlowId
      completeFlow(flowId)
      track('quiz_completed', { quizId: quiz.id, score: finalScore, total: total * 4 })
      navigate('/results', { state: { score: finalScore, total: total * 4, quizTitle: quiz.title } })
      return
    }

    isAnimating.current = true
    setSlideStyle({
      transform: 'translateX(-60px)', opacity: 0,
      transition: 'transform 240ms ease, opacity 240ms ease',
    })
    setTimeout(() => {
      setQIdx(i => i + 1)
      isAnimating.current = false
    }, 250)
  }, [isLast, score, quiz, total, addPoints, recordQuizResult, navigate])

  const handleBack = useCallback(() => {
    track('quiz_abandoned', { quizId: quiz.id, qIdx })
    navigate(-1)
  }, [quiz.id, qIdx, navigate])

  const questionScore = revealed
    ? items.reduce((sum, item, i) =>
        sum + (correctOrder.current.get(item.id) === i ? 1 : 0), 0)
    : 0

  return (
    <Screen>
      <div
        className="page-in"
        data-page="ranking-quiz"
        style={{
          display: 'flex', flexDirection: 'column',
          minHeight: '100%', maxWidth: 420, margin: '0 auto', width: '100%',
        }}
      >
        {/* Top bar */}
        <div className="ranking-quiz-header" data-section="header" style={{ padding: 'var(--sp-4)', flexShrink: 0 }}>
          <div className="ranking-quiz-header-row" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <button onClick={handleBack} className="btn-icon ranking-quiz-back-btn" data-ui="back-btn">
              <img className="ranking-quiz-back-icon" src={chevLeft} width={24} height={24} alt="Back" />
            </button>
            <div className="ranking-quiz-progress-track" style={{
              flex: 1, height: 4, background: 'var(--c-surface-raise)',
              borderRadius: 2, overflow: 'hidden',
            }}>
              <div className="ranking-quiz-progress-fill" style={{
                height: '100%',
                width: `${((qIdx + (revealed ? 1 : 0)) / total) * 100}%`,
                background: 'var(--c-accent)', borderRadius: 2,
                transition: 'width 300ms ease',
              }} />
            </div>
            <span className="ranking-quiz-progress-counter" style={{
              fontSize: 'var(--text-xs)', color: 'var(--c-text-2)', flexShrink: 0,
            }}>
              {qIdx + 1}/{total}
            </span>
          </div>
        </div>

        {/* Animated content */}
        <div className="ranking-quiz-animated-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', ...slideStyle, overflow: 'hidden' }}>
          {/* Timer */}
          <div className="ranking-quiz-timer-section" data-section="timer" style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-4)', flexShrink: 0 }}>
            <CircularTimer timeLeft={timeLeft} size={64} />
          </div>

          {/* Question text */}
          <div className="ranking-quiz-question-text" data-section="question" style={{
            padding: '0 var(--sp-6)',
            font: 'var(--f-brand-type-title-3)',
            fontSize: 'var(--text-xl)',
            color: 'var(--c-text-1)',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: 'var(--tracking-tight)',
            textAlign: 'center',
            marginBottom: 'var(--sp-6)',
            flexShrink: 0,
          }}>
            {question.question}
          </div>

          {/* Ranking items */}
          <div className="ranking-quiz-item-list" data-section="rank-list" style={{
            flex: 1, padding: '0 var(--sp-4)',
            display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)',
          }}>
            {items.map((item, i) => (
              <RankItem
                key={item.id}
                item={item}
                index={i}
                revealed={revealed}
                correctIndex={correctOrder.current.get(item.id) ?? 0}
                isDragging={dragIdx === i}
                dragOffset={dragIdx === i ? dragOffset : 0}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        </div>

        {/* Bottom: feedback + submit/next */}
        <div className="ranking-quiz-footer" style={{ padding: 'var(--sp-5) var(--sp-4) var(--sp-8)', flexShrink: 0 }}>
          {revealed && (
            <div className="ranking-quiz-feedback" style={{
              textAlign: 'center',
              fontSize: 'var(--text-sm)',
              color: questionScore === 4 ? 'var(--c-correct)' : questionScore >= 2 ? 'var(--c-warn)' : 'var(--c-error)',
              marginBottom: 'var(--sp-3)',
              fontWeight: 'var(--weight-med)',
              letterSpacing: 'var(--tracking-wide)',
            }}>
              {questionScore === 4
                ? '✓ Perfect order! +4 points'
                : `${questionScore}/4 correct positions`}
            </div>
          )}
          <button
            onClick={revealed ? handleNext : handleSubmit}
            data-ui="submit-btn"
            className="btn ranking-quiz-submit-btn"
            style={{
              width: '100%', padding: 'var(--sp-4) 0', borderRadius: 50,
              border: 'none',
              background: 'var(--c-white)',
              color: 'var(--c-brand)',
              font: 'var(--f-brand-type-body-medium)',
              fontSize: 'var(--text-md)',
              cursor: 'pointer',
              transition: 'background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)',
            }}
          >
            {revealed
              ? (isLast ? `Finish · ${score}/${total * 4}` : 'Next')
              : 'Lock in order'}
          </button>
        </div>
      </div>
    </Screen>
  )
}

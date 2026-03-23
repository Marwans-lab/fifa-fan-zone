import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { DRAG_DROP_QUIZZES, type DragDropQuiz, type DragDropQuestion } from '../data/dragDropQuizzes'
import chevLeft from '../assets/icons/Chevron-left-white.svg'

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Deterministic shuffle seeded by question id */
function shuffleAnswers(question: DragDropQuestion): string[] {
  const answers = question.pairs.map(p => p.answer)
  const seed = question.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const shuffled = [...answers]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = ((seed * (i + 1) * 31) % (i + 1) + i + 1) % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/** Check if a point is inside a rect */
function isInsideRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

// ─── Draggable Chip ─────────────────────────────────────────────────────────────

interface ChipProps {
  answer: string
  isDragging: boolean
  isPlaced: boolean
  isCorrect: boolean | null
  style?: React.CSSProperties
}

function Chip({ answer, isDragging, isPlaced, isCorrect, style }: ChipProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--sp-3) var(--sp-5)',
    borderRadius: 'var(--r-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-med)',
    fontFamily: 'var(--font-body)',
    color: 'var(--c-text-1)',
    background: 'var(--c-surface)',
    border: '1.5px solid var(--c-border)',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
    whiteSpace: 'nowrap',
    transition: isDragging
      ? 'none'
      : 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease, background 200ms ease, border-color 200ms ease',
    transform: isDragging ? 'scale(1.08)' : 'scale(1)',
    boxShadow: isDragging
      ? '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)'
      : '0 2px 8px rgba(0,0,0,0.2)',
    zIndex: isDragging ? 1000 : 1,
    opacity: isPlaced ? 0 : 1,
    pointerEvents: isPlaced ? 'none' : 'auto',
  }

  if (isCorrect === true) {
    baseStyle.background = 'var(--c-correct-bg)'
    baseStyle.borderColor = 'var(--c-correct)'
    baseStyle.color = 'var(--c-correct)'
    baseStyle.boxShadow = '0 0 16px var(--c-correct-glow)'
  } else if (isCorrect === false) {
    baseStyle.background = 'var(--c-error-bg)'
    baseStyle.borderColor = 'var(--c-error)'
    baseStyle.color = 'var(--c-error)'
  }

  return (
    <div style={{ ...baseStyle, ...style }}>
      {answer}
    </div>
  )
}

// ─── Drop Zone ──────────────────────────────────────────────────────────────────

interface DropZoneProps {
  prompt: string
  placedAnswer: string | null
  isCorrect: boolean | null
  isHovered: boolean
  shaking: boolean
  index: number
}

function DropZone({ prompt, placedAnswer, isCorrect, isHovered, shaking, index }: DropZoneProps) {
  const zoneStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--sp-3)',
    padding: 'var(--sp-3) var(--sp-4)',
    borderRadius: 'var(--r-lg)',
    background: isHovered
      ? 'var(--c-accent-bg)'
      : isCorrect === true
      ? 'var(--c-correct-bg)'
      : isCorrect === false
      ? 'var(--c-error-bg)'
      : 'var(--c-surface)',
    border: isHovered
      ? '1.5px dashed var(--c-accent)'
      : isCorrect === true
      ? '1.5px solid var(--c-correct-border)'
      : isCorrect === false
      ? '1.5px solid var(--c-error-border)'
      : '1.5px dashed var(--c-border)',
    transition: 'background 200ms ease, border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease',
    transform: shaking ? '' : isHovered ? 'scale(1.02)' : 'scale(1)',
    boxShadow: isCorrect === true
      ? '0 0 20px var(--c-correct-glow)'
      : isHovered
      ? '0 0 16px var(--c-accent-glow)'
      : 'none',
    animation: shaking ? 'shake 400ms ease' : `dropZoneIn 400ms cubic-bezier(0.16, 1, 0.3, 1) ${index * 60}ms both`,
    minHeight: 'var(--sp-12)',
  }

  const promptStyle: React.CSSProperties = {
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--weight-med)',
    color: 'var(--c-text-1)',
    fontFamily: 'var(--font-body)',
    minWidth: 90,
    flexShrink: 0,
  }

  const slotStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--sp-2) var(--sp-3)',
    borderRadius: 'var(--r-full)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-med)',
    fontFamily: 'var(--font-body)',
    minHeight: 'var(--sp-9)',
    background: placedAnswer
      ? isCorrect === true
        ? 'var(--c-correct-bg)'
        : isCorrect === false
        ? 'var(--c-error-bg)'
        : 'var(--c-surface-raise)'
      : 'var(--c-surface-faint)',
    border: placedAnswer
      ? 'none'
      : '1px dashed var(--c-text-3)',
    color: placedAnswer
      ? isCorrect === true
        ? 'var(--c-correct)'
        : isCorrect === false
        ? 'var(--c-error)'
        : 'var(--c-text-1)'
      : 'var(--c-text-3)',
    transition: 'background 200ms ease, color 200ms ease, border-color 200ms ease',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  return (
    <div style={zoneStyle}>
      <span style={promptStyle}>{prompt}</span>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          {/* Arrow indicator */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
            <path d="M3 8h10M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={slotStyle}>
            {placedAnswer || '???'}
          </div>
        </div>
      </div>
      {/* Correct/incorrect indicator */}
      {isCorrect !== null && (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-2xs)',
            fontWeight: 'var(--weight-bold)',
            background: isCorrect ? 'var(--c-correct)' : 'var(--c-error)',
            color: 'var(--c-white)',
            flexShrink: 0,
            animation: 'popIn 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {isCorrect ? '✓' : '✗'}
        </div>
      )}
    </div>
  )
}

// ─── Injected keyframes ─────────────────────────────────────────────────────────

const KEYFRAMES_ID = 'drag-drop-quiz-keyframes'

function ensureKeyframes() {
  if (document.getElementById(KEYFRAMES_ID)) return
  const style = document.createElement('style')
  style.id = KEYFRAMES_ID
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      15% { transform: translateX(-6px) rotate(-1deg); }
      30% { transform: translateX(5px) rotate(1deg); }
      45% { transform: translateX(-4px); }
      60% { transform: translateX(3px); }
      75% { transform: translateX(-2px); }
    }
    @keyframes popIn {
      0% { transform: scale(0); opacity: 0; }
      60% { transform: scale(1.2); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes dropZoneIn {
      0% { opacity: 0; transform: translateY(12px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes chipIn {
      0% { opacity: 0; transform: translateY(16px) scale(0.9); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes slideOutLeft {
      to { opacity: 0; transform: translateX(-60px); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(60px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 8px var(--c-correct-glow); }
      50% { box-shadow: 0 0 24px var(--c-correct-glow); }
    }
    @keyframes successBounce {
      0% { transform: scale(1); }
      30% { transform: scale(1.04); }
      60% { transform: scale(0.98); }
      100% { transform: scale(1); }
    }
    @keyframes scoreCountUp {
      0% { transform: scale(1); }
      50% { transform: scale(1.3); color: var(--c-correct); }
      100% { transform: scale(1); }
    }
  `
  document.head.appendChild(style)
}

// ─── Question Screen ────────────────────────────────────────────────────────────

interface QuestionViewProps {
  quiz: DragDropQuiz
  question: DragDropQuestion
  qIndex: number
  total: number
  score: number
  onComplete: (correctCount: number) => void
  onBack: () => void
  slideClass: string
}

function QuestionView({
  quiz,
  question,
  qIndex,
  total,
  score,
  onComplete,
  onBack,
  slideClass,
}: QuestionViewProps) {
  const [placements, setPlacements] = useState<Record<string, string | null>>({})
  const [results, setResults] = useState<Record<string, boolean | null>>({})
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)
  const [shakingZone, setShakingZone] = useState<string | null>(null)
  const [draggedAnswer, setDraggedAnswer] = useState<string | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [shuffledAnswers] = useState(() => shuffleAnswers(question))
  const [allCorrect, setAllCorrect] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const dropZoneRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const chipRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize placements
  useEffect(() => {
    const init: Record<string, string | null> = {}
    const initResults: Record<string, boolean | null> = {}
    question.pairs.forEach(p => {
      init[p.id] = null
      initResults[p.id] = null
    })
    setPlacements(init)
    setResults(initResults)
    setAllCorrect(false)
    setCorrectCount(0)
  }, [question])

  const placedAnswers = Object.values(placements).filter(Boolean) as string[]

  // Find which drop zone the pointer is over
  const findHoveredZone = useCallback((clientX: number, clientY: number): string | null => {
    for (const pair of question.pairs) {
      const el = dropZoneRefs.current[pair.id]
      if (el) {
        const rect = el.getBoundingClientRect()
        if (isInsideRect(clientX, clientY, rect)) return pair.id
      }
    }
    return null
  }, [question.pairs])

  // Handle dropping an answer on a zone
  const handleDrop = useCallback((pairId: string, answer: string) => {
    const pair = question.pairs.find(p => p.id === pairId)
    if (!pair) return
    if (placements[pairId] !== null) return // already filled

    const isMatch = pair.answer === answer

    setPlacements(prev => ({ ...prev, [pairId]: answer }))
    setResults(prev => ({ ...prev, [pairId]: isMatch }))

    if (isMatch) {
      setCorrectCount(c => c + 1)
      track('drag_drop_correct', { quizId: quiz.id, questionId: question.id, pairId })
    } else {
      // Shake and then clear after delay
      setShakingZone(pairId)
      track('drag_drop_incorrect', { quizId: quiz.id, questionId: question.id, pairId })
      setTimeout(() => {
        setShakingZone(null)
        setPlacements(prev => ({ ...prev, [pairId]: null }))
        setResults(prev => ({ ...prev, [pairId]: null }))
      }, 600)
    }
  }, [placements, question, quiz.id])

  // Check if all are correct
  useEffect(() => {
    const allFilled = question.pairs.every(p => results[p.id] === true)
    if (allFilled && question.pairs.length > 0) {
      setAllCorrect(true)
    }
  }, [results, question.pairs])

  // ── Touch / mouse drag handlers ────────────────────────────────────────────

  const startDrag = useCallback((answer: string, clientX: number, clientY: number) => {
    const chipEl = chipRefs.current[answer]
    if (!chipEl) return
    const rect = chipEl.getBoundingClientRect()
    setDragOffset({ x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 })
    setDraggedAnswer(answer)
    setDragPos({ x: clientX, y: clientY })
  }, [])

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!draggedAnswer) return
    setDragPos({ x: clientX, y: clientY })
    setHoveredZone(findHoveredZone(clientX, clientY))
  }, [draggedAnswer, findHoveredZone])

  const endDrag = useCallback(() => {
    if (!draggedAnswer || !dragPos) {
      setDraggedAnswer(null)
      setDragPos(null)
      setHoveredZone(null)
      return
    }

    const zone = findHoveredZone(dragPos.x, dragPos.y)
    if (zone && placements[zone] === null) {
      handleDrop(zone, draggedAnswer)
    }

    setDraggedAnswer(null)
    setDragPos(null)
    setHoveredZone(null)
  }, [draggedAnswer, dragPos, findHoveredZone, placements, handleDrop])

  // Touch handlers
  const onTouchStart = useCallback((answer: string) => (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    startDrag(answer, touch.clientX, touch.clientY)
  }, [startDrag])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    moveDrag(touch.clientX, touch.clientY)
  }, [moveDrag])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    endDrag()
  }, [endDrag])

  // Mouse handlers
  const onMouseDown = useCallback((answer: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    startDrag(answer, e.clientX, e.clientY)
  }, [startDrag])

  useEffect(() => {
    if (!draggedAnswer) return

    const handleMouseMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY)
    const handleMouseUp = () => endDrag()

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggedAnswer, moveDrag, endDrag])

  // Available (not yet placed correctly) answers
  const availableAnswers = shuffledAnswers.filter(a => {
    // An answer is available if it's not correctly placed anywhere
    const correctlyPlaced = question.pairs.some(
      p => placements[p.id] === a && results[p.id] === true
    )
    return !correctlyPlaced
  })

  return (
    <div
      ref={containerRef}
      className={slideClass}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
      }}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Question header area */}
      <div
        style={{
          position: 'relative',
          margin: '0 var(--sp-4)',
          padding: 'var(--sp-6) var(--sp-5)',
          borderRadius: 'var(--r-lg)',
          background: question.accentColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--sp-5)',
          flexShrink: 0,
          overflow: 'hidden',
          boxShadow: `0 8px 32px ${question.accentColor}55, inset 0 1px 0 rgba(255,255,255,0.15)`,
        }}
      >
        <span style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--sp-2)' }}>{quiz.emoji}</span>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-light)',
            color: 'var(--c-text-1)',
            textAlign: 'center',
            lineHeight: 'var(--leading-snug)',
            letterSpacing: 'var(--tracking-tight)',
          }}
        >
          {question.title}
        </div>
        {/* Depth overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(0,0,0,0.18) 100%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Drop zones */}
      <div
        style={{
          flex: 1,
          padding: '0 var(--sp-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-3)',
        }}
      >
        {question.pairs.map((pair, i) => (
          <div
            key={pair.id}
            ref={el => { dropZoneRefs.current[pair.id] = el }}
            aria-label={`Drop zone for ${pair.prompt}`}
          >
            <DropZone
              prompt={pair.prompt}
              placedAnswer={placements[pair.id] ?? null}
              isCorrect={results[pair.id] ?? null}
              isHovered={hoveredZone === pair.id && !placements[pair.id]}
              shaking={shakingZone === pair.id}
              index={i}
            />
          </div>
        ))}
      </div>

      {/* Draggable chips tray */}
      <div
        style={{
          padding: 'var(--sp-5) var(--sp-4) var(--sp-4)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 'var(--text-2xs)',
            fontWeight: 'var(--weight-med)',
            color: 'var(--c-text-3)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            marginBottom: 'var(--sp-3)',
            textAlign: 'center',
          }}
        >
          {allCorrect ? '' : 'Drag answers to match'}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--sp-2)',
            justifyContent: 'center',
            minHeight: 'var(--sp-12)',
          }}
        >
          {availableAnswers.map((answer, i) => {
            const isBeingDragged = draggedAnswer === answer
            return (
              <div
                key={answer}
                ref={el => { chipRefs.current[answer] = el }}
                role="button"
                tabIndex={0}
                aria-label={`Drag answer: ${answer}`}
                onTouchStart={onTouchStart(answer)}
                onMouseDown={onMouseDown(answer)}
                style={{
                  animation: `chipIn 400ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 50}ms both`,
                  opacity: isBeingDragged ? 0.3 : 1,
                  transition: 'opacity 150ms ease',
                }}
              >
                <Chip
                  answer={answer}
                  isDragging={false}
                  isPlaced={false}
                  isCorrect={null}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating drag ghost */}
      {draggedAnswer && dragPos && (
        <div
          style={{
            position: 'fixed',
            left: dragPos.x - dragOffset.x,
            top: dragPos.y - dragOffset.y,
            transform: 'translate(-50%, -50%) scale(1.08)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          <Chip
            answer={draggedAnswer}
            isDragging={true}
            isPlaced={false}
            isCorrect={null}
          />
        </div>
      )}

      {/* All correct overlay & next button */}
      <div style={{ padding: '0 var(--sp-4) var(--sp-8)', flexShrink: 0 }}>
        {allCorrect && (
          <div
            style={{
              textAlign: 'center',
              fontSize: 'var(--text-sm)',
              color: 'var(--c-correct)',
              marginBottom: 'var(--sp-3)',
              fontWeight: 'var(--weight-med)',
              letterSpacing: 'var(--tracking-wide)',
              animation: 'popIn 300ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            ✓ Perfect match!
          </div>
        )}
        <button
          onClick={() => onComplete(correctCount)}
          disabled={!allCorrect}
          className="btn"
          style={{
            width: '100%',
            padding: 'var(--sp-4) 0',
            borderRadius: 'var(--r-full)',
            border: 'none',
            background: allCorrect ? 'var(--c-white)' : 'var(--c-surface-raise)',
            color: allCorrect ? 'var(--c-brand)' : 'var(--c-text-3)',
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--weight-med)',
            cursor: allCorrect ? 'pointer' : 'default',
            fontFamily: 'inherit',
            transition: 'background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)',
            animation: allCorrect ? 'successBounce 400ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          }}
        >
          {qIndex === total - 1 && allCorrect
            ? `Finish · ${score + question.pairs.length}/${total * question.pairs.length}`
            : 'Next'}
        </button>
      </div>
    </div>
  )
}

// ─── Main route ─────────────────────────────────────────────────────────────────

export default function DragDropQuizRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addPoints, recordQuizResult } = useStore()

  const quizId = (location.state as { quizId?: string } | null)?.quizId
  const quizIdx = quizId ? DRAG_DROP_QUIZZES.findIndex(q => q.id === quizId) : 0
  const resolvedIdx = quizIdx >= 0 ? quizIdx : 0

  const [qIdx, setQIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [slideClass, setSlideClass] = useState('page-in')
  const isAnimating = useRef(false)

  const quiz = DRAG_DROP_QUIZZES[resolvedIdx]
  const question = quiz?.questions[qIdx]
  const total = quiz?.questions.length ?? 0

  useEffect(() => {
    ensureKeyframes()
  }, [])

  const handleComplete = useCallback((correctCount: number) => {
    if (isAnimating.current) return
    const newScore = score + correctCount
    const isLast = qIdx === total - 1

    if (isLast) {
      addPoints(newScore)
      recordQuizResult(quiz.id, newScore, total * (question?.pairs.length ?? 4))
      track('drag_drop_quiz_completed', { quizId: quiz.id, score: newScore, total: total * (question?.pairs.length ?? 4) })
      navigate('/results', {
        state: {
          score: newScore,
          total: total * (question?.pairs.length ?? 4),
          quizTitle: quiz.title,
        },
      })
      return
    }

    // Slide transition
    isAnimating.current = true
    setSlideClass('')
    // Force a reflow so removing the class takes effect
    requestAnimationFrame(() => {
      setSlideClass('slide-out-left')
      setTimeout(() => {
        setScore(newScore)
        setQIdx(i => i + 1)
        setSlideClass('slide-in-right')
        isAnimating.current = false
      }, 280)
    })
  }, [qIdx, score, total, quiz, question, addPoints, recordQuizResult, navigate])

  const handleBack = useCallback(() => {
    track('drag_drop_quiz_abandoned', { quizId: quiz?.id, qIdx })
    navigate(-1)
  }, [quiz?.id, qIdx, navigate])

  if (!quiz || !question) return null

  // Inject slide animation styles
  const slideStyleMap: Record<string, React.CSSProperties> = {
    '': {},
    'page-in': {},
    'slide-out-left': {
      animation: 'slideOutLeft 280ms ease forwards',
    },
    'slide-in-right': {
      animation: 'slideInRight 280ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
    },
  }

  return (
    <Screen>
      <div
        className={slideClass === 'page-in' ? 'page-in' : ''}
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          maxWidth: 420,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Top bar */}
        <div style={{ padding: 'var(--sp-4)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <button onClick={handleBack} className="btn-icon" aria-label="Go back">
              <img src={chevLeft} width={24} height={24} alt="" />
            </button>
            <div style={{ flex: 1, height: 4, background: 'var(--c-surface-raise)', borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${((qIdx + 1) / total) * 100}%`,
                  background: 'var(--c-accent)',
                  borderRadius: 2,
                  transition: 'width 300ms ease',
                }}
              />
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-2)', flexShrink: 0 }}>
              {qIdx + 1}/{total}
            </span>
          </div>
        </div>

        {/* Animated question content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...slideStyleMap[slideClass] }}>
          <QuestionView
            key={qIdx}
            quiz={quiz}
            question={question}
            qIndex={qIdx}
            total={total}
            score={score}
            onComplete={handleComplete}
            onBack={handleBack}
            slideClass=""
          />
        </div>
      </div>
    </Screen>
  )
}

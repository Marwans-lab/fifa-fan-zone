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
    padding: 'var(--f-brand-space-sm) var(--f-brand-space-md)',
    borderRadius: 'var(--f-brand-radius-rounded)',
    font: 'var(--f-brand-type-caption-medium)',
    fontSize: '13',
    color: 'var(--f-brand-color-text-default)',
    background: 'var(--f-brand-color-background-light)',
    border: '1.5px solid var(--f-brand-color-border-default)',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
    whiteSpace: 'nowrap',
    transition: isDragging
      ? 'none'
      : 'transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-entry), box-shadow var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-entry), opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
    transform: isDragging ? 'scale(1.08)' : 'scale(1)',
    boxShadow: isDragging
      ? '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)'
      : '0 2px 8px rgba(0,0,0,0.2)',
    zIndex: isDragging ? 1000 : 1,
    opacity: isPlaced ? 0 : 1,
    pointerEvents: isPlaced ? 'none' : 'auto',
  }

  if (isCorrect === true) {
    baseStyle.background = 'var(--f-brand-color-background-success-accent)'
    baseStyle.borderColor = 'var(--f-brand-color-border-success)'
    baseStyle.color = 'var(--f-brand-color-border-success)'
    baseStyle.boxShadow = '0 0 16px var(--f-brand-color-border-success)'
  } else if (isCorrect === false) {
    baseStyle.background = 'var(--f-brand-color-background-error)'
    baseStyle.borderColor = 'var(--f-brand-color-status-error)'
    baseStyle.color = 'var(--f-brand-color-status-error)'
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
    gap: 'var(--f-brand-space-sm)',
    padding: 'var(--f-brand-space-sm) var(--f-brand-space-md)',
    borderRadius: 'var(--f-brand-radius-inner)',
    background: isHovered
      ? 'var(--f-brand-color-background-accent)'
      : isCorrect === true
      ? 'var(--f-brand-color-background-success-accent)'
      : isCorrect === false
      ? 'var(--f-brand-color-background-error)'
      : 'var(--f-brand-color-background-light)',
    border: isHovered
      ? '1.5px dashed var(--f-brand-color-accent)'
      : isCorrect === true
      ? '1.5px solid var(--f-brand-color-border-success)'
      : isCorrect === false
      ? '1.5px solid var(--f-brand-color-border-error)'
      : '1.5px dashed var(--f-brand-color-border-default)',
    transition: 'background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), box-shadow var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
    transform: shaking ? '' : isHovered ? 'scale(1.02)' : 'scale(1)',
    boxShadow: isCorrect === true
      ? '0 0 20px var(--f-brand-color-border-success)'
      : isHovered
      ? '0 0 16px var(--f-brand-color-border-accent)'
      : 'none',
    animation: shaking ? 'shake var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default)' : `dropZoneIn var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-entry) ${index * 60}ms both`,
    minHeight: 'var(--f-brand-space-3xl)',
  }

  const promptStyle: React.CSSProperties = {
    font: 'var(--f-brand-type-body-medium)',
    fontSize: '15',
    color: 'var(--f-brand-color-text-default)',
    minWidth: 90,
    flexShrink: 0,
  }

  const slotStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--f-brand-space-xs) var(--f-brand-space-sm)',
    borderRadius: 'var(--f-brand-radius-rounded)',
    font: 'var(--f-brand-type-caption-medium)',
    fontSize: '13',
    minHeight: '36px',
    background: placedAnswer
      ? isCorrect === true
        ? 'var(--f-brand-color-background-success-accent)'
        : isCorrect === false
        ? 'var(--f-brand-color-background-error)'
        : 'var(--f-brand-color-background-light)'
      : 'rgba(255,255,255,0.04)',
    border: placedAnswer
      ? 'none'
      : '1px dashed var(--f-brand-color-text-muted)',
    color: placedAnswer
      ? isCorrect === true
        ? 'var(--f-brand-color-border-success)'
        : isCorrect === false
        ? 'var(--f-brand-color-status-error)'
        : 'var(--f-brand-color-text-default)'
      : 'var(--f-brand-color-text-muted)',
    transition: 'background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  return (
    <div style={zoneStyle}>
      <span style={promptStyle}>{prompt}</span>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--f-brand-space-xs)' }}>
          {/* Arrow indicator */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ opacity: 0.3, flexShrink: 0 }}>
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
            fontSize: '10',
            fontWeight: '600',
            background: isCorrect ? 'var(--f-brand-color-border-success)' : 'var(--f-brand-color-status-error)',
            color: 'var(--f-brand-color-text-light)',
            flexShrink: 0,
            animation: 'popIn var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-entry)',
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
      0%, 100% { box-shadow: 0 0 8px var(--f-brand-color-border-success); }
      50% { box-shadow: 0 0 24px var(--f-brand-color-border-success); }
    }
    @keyframes successBounce {
      0% { transform: scale(1); }
      30% { transform: scale(1.04); }
      60% { transform: scale(0.98); }
      100% { transform: scale(1); }
    }
    @keyframes scoreCountUp {
      0% { transform: scale(1); }
      50% { transform: scale(1.3); color: var(--f-brand-color-border-success); }
      100% { transform: scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
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
          margin: '0 var(--f-brand-space-md)',
          padding: 'var(--f-brand-space-lg) var(--f-brand-space-md)',
          borderRadius: 'var(--f-brand-radius-inner)',
          background: question.accentColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--f-brand-space-md)',
          flexShrink: 0,
          overflow: 'hidden',
          boxShadow: `0 8px 32px ${question.accentColor}55, inset 0 1px 0 rgba(255,255,255,0.15)`,
        }}
      >
        <span style={{ fontSize: '40', marginBottom: 'var(--f-brand-space-xs)' }}>{quiz.emoji}</span>
        <div
          style={{
            font: 'var(--f-brand-type-title-5)',
            fontSize: '18',
            color: 'var(--f-brand-color-text-default)',
            textAlign: 'center',
            lineHeight: '1.28',
            letterSpacing: '-0.03em',
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
          padding: '0 var(--f-brand-space-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--f-brand-space-sm)',
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
          padding: 'var(--f-brand-space-md) var(--f-brand-space-md) var(--f-brand-space-md)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: '10',
            fontWeight: '500',
            color: 'var(--f-brand-color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            marginBottom: 'var(--f-brand-space-sm)',
            textAlign: 'center',
          }}
        >
          {allCorrect ? '' : 'Drag answers to match'}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--f-brand-space-xs)',
            justifyContent: 'center',
            minHeight: 'var(--f-brand-space-3xl)',
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
                  animation: `chipIn var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-entry) ${i * 50}ms both`,
                  opacity: isBeingDragged ? 0.3 : 1,
                  transition: 'opacity var(--f-brand-motion-duration-fast) var(--f-brand-motion-easing-default)',
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
      <div style={{ padding: '0 var(--f-brand-space-md) var(--f-brand-space-xl)', flexShrink: 0 }}>
        {allCorrect && (
          <div
            style={{
              textAlign: 'center',
              fontSize: '13',
              color: 'var(--f-brand-color-border-success)',
              marginBottom: 'var(--f-brand-space-sm)',
              fontWeight: '500',
              letterSpacing: '0.05em',
              animation: 'popIn var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-entry)',
            }}
          >
            ✓ Perfect match!
          </div>
        )}
        <button
          onClick={() => onComplete(correctCount)}
          disabled={!allCorrect}
          className="f-button"
          style={{
            width: '100%',
            padding: 'var(--f-brand-space-md) 0',
            borderRadius: 'var(--f-brand-radius-rounded)',
            border: 'none',
            background: allCorrect ? 'var(--f-brand-color-text-light)' : 'var(--f-brand-color-background-light)',
            color: allCorrect ? 'var(--f-brand-color-primary)' : 'var(--f-brand-color-text-muted)',
            font: 'var(--f-brand-type-body-medium)',
            fontSize: '15',
            cursor: allCorrect ? 'pointer' : 'default',
            transition: 'background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit), color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
            animation: allCorrect ? 'successBounce var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-entry)' : 'none',
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
      animation: 'slideOutLeft var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default) forwards',
    },
    'slide-in-right': {
      animation: 'slideInRight var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-entry) forwards',
    },
  }

  return (
    <Screen>
      <div
        className={slideClass === 'page-in' ? 'f-page-enter' : ''}
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
        <div style={{ padding: 'var(--f-brand-space-md)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--f-brand-space-sm)' }}>
            <button onClick={handleBack} className="f-button f-button--ghost" aria-label="Go back">
              <img src={chevLeft} width={24} height={24} alt="" />
            </button>
            <div style={{ flex: 1, height: 4, background: 'var(--f-brand-color-background-light)', borderRadius: 'var(--f-brand-radius-rounded)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${((qIdx + 1) / total) * 100}%`,
                  background: 'var(--f-brand-color-accent)',
                  borderRadius: 'var(--f-brand-radius-rounded)',
                  transition: 'width var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
                }}
              />
            </div>
            <span style={{ fontSize: '11', color: 'var(--f-brand-color-text-subtle)', flexShrink: 0 }}>
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

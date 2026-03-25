import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { DRAG_DROP_QUIZZES, type DragDropQuiz, type DragDropQuestion } from '../data/dragDropQuizzes'
import './DragDropQuiz.css'

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
  isCorrect: boolean | null
}

function Chip({ answer, isDragging, isCorrect }: ChipProps) {
  const classes = [
    'f-drag-chip',
    isDragging && 'f-drag-chip--dragging',
    isCorrect === true && 'f-drag-chip--correct',
    isCorrect === false && 'f-drag-chip--incorrect',
  ].filter(Boolean).join(' ')

  return <div className={classes}>{answer}</div>
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
  const promptClasses = [
    'f-drag-prompt',
    isHovered && 'f-drag-prompt--hovered',
    isCorrect === true && 'f-drag-prompt--correct',
    isCorrect === false && 'f-drag-prompt--incorrect',
    shaking && 'f-drag-prompt--shaking',
  ].filter(Boolean).join(' ')

  const slotClasses = [
    'f-drag-prompt__slot',
    placedAnswer && 'f-drag-prompt__slot--filled',
    isCorrect === true && 'f-drag-prompt__slot--correct',
    isCorrect === false && 'f-drag-prompt__slot--incorrect',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={promptClasses}
      style={{ animation: shaking ? undefined : `f-drag-zone-in 400ms var(--f-brand-motion-ease-out) ${index * 60}ms both` }}
    >
      <span className="f-drag-prompt__label">{prompt}</span>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
            <path d="M3 8h10M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className={slotClasses}>
            {placedAnswer || '???'}
          </div>
        </div>
      </div>
      {isCorrect !== null && (
        <div className={`f-drag-prompt__indicator ${isCorrect ? 'f-drag-prompt__indicator--correct' : 'f-drag-prompt__indicator--incorrect'}`}>
          {isCorrect ? '✓' : '✗'}
        </div>
      )}
    </div>
  )
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
}

function QuestionView({
  quiz,
  question,
  qIndex,
  total,
  score,
  onComplete,
  onBack,
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

  const handleDrop = useCallback((pairId: string, answer: string) => {
    const pair = question.pairs.find(p => p.id === pairId)
    if (!pair) return
    if (placements[pairId] !== null) return

    const isMatch = pair.answer === answer

    setPlacements(prev => ({ ...prev, [pairId]: answer }))
    setResults(prev => ({ ...prev, [pairId]: isMatch }))

    if (isMatch) {
      setCorrectCount(c => c + 1)
      track('drag_drop_correct', { quizId: quiz.id, questionId: question.id, pairId })
    } else {
      setShakingZone(pairId)
      track('drag_drop_incorrect', { quizId: quiz.id, questionId: question.id, pairId })
      setTimeout(() => {
        setShakingZone(null)
        setPlacements(prev => ({ ...prev, [pairId]: null }))
        setResults(prev => ({ ...prev, [pairId]: null }))
      }, 600)
    }
  }, [placements, question, quiz.id])

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

  const availableAnswers = shuffledAnswers.filter(a => {
    const correctlyPlaced = question.pairs.some(
      p => placements[p.id] === a && results[p.id] === true
    )
    return !correctlyPlaced
  })

  return (
    <div
      ref={containerRef}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Question header */}
      <div
        className="f-drag-header"
        style={{
          background: question.accentColor,
          boxShadow: `0 8px 32px ${question.accentColor}55, inset 0 1px 0 rgba(255,255,255,0.15)`,
        }}
      >
        <span className="f-drag-header__emoji">{quiz.emoji}</span>
        <div className="f-drag-header__title">{question.title}</div>
        <div className="f-drag-header__overlay" />
      </div>

      {/* Drop zones */}
      <div style={{ flex: 1, padding: '0 var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
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
      <div className="f-drag-tray">
        <div className="f-drag-tray__label">
          {allCorrect ? '' : 'Drag answers to match'}
        </div>
        <div className="f-drag-tray__pool">
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
                  animation: `f-drag-chip-in 400ms var(--f-brand-motion-ease-out) ${i * 50}ms both`,
                  opacity: isBeingDragged ? 0.3 : 1,
                  transition: 'opacity 150ms ease',
                }}
              >
                <Chip answer={answer} isDragging={false} isCorrect={null} />
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
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          <Chip answer={draggedAnswer} isDragging={true} isCorrect={null} />
        </div>
      )}

      {/* Footer */}
      <div className="f-drag-footer">
        {allCorrect && (
          <div className="f-drag-footer__success">✓ Perfect match!</div>
        )}
        <button
          onClick={() => onComplete(correctCount)}
          disabled={!allCorrect}
          className={`f-drag-footer__btn ${allCorrect ? 'f-drag-footer__btn--ready' : 'f-drag-footer__btn--disabled'}`}
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

    isAnimating.current = true
    setSlideClass('')
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

  const slideStyleMap: Record<string, React.CSSProperties> = {
    '': {},
    'page-in': {},
    'slide-out-left': {
      animation: 'f-drag-slide-out-left 280ms ease forwards',
    },
    'slide-in-right': {
      animation: 'f-drag-slide-in-right 280ms var(--f-brand-motion-ease-out) forwards',
    },
  }

  return (
    <Screen>
      <div
        className={`f-drag-page ${slideClass === 'page-in' ? 'page-in' : ''}`}
      >
        {/* Top bar */}
        <div className="f-drag-topbar">
          <button onClick={handleBack} className="f-drag-topbar__back" aria-label="Go back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18.5C14.87 18.5 14.74 18.45 14.65 18.35L8.65 12.35C8.55 12.26 8.5 12.13 8.5 12C8.5 11.87 8.55 11.74 8.65 11.65L14.65 5.65C14.84 5.46 15.16 5.46 15.35 5.65C15.54 5.84 15.54 6.16 15.35 6.35L9.71 12L15.35 17.65C15.54 17.84 15.54 18.16 15.35 18.35C15.26 18.45 15.13 18.5 15 18.5Z"
                fill="var(--f-brand-color-text-default)"
              />
            </svg>
          </button>
          <div className="f-drag-topbar__track">
            <div
              className="f-drag-topbar__progress"
              style={{ width: `${((qIdx + 1) / total) * 100}%` }}
            />
          </div>
          <span className="f-drag-topbar__count">{qIdx + 1}/{total}</span>
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
          />
        </div>
      </div>
    </Screen>
  )
}

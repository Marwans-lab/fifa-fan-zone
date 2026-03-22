import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { SWIPE_QUIZZES, type SwipeQuestion } from '../data/swipeQuizzes'
import chevLeft from '../assets/icons/Chevron-left-white.svg'

const CARD_WIDTH = 320
const SWIPE_THRESHOLD = 80
const FLY_DISTANCE = 600
const QUESTION_TIME = 12

// ─── Circular countdown timer ─────────────────────────────────────────────────
function CircularTimer({ timeLeft, total, size = 48 }: { timeLeft: number; total: number; size?: number }) {
  const R = (size - 6) / 2
  const circumference = 2 * Math.PI * R
  const offset = circumference * (1 - timeLeft / total)
  const cx = size / 2
  const isLow = timeLeft <= 3

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={3} />
        <circle
          cx={cx} cy={cx} r={R}
          fill="none"
          stroke={isLow ? 'var(--c-error)' : 'var(--c-accent)'}
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 300ms ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--text-md)', fontWeight: 'var(--weight-med)',
        fontFamily: 'var(--font-body)',
        color: isLow ? 'var(--c-error)' : 'var(--c-text-1)',
        transition: 'color 300ms ease',
      }}>
        {timeLeft}
      </div>
    </div>
  )
}

// ─── Swipe indicator labels ───────────────────────────────────────────────────
function SwipeLabel({
  side,
  opacity,
}: {
  side: 'left' | 'right'
  opacity: number
}) {
  const isRight = side === 'right'
  return (
    <div style={{
      position: 'absolute',
      top: 24,
      ...(isRight ? { left: 24 } : { right: 24 }),
      padding: '6px 16px',
      borderRadius: 'var(--r-sm)',
      border: `2.5px solid ${isRight ? 'var(--c-correct)' : 'var(--c-error)'}`,
      color: isRight ? 'var(--c-correct)' : 'var(--c-error)',
      fontSize: 'var(--text-lg)',
      fontWeight: 'var(--weight-bold)',
      fontFamily: 'var(--font-body)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase' as const,
      opacity: Math.min(opacity, 1),
      transform: `rotate(${isRight ? -12 : 12}deg) scale(${0.8 + opacity * 0.2})`,
      transition: 'opacity 60ms ease, transform 60ms ease',
      pointerEvents: 'none' as const,
      zIndex: 10,
    }}>
      {isRight ? 'TRUE' : 'FALSE'}
    </div>
  )
}

// ─── Result feedback overlay ──────────────────────────────────────────────────
function ResultOverlay({
  visible,
  correct,
  explanation,
}: {
  visible: boolean
  correct: boolean
  explanation: string
}) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp-8)',
      background: correct
        ? 'rgba(52,219,128,0.12)'
        : 'rgba(217,87,87,0.12)',
      borderRadius: 'var(--r-xl)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'scale(1)' : 'scale(0.9)',
      transition: 'opacity 300ms ease, transform 300ms ease',
      pointerEvents: 'none',
      zIndex: 20,
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: correct ? 'var(--c-correct)' : 'var(--c-error)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 32,
        marginBottom: 'var(--sp-4)',
        boxShadow: `0 0 32px ${correct ? 'rgba(52,219,128,0.4)' : 'rgba(217,87,87,0.4)'}`,
      }}>
        {correct ? '✓' : '✗'}
      </div>
      <div style={{
        fontSize: 'var(--text-lg)',
        fontWeight: 'var(--weight-bold)',
        color: correct ? 'var(--c-correct)' : 'var(--c-error)',
        marginBottom: 'var(--sp-2)',
        fontFamily: 'var(--font-display)',
      }}>
        {correct ? 'Correct!' : 'Wrong!'}
      </div>
      <div style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--c-text-2)',
        textAlign: 'center',
        lineHeight: 'var(--leading-normal)',
        maxWidth: 260,
      }}>
        {explanation}
      </div>
    </div>
  )
}

// ─── Single swipe card ────────────────────────────────────────────────────────
interface SwipeCardProps {
  question: SwipeQuestion
  isTop: boolean
  stackIndex: number
  dragX: number
  dragY: number
  isDragging: boolean
  flyDirection: 'left' | 'right' | null
  showResult: boolean
  answeredCorrectly: boolean | null
}

function SwipeCard({
  question,
  isTop,
  stackIndex,
  dragX,
  dragY,
  isDragging,
  flyDirection,
  showResult,
  answeredCorrectly,
}: SwipeCardProps) {
  const rotation = isTop ? dragX * 0.08 : 0
  const rightOpacity = isTop ? Math.max(0, dragX / SWIPE_THRESHOLD) : 0
  const leftOpacity = isTop ? Math.max(0, -dragX / SWIPE_THRESHOLD) : 0

  // Stack offset for cards behind the top card
  const stackScale = 1 - stackIndex * 0.05
  const stackY = stackIndex * 8

  // Fly-off animation
  let flyTransform = ''
  if (flyDirection) {
    const dir = flyDirection === 'right' ? 1 : -1
    flyTransform = `translateX(${dir * FLY_DISTANCE}px) rotate(${dir * 30}deg)`
  }

  const transform = flyDirection
    ? flyTransform
    : isTop
      ? `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotation}deg)`
      : `translateY(${stackY}px) scale(${stackScale})`

  const transition = isDragging && isTop
    ? 'none'
    : flyDirection
      ? 'transform 400ms var(--ease-out), opacity 400ms var(--ease-out)'
      : 'transform 500ms var(--ease-out), opacity 300ms ease'

  return (
    <div
      style={{
        position: 'absolute',
        width: CARD_WIDTH,
        maxWidth: 'calc(100vw - 48px)',
        aspectRatio: '3 / 4',
        borderRadius: 'var(--r-xl)',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        boxShadow: isTop
          ? `var(--shadow-lg), 0 0 60px ${question.accentColor}33`
          : 'var(--shadow-sm)',
        transform,
        transition,
        opacity: flyDirection ? 0 : 1,
        zIndex: 10 - stackIndex,
        cursor: isTop ? 'grab' : 'default',
        userSelect: 'none',
        touchAction: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Accent gradient background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at top, ${question.accentColor}66 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Card content */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 'var(--sp-8) var(--sp-6)',
        zIndex: 1,
      }}>
        {/* Emoji */}
        <div style={{
          fontSize: 56,
          marginBottom: 'var(--sp-6)',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
        }}>
          {question.emoji}
        </div>

        {/* Statement */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--weight-light)',
          color: 'var(--c-text-1)',
          textAlign: 'center',
          lineHeight: 'var(--leading-snug)',
          letterSpacing: 'var(--tracking-tight)',
          maxWidth: 280,
        }}>
          {question.statement}
        </div>

        {/* Hint label at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-6)',
          fontSize: 'var(--text-xs)',
          color: 'var(--c-text-3)',
          letterSpacing: 'var(--tracking-wide)',
        }}>
          <span style={{ color: 'var(--c-error)' }}>← FALSE</span>
          <span style={{ color: 'var(--c-correct)' }}>TRUE →</span>
        </div>
      </div>

      {/* Swipe labels */}
      {isTop && <SwipeLabel side="right" opacity={rightOpacity} />}
      {isTop && <SwipeLabel side="left" opacity={leftOpacity} />}

      {/* Result overlay */}
      {showResult && answeredCorrectly !== null && (
        <ResultOverlay
          visible={showResult}
          correct={answeredCorrectly}
          explanation={question.explanation}
        />
      )}

      {/* Edge glow on drag */}
      {isTop && (rightOpacity > 0 || leftOpacity > 0) && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'var(--r-xl)',
          border: `2px solid ${rightOpacity > leftOpacity ? 'var(--c-correct)' : 'var(--c-error)'}`,
          opacity: Math.max(rightOpacity, leftOpacity) * 0.6,
          transition: 'opacity 60ms ease',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  )
}

// ─── Score pip ─────────────────────────────────────────────────────────────────
function ScorePip({ correct, animate }: { correct: boolean; animate: boolean }) {
  return (
    <div style={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: correct ? 'var(--c-correct)' : 'var(--c-error)',
      transform: animate ? 'scale(1)' : 'scale(0)',
      transition: 'transform 300ms var(--ease-out)',
      boxShadow: correct
        ? '0 0 8px rgba(52,219,128,0.5)'
        : '0 0 8px rgba(217,87,87,0.5)',
    }} />
  )
}

// ─── Main SwipeQuiz route ─────────────────────────────────────────────────────
export default function SwipeQuizRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addPoints, recordQuizResult } = useStore()

  const swipeQuizId = (location.state as { swipeQuizId?: string } | null)?.swipeQuizId
  const quizIdx = swipeQuizId ? SWIPE_QUIZZES.findIndex(q => q.id === swipeQuizId) : 0
  const resolvedIdx = quizIdx >= 0 ? quizIdx : 0
  const quiz = SWIPE_QUIZZES[resolvedIdx]
  const total = quiz.questions.length

  // State
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [flyDirection, setFlyDirection] = useState<'left' | 'right' | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const dragStartRef = useRef({ x: 0, y: 0 })
  const cardAreaRef = useRef<HTMLDivElement>(null)

  const currentQuestion = quiz.questions[currentIndex]
  const isFinished = currentIndex >= total

  // ── Timer ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isFinished || showResult || isTransitioning) return
    if (timeLeft <= 0) {
      handleAnswer(null)
      return
    }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isFinished, showResult, isTransitioning])

  // ── Answer handler ───────────────────────────────────────────────────────────
  const handleAnswer = useCallback((swipedRight: boolean | null) => {
    if (isTransitioning || showResult || isFinished) return
    setIsTransitioning(true)

    const question = quiz.questions[currentIndex]
    let correct = false
    let direction: 'left' | 'right'

    if (swipedRight === null) {
      // Timeout — always wrong
      correct = false
      direction = 'left'
    } else {
      correct = swipedRight === question.isTrue
      direction = swipedRight ? 'right' : 'left'
    }

    setAnsweredCorrectly(correct)
    setShowResult(true)
    if (correct) setScore(s => s + 1)

    track('swipe_quiz_answer', {
      quizId: quiz.id,
      questionId: question.id,
      swipedRight,
      correct,
      qIdx: currentIndex,
    })

    // Show result briefly, then fly card off
    setTimeout(() => {
      setFlyDirection(direction)
      setResults(prev => [...prev, correct])

      // After fly animation, advance to next
      setTimeout(() => {
        const nextIndex = currentIndex + 1
        setCurrentIndex(nextIndex)
        setDragX(0)
        setDragY(0)
        setFlyDirection(null)
        setShowResult(false)
        setAnsweredCorrectly(null)
        setTimeLeft(QUESTION_TIME)
        setIsTransitioning(false)

        // If that was the last question, navigate to results
        if (nextIndex >= total) {
          const finalScore = correct ? score + 1 : score
          addPoints(finalScore)
          recordQuizResult(quiz.id, finalScore, total)
          track('swipe_quiz_completed', { quizId: quiz.id, score: finalScore, total })
          navigate('/results', {
            state: { score: finalScore, total, quizTitle: quiz.title },
          })
        }
      }, 350)
    }, 800)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isTransitioning, showResult, isFinished, quiz, score, total, addPoints, recordQuizResult, navigate])

  // ── Touch / Pointer events ───────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isTransitioning || showResult || isFinished) return
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [isTransitioning, showResult, isFinished])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = (e.clientY - dragStartRef.current.y) * 0.3
    setDragX(dx)
    setDragY(dy)
  }, [isDragging])

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    if (Math.abs(dragX) >= SWIPE_THRESHOLD) {
      const swipedRight = dragX > 0
      handleAnswer(swipedRight)
    } else {
      // Snap back
      setDragX(0)
      setDragY(0)
    }
  }, [isDragging, dragX, handleAnswer])

  // ── Button swipe handlers ────────────────────────────────────────────────────
  const handleButtonFalse = useCallback(() => {
    if (isTransitioning || showResult || isFinished) return
    setDragX(-SWIPE_THRESHOLD - 20)
    setTimeout(() => handleAnswer(false), 100)
  }, [isTransitioning, showResult, isFinished, handleAnswer])

  const handleButtonTrue = useCallback(() => {
    if (isTransitioning || showResult || isFinished) return
    setDragX(SWIPE_THRESHOLD + 20)
    setTimeout(() => handleAnswer(true), 100)
  }, [isTransitioning, showResult, isFinished, handleAnswer])

  const handleBack = useCallback(() => {
    track('swipe_quiz_abandoned', { quizId: quiz.id, qIdx: currentIndex })
    navigate(-1)
  }, [quiz.id, currentIndex, navigate])

  // Cards to render (current + next 2 for stack effect)
  const visibleCards: { question: SwipeQuestion; stackIndex: number }[] = []
  for (let i = 0; i < 3 && currentIndex + i < total; i++) {
    visibleCards.push({
      question: quiz.questions[currentIndex + i],
      stackIndex: i,
    })
  }

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
        {/* ── Top bar ─────────────────────────────────────────── */}
        <div style={{ padding: 'var(--sp-4)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <button onClick={handleBack} className="btn-icon">
              <img src={chevLeft} width={24} height={24} alt="Back" />
            </button>
            <div style={{
              flex: 1, height: 4,
              background: 'var(--c-surface-raise)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(currentIndex / total) * 100}%`,
                background: 'var(--c-accent)',
                borderRadius: 2,
                transition: 'width 400ms var(--ease-out)',
              }} />
            </div>
            <span style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--c-text-2)',
              flexShrink: 0,
            }}>
              {Math.min(currentIndex + 1, total)}/{total}
            </span>
          </div>
        </div>

        {/* ── Quiz title + timer ──────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--sp-4) var(--sp-3)',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-light)',
              color: 'var(--c-text-1)',
              letterSpacing: 'var(--tracking-tight)',
            }}>
              {quiz.title}
            </div>
            <div style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--c-text-3)',
              marginTop: 2,
            }}>
              Swipe right for TRUE, left for FALSE
            </div>
          </div>
          {!isFinished && (
            <CircularTimer timeLeft={timeLeft} total={QUESTION_TIME} />
          )}
        </div>

        {/* ── Card stack area ──────────────────────────────────── */}
        <div
          ref={cardAreaRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: 'var(--sp-4)',
            minHeight: 400,
          }}
        >
          {/* Render cards in reverse order so top card is last (highest z-index) */}
          {[...visibleCards].reverse().map(({ question, stackIndex }) => (
            <SwipeCard
              key={question.id}
              question={question}
              isTop={stackIndex === 0}
              stackIndex={stackIndex}
              dragX={stackIndex === 0 ? dragX : 0}
              dragY={stackIndex === 0 ? dragY : 0}
              isDragging={stackIndex === 0 && isDragging}
              flyDirection={stackIndex === 0 ? flyDirection : null}
              showResult={stackIndex === 0 && showResult}
              answeredCorrectly={stackIndex === 0 ? answeredCorrectly : null}
            />
          ))}

          {/* Background swipe direction indicators */}
          <div style={{
            position: 'absolute',
            left: 'var(--sp-4)',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: isDragging && dragX < -20 ? Math.min(-dragX / SWIPE_THRESHOLD, 1) * 0.4 : 0,
            transition: isDragging ? 'none' : 'opacity 300ms ease',
            fontSize: 48,
            pointerEvents: 'none',
          }}>
            ✗
          </div>
          <div style={{
            position: 'absolute',
            right: 'var(--sp-4)',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: isDragging && dragX > 20 ? Math.min(dragX / SWIPE_THRESHOLD, 1) * 0.4 : 0,
            transition: isDragging ? 'none' : 'opacity 300ms ease',
            fontSize: 48,
            pointerEvents: 'none',
          }}>
            ✓
          </div>
        </div>

        {/* ── Score pips ──────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--sp-2)',
          padding: 'var(--sp-2) 0',
        }}>
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: i < results.length
                  ? undefined
                  : 'var(--c-surface-raise)',
                transition: 'background 300ms ease',
              }}
            >
              {i < results.length && (
                <ScorePip correct={results[i]} animate />
              )}
            </div>
          ))}
        </div>

        {/* ── Bottom action buttons ───────────────────────────── */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--sp-8)',
          padding: 'var(--sp-4) var(--sp-6) var(--sp-8)',
        }}>
          {/* False button */}
          <button
            onClick={handleButtonFalse}
            disabled={isTransitioning || showResult || isFinished}
            className="btn"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: '2px solid var(--c-error)',
              background: 'rgba(217,87,87,0.1)',
              color: 'var(--c-error)',
              fontSize: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isTransitioning || isFinished ? 'default' : 'pointer',
              transition: 'transform 200ms var(--ease-out), background 200ms ease, box-shadow 200ms ease',
              boxShadow: '0 0 20px rgba(217,87,87,0.15)',
            }}
            aria-label="False"
          >
            ✗
          </button>

          {/* Score display */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}>
            <div style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--weight-bold)',
              fontFamily: 'var(--font-display)',
              color: 'var(--c-text-1)',
              lineHeight: 1,
            }}>
              {score}
            </div>
            <div style={{
              fontSize: 'var(--text-2xs)',
              color: 'var(--c-text-3)',
              letterSpacing: 'var(--tracking-wider)',
              textTransform: 'uppercase',
            }}>
              POINTS
            </div>
          </div>

          {/* True button */}
          <button
            onClick={handleButtonTrue}
            disabled={isTransitioning || showResult || isFinished}
            className="btn"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: '2px solid var(--c-correct)',
              background: 'rgba(52,219,128,0.1)',
              color: 'var(--c-correct)',
              fontSize: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isTransitioning || isFinished ? 'default' : 'pointer',
              transition: 'transform 200ms var(--ease-out), background 200ms ease, box-shadow 200ms ease',
              boxShadow: '0 0 20px rgba(52,219,128,0.15)',
            }}
            aria-label="True"
          >
            ✓
          </button>
        </div>
      </div>
    </Screen>
  )
}

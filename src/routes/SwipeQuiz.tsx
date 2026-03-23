import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { SWIPE_QUIZZES, type SwipeStatement } from '../data/swipeQuizzes'
import chevLeft from '../assets/icons/Chevron-left-white.svg'

const QUESTION_TIME = 12
const SWIPE_THRESHOLD = 80
const ROTATION_FACTOR = 0.12
const CARD_EXIT_DURATION = 360
const CARD_ENTER_DURATION = 400

// ─── Swipe direction type ────────────────────────────────────────────────────
type SwipeDir = 'left' | 'right' | null

// ─── Circular countdown timer ────────────────────────────────────────────────
function CircularTimer({ timeLeft, total, size = 52 }: { timeLeft: number; total: number; size?: number }) {
  const R = (size - 6) / 2
  const circumference = 2 * Math.PI * R
  const offset = circumference * (1 - timeLeft / total)
  const cx = size / 2
  const urgentColor = timeLeft <= 3 ? 'var(--c-error)' : 'var(--c-accent)'

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={R} fill="none" stroke="var(--c-surface-raise)" strokeWidth={3} />
        <circle
          cx={cx} cy={cx} r={R}
          fill="none"
          stroke={urgentColor}
          strokeWidth={3}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--text-md)', fontWeight: 'var(--weight-med)',
        fontFamily: 'var(--font-body)',
        color: urgentColor,
        transition: 'color 0.3s ease',
      }}>
        {timeLeft}
      </div>
    </div>
  )
}

// ─── Swipe indicator arrows ──────────────────────────────────────────────────
function SwipeHint({ direction, opacity }: { direction: 'left' | 'right'; opacity: number }) {
  const isRight = direction === 'right'
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      [isRight ? 'right' : 'left']: -60,
      transform: 'translateY(-50%)',
      opacity: Math.min(opacity, 0.9),
      transition: 'opacity 0.1s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      pointerEvents: 'none',
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 'var(--r-full)',
        background: isRight ? 'var(--c-correct-bg)' : 'var(--c-error-bg)',
        border: `2px solid ${isRight ? 'var(--c-correct-border)' : 'var(--c-error-border)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'var(--text-xl)',
        fontWeight: 'var(--weight-bold)',
        color: isRight ? 'var(--c-correct)' : 'var(--c-error)',
      }}>
        {isRight ? '✓' : '✗'}
      </div>
      <span style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-med)',
        color: isRight ? 'var(--c-correct)' : 'var(--c-error)',
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
      }}>
        {isRight ? 'TRUE' : 'FALSE'}
      </span>
    </div>
  )
}

// ─── Result feedback overlay on card ─────────────────────────────────────────
function CardOverlay({ direction, opacity }: { direction: SwipeDir; opacity: number }) {
  if (!direction || opacity <= 0) return null
  const isRight = direction === 'right'
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      borderRadius: 'var(--r-xl)',
      background: isRight
        ? `rgba(52,219,128,${0.12 * opacity})`
        : `rgba(217,87,87,${0.12 * opacity})`,
      border: `2px solid ${isRight
        ? `rgba(52,219,128,${0.4 * opacity})`
        : `rgba(217,87,87,${0.4 * opacity})`}`,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: isRight ? 'flex-end' : 'flex-start',
      padding: 'var(--sp-5)',
      pointerEvents: 'none',
      transition: 'background 0.08s ease, border-color 0.08s ease',
      zIndex: 10,
    }}>
      <div style={{
        padding: 'var(--sp-2) var(--sp-4)',
        borderRadius: 'var(--r-full)',
        border: `2px solid ${isRight ? 'var(--c-correct)' : 'var(--c-error)'}`,
        color: isRight ? 'var(--c-correct)' : 'var(--c-error)',
        fontSize: 'var(--text-lg)',
        fontWeight: 'var(--weight-bold)',
        letterSpacing: 'var(--tracking-wide)',
        transform: `rotate(${isRight ? -15 : 15}deg)`,
        opacity: Math.min(opacity * 1.5, 1),
      }}>
        {isRight ? 'TRUE' : 'FALSE'}
      </div>
    </div>
  )
}

// ─── Score particle burst ────────────────────────────────────────────────────
function ScoreBurst({ correct, key: k }: { correct: boolean; key: string }) {
  return (
    <div
      key={k}
      style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 'var(--text-3xl)',
        fontWeight: 'var(--weight-bold)',
        color: correct ? 'var(--c-correct)' : 'var(--c-error)',
        animation: 'swipe-burst 600ms var(--ease-out) forwards',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      {correct ? '+1' : '0'}
    </div>
  )
}

// ─── The swipeable card ──────────────────────────────────────────────────────
interface SwipeCardProps {
  statement: SwipeStatement
  index: number
  total: number
  quizEmoji: string
  dragX: number
  isDragging: boolean
  isExiting: boolean
  exitDir: SwipeDir
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: () => void
  onMouseDown: (e: React.MouseEvent) => void
}

function SwipeCard({
  statement, index, total, quizEmoji,
  dragX, isDragging, isExiting, exitDir,
  onTouchStart, onTouchMove, onTouchEnd, onMouseDown,
}: SwipeCardProps) {
  const rotation = dragX * ROTATION_FACTOR
  const swipeProgress = Math.abs(dragX) / SWIPE_THRESHOLD
  const activeDir: SwipeDir = dragX > 20 ? 'right' : dragX < -20 ? 'left' : null

  const cardStyle: React.CSSProperties = isExiting
    ? {
        transform: `translateX(${exitDir === 'right' ? 400 : -400}px) rotate(${exitDir === 'right' ? 25 : -25}deg)`,
        opacity: 0,
        transition: `transform ${CARD_EXIT_DURATION}ms var(--ease-out), opacity ${CARD_EXIT_DURATION}ms var(--ease-out)`,
      }
    : {
        transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
        opacity: 1,
        transition: isDragging ? 'none' : `transform ${CARD_ENTER_DURATION}ms var(--ease-out), opacity ${CARD_ENTER_DURATION}ms var(--ease-out)`,
      }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        inset: 0,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        ...cardStyle,
      }}
    >
      {/* Card body */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 'var(--r-xl)',
        background: 'var(--c-surface)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--sp-8)',
        overflow: 'hidden',
      }}>
        {/* Overlay for swipe direction */}
        <CardOverlay direction={activeDir} opacity={swipeProgress} />

        {/* Card number indicator */}
        <div style={{
          position: 'absolute',
          top: 'var(--sp-5)',
          left: 'var(--sp-5)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-med)',
          color: 'var(--c-text-2)',
          letterSpacing: 'var(--tracking-wide)',
          textTransform: 'uppercase',
        }}>
          {index + 1} / {total}
        </div>

        {/* Emoji / category badge */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 'var(--r-full)',
          background: `${statement.accentColor}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          marginBottom: 'var(--sp-6)',
          boxShadow: `0 4px 24px ${statement.accentColor}44`,
        }}>
          {quizEmoji}
        </div>

        {/* Statement text */}
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--weight-light)',
          color: 'var(--c-text-1)',
          lineHeight: 'var(--leading-snug)',
          letterSpacing: 'var(--tracking-tight)',
          textAlign: 'center',
          margin: 0,
          maxWidth: 280,
        }}>
          {statement.statement}
        </p>

        {/* Swipe instruction hint */}
        <div style={{
          position: 'absolute',
          bottom: 'var(--sp-6)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-4)',
          opacity: isDragging ? 0 : 0.4,
          transition: 'opacity 0.3s ease',
        }}>
          <span style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--c-error)',
            fontWeight: 'var(--weight-med)',
            letterSpacing: 'var(--tracking-wide)',
          }}>
            ← FALSE
          </span>
          <div style={{
            width: 40,
            height: 2,
            borderRadius: 1,
            background: 'var(--c-text-3)',
          }} />
          <span style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--c-correct)',
            fontWeight: 'var(--weight-med)',
            letterSpacing: 'var(--tracking-wide)',
          }}>
            TRUE →
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Result card (shown after answer) ────────────────────────────────────────
function ResultCard({ statement, wasCorrect, onNext }: {
  statement: SwipeStatement
  wasCorrect: boolean
  onNext: () => void
}) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp-8)',
      opacity: show ? 1 : 0,
      transform: show ? 'scale(1)' : 'scale(0.92)',
      transition: `opacity ${CARD_ENTER_DURATION}ms var(--ease-out), transform ${CARD_ENTER_DURATION}ms var(--ease-out)`,
    }}>
      {/* Result icon */}
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 'var(--r-full)',
        background: wasCorrect ? 'var(--c-correct-bg)' : 'var(--c-error-bg)',
        border: `2px solid ${wasCorrect ? 'var(--c-correct-border)' : 'var(--c-error-border)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'var(--text-2xl)',
        color: wasCorrect ? 'var(--c-correct)' : 'var(--c-error)',
        marginBottom: 'var(--sp-5)',
        boxShadow: wasCorrect
          ? '0 0 32px var(--c-correct-glow)'
          : '0 0 32px var(--c-error-glow)',
      }}>
        {wasCorrect ? '✓' : '✗'}
      </div>

      {/* Result label */}
      <div style={{
        fontSize: 'var(--text-lg)',
        fontWeight: 'var(--weight-bold)',
        color: wasCorrect ? 'var(--c-correct)' : 'var(--c-error)',
        marginBottom: 'var(--sp-3)',
        letterSpacing: 'var(--tracking-wide)',
      }}>
        {wasCorrect ? 'Correct!' : 'Wrong!'}
      </div>

      {/* The answer */}
      <div style={{
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-med)',
        color: 'var(--c-text-2)',
        marginBottom: 'var(--sp-4)',
        textAlign: 'center',
      }}>
        The answer is <span style={{
          color: statement.isTrue ? 'var(--c-correct)' : 'var(--c-error)',
          fontWeight: 'var(--weight-bold)',
        }}>
          {statement.isTrue ? 'TRUE' : 'FALSE'}
        </span>
      </div>

      {/* Explanation */}
      <p style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--c-text-2)',
        lineHeight: 'var(--leading-normal)',
        textAlign: 'center',
        margin: `0 0 var(--sp-6)`,
        maxWidth: 260,
      }}>
        {statement.explanation}
      </p>

      {/* Next button */}
      <button
        onClick={onNext}
        className="btn"
        style={{
          padding: 'var(--sp-3) var(--sp-8)',
          borderRadius: 'var(--r-full)',
          border: 'none',
          background: '#ffffff',
          color: 'var(--c-brand)',
          fontSize: 'var(--text-md)',
          fontWeight: 'var(--weight-med)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: `background var(--dur-base) var(--ease-out)`,
        }}
      >
        Next
      </button>
    </div>
  )
}

// ─── Main SwipeQuiz route ────────────────────────────────────────────────────
export default function SwipeQuizRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addPoints, recordQuizResult } = useStore()

  const quizId = (location.state as { quizId?: string } | null)?.quizId
  const quizIdx = quizId ? SWIPE_QUIZZES.findIndex(q => q.id === quizId) : 0
  const resolvedIdx = quizIdx >= 0 ? quizIdx : 0
  const quiz = SWIPE_QUIZZES[resolvedIdx]
  const total = quiz.statements.length

  // Core state
  const [qIdx, setQIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [phase, setPhase] = useState<'swipe' | 'result'>('swipe')
  const [lastCorrect, setLastCorrect] = useState(false)

  // Drag state
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [exitDir, setExitDir] = useState<SwipeDir>(null)

  // Burst animation key
  const [burstKey, setBurstKey] = useState('')

  // Refs
  const startX = useRef(0)
  const isAnimating = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const statement = quiz.statements[qIdx]

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'swipe') return
    if (timeLeft <= 0) {
      handleSwipeComplete(null)
      return
    }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft])

  // ── Process swipe result ─────────────────────────────────────────────────
  const handleSwipeComplete = useCallback((dir: SwipeDir) => {
    if (isAnimating.current) return
    isAnimating.current = true

    const userSaidTrue = dir === 'right'
    const correct = dir !== null && userSaidTrue === statement.isTrue
    if (correct) setScore(s => s + 1)
    setLastCorrect(correct)
    setBurstKey(`${qIdx}-${Date.now()}`)

    track('swipe_quiz_answer', {
      quizId: quiz.id,
      qIdx,
      direction: dir,
      correct,
      timeLeft,
    })

    // Exit animation
    if (dir) {
      setExitDir(dir)
      setIsExiting(true)
    }

    setTimeout(() => {
      setPhase('result')
      setIsExiting(false)
      setDragX(0)
      isAnimating.current = false
    }, dir ? CARD_EXIT_DURATION : 200)
  }, [statement, qIdx, quiz.id, timeLeft])

  // ── Advance to next question ─────────────────────────────────────────────
  const handleNext = useCallback(() => {
    const isLast = qIdx === total - 1
    if (isLast) {
      setScore(finalScore => {
        addPoints(finalScore)
        recordQuizResult(quiz.id, finalScore, total)
        track('swipe_quiz_completed', { quizId: quiz.id, score: finalScore, total })
        navigate('/results', { state: { score: finalScore, total, quizTitle: quiz.title } })
        return finalScore
      })
      return
    }

    setQIdx(i => i + 1)
    setTimeLeft(QUESTION_TIME)
    setPhase('swipe')
    setExitDir(null)
    setDragX(0)
  }, [qIdx, total, quiz, addPoints, recordQuizResult, navigate])

  // ── Touch handlers ───────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (phase !== 'swipe' || isAnimating.current) return
    startX.current = e.touches[0].clientX
    setIsDragging(true)
  }, [phase])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    const dx = e.touches[0].clientX - startX.current
    setDragX(dx)
  }, [isDragging])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    if (Math.abs(dragX) >= SWIPE_THRESHOLD) {
      handleSwipeComplete(dragX > 0 ? 'right' : 'left')
    } else {
      // Snap back
      setDragX(0)
    }
  }, [isDragging, dragX, handleSwipeComplete])

  // ── Mouse handlers (desktop support) ─────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (phase !== 'swipe' || isAnimating.current) return
    startX.current = e.clientX
    setIsDragging(true)

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX.current
      setDragX(dx)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [phase])

  // Handle mouse up swipe completion
  useEffect(() => {
    if (isDragging || phase !== 'swipe') return
    if (Math.abs(dragX) >= SWIPE_THRESHOLD) {
      handleSwipeComplete(dragX > 0 ? 'right' : 'left')
    } else if (dragX !== 0) {
      setDragX(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging])

  // ── Button handlers for accessibility ────────────────────────────────────
  const handleFalseBtn = useCallback(() => {
    if (phase !== 'swipe' || isAnimating.current) return
    setDragX(-SWIPE_THRESHOLD - 40)
    setTimeout(() => handleSwipeComplete('left'), 100)
  }, [phase, handleSwipeComplete])

  const handleTrueBtn = useCallback(() => {
    if (phase !== 'swipe' || isAnimating.current) return
    setDragX(SWIPE_THRESHOLD + 40)
    setTimeout(() => handleSwipeComplete('right'), 100)
  }, [phase, handleSwipeComplete])

  const handleBack = useCallback(() => {
    track('swipe_quiz_abandoned', { quizId: quiz.id, qIdx })
    navigate(-1)
  }, [quiz.id, qIdx, navigate])

  // Progress
  const progress = useMemo(
    () => ((qIdx + (phase === 'result' ? 1 : 0)) / total) * 100,
    [qIdx, phase, total],
  )

  // Swipe hint opacity
  const hintOpacity = Math.abs(dragX) / SWIPE_THRESHOLD

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
        {/* ── Top bar ─────────────────────────────────────────────── */}
        <div style={{ padding: 'var(--sp-4)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <button onClick={handleBack} className="btn-icon" aria-label="Go back">
              <img src={chevLeft} width={24} height={24} alt="" />
            </button>
            <div style={{
              flex: 1, height: 4,
              background: 'var(--c-surface-raise)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'var(--c-accent)',
                borderRadius: 2,
                transition: 'width 300ms ease',
              }} />
            </div>
            <span style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--c-text-2)',
              flexShrink: 0,
            }}>
              {qIdx + 1}/{total}
            </span>
          </div>
        </div>

        {/* ── Score + Timer row ────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--sp-5)',
          marginBottom: 'var(--sp-4)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sp-2)',
          }}>
            <span style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--weight-bold)',
              fontFamily: 'var(--font-display)',
              color: 'var(--c-text-1)',
            }}>
              {score}
            </span>
            <span style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--c-text-2)',
              fontWeight: 'var(--weight-med)',
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
            }}>
              pts
            </span>
          </div>
          {phase === 'swipe' && (
            <CircularTimer timeLeft={timeLeft} total={QUESTION_TIME} />
          )}
        </div>

        {/* ── Card area ───────────────────────────────────────────── */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            position: 'relative',
            margin: '0 var(--sp-4)',
            marginBottom: 'var(--sp-4)',
            minHeight: 340,
          }}
        >
          {/* Swipe direction hints */}
          {phase === 'swipe' && isDragging && (
            <>
              {dragX < -20 && <SwipeHint direction="left" opacity={hintOpacity} />}
              {dragX > 20 && <SwipeHint direction="right" opacity={hintOpacity} />}
            </>
          )}

          {/* Score burst animation */}
          {burstKey && phase === 'result' && (
            <ScoreBurst correct={lastCorrect} key={burstKey} />
          )}

          {/* The swipeable card */}
          {phase === 'swipe' && (
            <SwipeCard
              statement={statement}
              index={qIdx}
              total={total}
              quizEmoji={quiz.emoji}
              dragX={dragX}
              isDragging={isDragging}
              isExiting={isExiting}
              exitDir={exitDir}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
            />
          )}

          {/* Result feedback */}
          {phase === 'result' && (
            <ResultCard
              statement={statement}
              wasCorrect={lastCorrect}
              onNext={handleNext}
            />
          )}
        </div>

        {/* ── Bottom action buttons ───────────────────────────────── */}
        {phase === 'swipe' && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--sp-8)',
            padding: '0 var(--sp-4) var(--sp-8)',
            flexShrink: 0,
          }}>
            {/* False button */}
            <button
              onClick={handleFalseBtn}
              aria-label="Mark as false"
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--r-full)',
                border: '2px solid var(--c-error-border)',
                background: 'var(--c-error-bg)',
                color: 'var(--c-error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-2xl)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: `transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)`,
                boxShadow: '0 4px 20px var(--c-error-glow)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.1)'
                e.currentTarget.style.boxShadow = '0 6px 28px var(--c-error-glow)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 20px var(--c-error-glow)'
              }}
            >
              ✗
            </button>

            {/* True button */}
            <button
              onClick={handleTrueBtn}
              aria-label="Mark as true"
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--r-full)',
                border: '2px solid var(--c-correct-border)',
                background: 'var(--c-correct-bg)',
                color: 'var(--c-correct)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-2xl)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: `transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)`,
                boxShadow: '0 4px 20px var(--c-correct-glow)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.1)'
                e.currentTarget.style.boxShadow = '0 6px 28px var(--c-correct-glow)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 20px var(--c-correct-glow)'
              }}
            >
              ✓
            </button>
          </div>
        )}
      </div>

      {/* ── Keyframe for burst animation ──────────────────────────── */}
      <style>{`
        @keyframes swipe-burst {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -80%) scale(1.4);
          }
        }
      `}</style>
    </Screen>
  )
}

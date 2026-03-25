import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { WORLD_CUP_TEAMS } from '../data/teams'
import { CARD_MATCH_QUIZZES, type CardMatchRound } from '../data/cardMatchQuizzes'

// ─── Types ──────────────────────────────────────────────────────────────────────

interface MatchCard {
  id: string
  pairId: string
  type: 'flag' | 'name' | 'prompt' | 'answer'
  display: string
  teamColors: [string, string]
}

type CardStatus = 'hidden' | 'flipped' | 'matched' | 'mismatched'

// ─── Constants ──────────────────────────────────────────────────────────────────

const PAIR_COUNT = 3
const CARD_COUNT = PAIR_COUNT * 2
const FLIP_DURATION = 400
const MISMATCH_DELAY = 800
const MATCH_DELAY = 500
const DEAL_STAGGER = 60
const ROUND_TIME = 30

// ─── Keyframe styles (injected once) ────────────────────────────────────────────

const KEYFRAMES = `
@keyframes card-shake {
  0%, 100% { transform: rotateY(180deg) translateX(0); }
  20% { transform: rotateY(180deg) translateX(-6px); }
  40% { transform: rotateY(180deg) translateX(6px); }
  60% { transform: rotateY(180deg) translateX(-4px); }
  80% { transform: rotateY(180deg) translateX(3px); }
}
@keyframes card-match-pop {
  0% { transform: rotateY(180deg) scale(1); }
  40% { transform: rotateY(180deg) scale(1.08); }
  100% { transform: rotateY(180deg) scale(1); }
}
@keyframes shimmer-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
@keyframes match-ring {
  0% { transform: scale(0.6); opacity: 1; }
  100% { transform: scale(1.8); opacity: 0; }
}
@keyframes confetti-fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
}
@keyframes stat-count-in {
  0% { transform: translateY(8px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes card-press {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}
`

// ─── Helpers ────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildDeck(): MatchCard[] {
  const teams = shuffle(WORLD_CUP_TEAMS).slice(0, PAIR_COUNT)
  const cards: MatchCard[] = []
  teams.forEach(team => {
    cards.push({
      id: `${team.id}-flag`,
      pairId: team.id,
      type: 'flag',
      display: team.flag,
      teamColors: team.colors,
    })
    cards.push({
      id: `${team.id}-name`,
      pairId: team.id,
      type: 'name',
      display: team.name,
      teamColors: team.colors,
    })
  })
  return shuffle(cards)
}

function buildQuizDeck(round: CardMatchRound): MatchCard[] {
  const cards: MatchCard[] = []
  const quizColors: [string, string] = ['#8e2157', '#5a1438']
  round.pairs.forEach(pair => {
    cards.push({
      id: `${pair.id}-prompt`,
      pairId: pair.id,
      type: 'prompt',
      display: pair.prompt,
      teamColors: quizColors,
    })
    cards.push({
      id: `${pair.id}-answer`,
      pairId: pair.id,
      type: 'answer',
      display: pair.answer,
      teamColors: quizColors,
    })
  })
  return shuffle(cards)
}

// ─── Card back with brand pattern ───────────────────────────────────────────────

function CardBack() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'var(--r-md)',
        background: 'var(--c-lt-brand)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backfaceVisibility: 'hidden',
        overflow: 'hidden',
      }}
    >
      {/* Geometric overlay pattern */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 170 160"
        style={{ position: 'absolute', inset: 0, opacity: 0.15 }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="card-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="12" fill="none" stroke="white" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="8" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="40" cy="0" r="8" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="0" cy="40" r="8" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="40" cy="40" r="8" fill="none" stroke="white" strokeWidth="0.5" />
            <path d="M20 8L20 32M8 20L32 20" stroke="white" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="170" height="160" fill="url(#card-pattern)" />
      </svg>
      {/* Shimmer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(105deg, transparent 40%, var(--c-lt-shimmer) 50%, transparent 60%)',
          animation: 'shimmer-slide 3s ease-in-out infinite',
        }}
      />
    </div>
  )
}

// ─── Match ring burst effect ────────────────────────────────────────────────────

function MatchRing() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: -8,
        borderRadius: 'var(--r-lg)',
        border: '2px solid var(--c-lt-correct-dark)',
        animation: 'match-ring 600ms var(--ease-out) forwards',
        pointerEvents: 'none',
      }}
    />
  )
}

// ─── Individual card component ──────────────────────────────────────────────────

interface GameCardProps {
  card: MatchCard
  status: CardStatus
  dealDelay: number
  onFlip: () => void
}

function GameCard({ card, status, dealDelay, onFlip }: GameCardProps) {
  const [dealt, setDealt] = useState(false)
  const [showRing, setShowRing] = useState(false)
  const isFlipped = status === 'flipped' || status === 'matched'
  const isMatched = status === 'matched'
  const isMismatched = status === 'mismatched'

  useEffect(() => {
    const t = setTimeout(() => setDealt(true), dealDelay)
    return () => clearTimeout(t)
  }, [dealDelay])

  useEffect(() => {
    if (isMatched) {
      setShowRing(true)
      const t = setTimeout(() => setShowRing(false), 600)
      return () => clearTimeout(t)
    }
  }, [isMatched])

  return (
    <button
      onClick={onFlip}
      disabled={status !== 'hidden'}
      aria-label={isFlipped ? card.display : 'Hidden card'}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '170 / 160',
        perspective: 600,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: status === 'hidden' ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
        opacity: dealt ? 1 : 0,
        transform: dealt ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.85)',
        transition: 'opacity 400ms var(--ease-out), transform 400ms var(--ease-out)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: isFlipped || isMismatched ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: `transform ${FLIP_DURATION}ms var(--ease-out)`,
          animation: isMismatched
            ? 'card-shake 500ms var(--ease-out)'
            : isMatched
            ? 'card-match-pop 400ms var(--ease-out)'
            : 'none',
        }}
      >
        {/* Back face (visible when hidden) */}
        <CardBack />

        {/* Front face (visible when flipped) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--r-md)',
            background: isMatched
              ? 'var(--c-lt-correct-bg)'
              : 'var(--c-lt-surface)',
            border: `1.5px solid ${
              isMatched
                ? 'var(--c-lt-correct-dark)'
                : isMismatched
                ? 'var(--c-error)'
                : 'var(--c-lt-border)'
            }`,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--sp-1)',
            padding: 'var(--sp-2)',
            boxShadow: isMatched
              ? '0 0 16px var(--c-lt-correct-glow)'
              : isMismatched
              ? '0 0 16px var(--c-lt-error-glow)'
              : '0 2px 8px var(--c-lt-shadow)',
            transition: 'box-shadow 300ms ease, border-color 300ms ease, background 300ms ease',
            overflow: 'hidden',
          }}
        >
          {card.type === 'flag' ? (
            <span style={{ fontSize: 'var(--text-3xl)', lineHeight: 1 }}>{card.display}</span>
          ) : card.type === 'prompt' ? (
            <span
              style={{
                fontSize: 'var(--text-2xs)',
                fontWeight: 'var(--weight-reg)',
                color: 'var(--c-lt-text-2)',
                textAlign: 'center',
                lineHeight: 'var(--leading-normal)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {card.display}
            </span>
          ) : (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-med)',
                color: 'var(--c-lt-text-1)',
                textAlign: 'center',
                lineHeight: 'var(--leading-snug)',
                letterSpacing: 'var(--tracking-snug)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {card.display}
            </span>
          )}

          {/* Match checkmark */}
          {isMatched && (
            <div
              style={{
                position: 'absolute',
                top: 'var(--sp-1)',
                right: 'var(--sp-1)',
                width: 18,
                height: 18,
                borderRadius: 'var(--r-full)',
                background: 'var(--c-lt-correct-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Match ring burst */}
      {showRing && <MatchRing />}
    </button>
  )
}

// ─── Timer ring ─────────────────────────────────────────────────────────────────

function TimerRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const size = 48
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = timeLeft / total
  const dashOffset = circumference * (1 - progress)

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--c-lt-border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--c-lt-brand)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: 'var(--weight-med)',
          fontFamily: 'var(--font-body)',
          color: 'var(--c-lt-text-1)',
        }}
      >
        {String(timeLeft).padStart(2, '0')}
      </span>
    </div>
  )
}

// ─── Animated counter ───────────────────────────────────────────────────────────

function AnimatedStat({ value, delay }: { value: string; delay: number }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      style={{
        fontSize: 'var(--text-xl)',
        fontWeight: 'var(--weight-bold)',
        color: 'var(--c-lt-brand)',
        fontFamily: 'var(--font-body)',
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 400ms var(--ease-out), transform 400ms var(--ease-out)',
      }}
    >
      {value}
    </div>
  )
}

// ─── Confetti particles ─────────────────────────────────────────────────────────

function Confetti() {
  const particles = useMemo(() => {
    const colors = ['var(--c-lt-correct-dark)', 'var(--c-lt-brand)', 'var(--c-warn)', 'var(--c-accent)']
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 600}ms`,
      duration: `${800 + Math.random() * 600}ms`,
      color: colors[i % colors.length],
      size: 4 + Math.random() * 4,
      rotation: Math.random() * 360,
    }))
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: -8,
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: p.id % 3 === 0 ? 'var(--r-full)' : 0,
            background: p.color,
            animation: `confetti-fall ${p.duration} var(--ease-out) ${p.delay} forwards`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Completion overlay ─────────────────────────────────────────────────────────

interface CompletionProps {
  moves: number
  timeLeft: number
  stars: number
  pairCount: number
  onResults: () => void
  onPlayAgain: () => void
}

function CompletionOverlay({ moves, timeLeft, stars, pairCount, onResults, onPlayAgain }: CompletionProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const label = stars === 3 ? 'Perfect!' : stars === 2 ? 'Great Job!' : 'Well Done!'
  const timeUsed = ROUND_TIME - timeLeft

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: visible ? 'var(--c-lt-overlay-heavy)' : 'transparent',
        backdropFilter: visible ? 'blur(12px)' : 'blur(0px)',
        WebkitBackdropFilter: visible ? 'blur(12px)' : 'blur(0px)',
        transition: 'background 400ms ease, backdrop-filter 400ms ease',
        padding: 'var(--sp-6)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 320,
          background: 'var(--c-lt-surface)',
          border: '1px solid var(--c-lt-border)',
          borderRadius: 'var(--r-xl)',
          padding: 'var(--sp-8) var(--sp-6)',
          textAlign: 'center',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
          transition: 'opacity 500ms var(--ease-out) 150ms, transform 500ms var(--ease-out) 150ms',
          overflow: 'hidden',
        }}
      >
        {/* Confetti burst */}
        {visible && stars >= 2 && <Confetti />}

        {/* Stars */}
        <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--sp-4)', letterSpacing: 8 }}>
          {[1, 2, 3].map(i => (
            <span
              key={i}
              style={{
                opacity: i <= stars ? 1 : 0.2,
                filter: i <= stars ? 'drop-shadow(0 0 8px var(--c-lt-star-glow))' : 'none',
                display: 'inline-block',
                transform: visible && i <= stars ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-30deg)',
                transition: `transform 500ms var(--ease-out) ${300 + i * 180}ms, opacity 300ms ease ${300 + i * 180}ms`,
              }}
            >
              ⭐
            </span>
          ))}
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--weight-light)',
            color: 'var(--c-lt-text-1)',
            marginBottom: 'var(--sp-2)',
            letterSpacing: 'var(--tracking-tight)',
          }}
        >
          {label}
        </h2>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--c-lt-text-2)',
            marginBottom: 'var(--sp-6)',
            lineHeight: 'var(--leading-normal)',
          }}
        >
          You matched all {pairCount} pairs
        </p>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--sp-6)',
            marginBottom: 'var(--sp-8)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <AnimatedStat value={String(moves)} delay={700} />
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--c-lt-text-2)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginTop: 2 }}>
              Moves
            </div>
          </div>
          <div style={{ width: 1, background: 'var(--c-lt-border)' }} />
          <div style={{ textAlign: 'center' }}>
            <AnimatedStat value={`${timeUsed}s`} delay={900} />
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--c-lt-text-2)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginTop: 2 }}>
              Time
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <button
          onClick={onResults}
          style={{
            width: '100%',
            height: 56,
            borderRadius: 32,
            border: 'none',
            background: 'var(--c-lt-brand)',
            color: 'var(--c-lt-white)',
            fontSize: 16,
            fontWeight: 'var(--weight-med)',
            fontFamily: 'inherit',
            cursor: 'pointer',
            marginBottom: 'var(--sp-3)',
          }}
        >
          View Results
        </button>
        <button
          onClick={onPlayAgain}
          style={{
            width: '100%',
            height: 56,
            borderRadius: 32,
            border: '1.5px solid var(--c-lt-border)',
            background: 'var(--c-lt-surface)',
            color: 'var(--c-lt-text-1)',
            fontSize: 16,
            fontWeight: 'var(--weight-med)',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Play Again
        </button>
      </div>
    </div>
  )
}

// ─── Main route ─────────────────────────────────────────────────────────────────

export default function CardMatch() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addPoints, recordQuizResult } = useStore()

  // Quiz mode via location.state
  const quizId = (location.state as { quizId?: string } | null)?.quizId
  const quiz = quizId ? CARD_MATCH_QUIZZES.find(q => q.id === quizId) : null
  const totalRounds = quiz ? quiz.rounds.length : 1
  const pairCount = quiz ? quiz.rounds[0].pairs.length : PAIR_COUNT

  const [currentRound, setCurrentRound] = useState(0)
  const [cumulativeScore, setCumulativeScore] = useState(0)
  const [cumulativeMoves, setCumulativeMoves] = useState(0)

  const activePairCount = quiz ? quiz.rounds[currentRound].pairs.length : PAIR_COUNT

  const [deck, setDeck] = useState<MatchCard[]>(() =>
    quiz ? buildQuizDeck(quiz.rounds[0]) : buildDeck()
  )
  const [statuses, setStatuses] = useState<Record<string, CardStatus>>(() => {
    const s: Record<string, CardStatus> = {}
    deck.forEach(c => { s[c.id] = 'hidden' })
    return s
  })
  const [flippedIds, setFlippedIds] = useState<string[]>([])
  const [moves, setMoves] = useState(0)
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [gameComplete, setGameComplete] = useState(false)
  const [started, setStarted] = useState(false)
  const [roundComplete, setRoundComplete] = useState(false)

  const lockRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedRef = useRef(false)

  // Countdown timer
  useEffect(() => {
    if (started && !gameComplete && !roundComplete) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!)
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [started, gameComplete, roundComplete])

  const calculateScore = (m: number, matched: number): number => {
    if (matched === 0) return 0
    const matchBonus = matched * 2
    const moveScore = Math.max(0, activePairCount - Math.max(0, m - activePairCount))
    const timeBonus = timeLeft >= 20 ? 2 : timeLeft >= 10 ? 1 : 0
    return matchBonus + moveScore + timeBonus
  }

  // Handle round/game completion
  const handleRoundEnd = useCallback((matched: number, m: number, tLeft: number) => {
    if (completedRef.current) return
    completedRef.current = true

    const roundScore = (() => {
      if (matched === 0) return 0
      const matchBonus = matched * 2
      const moveScore = Math.max(0, activePairCount - Math.max(0, m - activePairCount))
      const timeBonus = tLeft >= 20 ? 2 : tLeft >= 10 ? 1 : 0
      return matchBonus + moveScore + timeBonus
    })()

    const newCumulativeScore = cumulativeScore + roundScore
    const newCumulativeMoves = cumulativeMoves + m
    setCumulativeScore(newCumulativeScore)
    setCumulativeMoves(newCumulativeMoves)

    if (!quiz || currentRound >= totalRounds - 1) {
      // Final round or non-quiz mode — game is done
      setGameComplete(true)
      const finalScore = quiz ? newCumulativeScore : roundScore
      const finalTotal = quiz ? totalRounds * activePairCount : activePairCount
      addPoints(finalScore)
      recordQuizResult(quiz ? quiz.id : 'card-match', finalScore, finalTotal)
      track('card_match_completed', {
        quizId: quiz?.id ?? 'card-match',
        moves: quiz ? newCumulativeMoves : m,
        timeLeft: tLeft,
        score: finalScore,
        round: currentRound + 1,
        totalRounds,
      })
    } else {
      // More rounds to go
      setRoundComplete(true)
      track('card_match_round_completed', {
        quizId: quiz.id,
        round: currentRound + 1,
        score: roundScore,
        moves: m,
      })
    }
  }, [quiz, currentRound, totalRounds, activePairCount, cumulativeScore, cumulativeMoves, addPoints, recordQuizResult])

  // Time-up auto-complete
  useEffect(() => {
    if (timeLeft === 0 && started && !gameComplete && !roundComplete) {
      handleRoundEnd(matchedPairs, moves, 0)
    }
  }, [timeLeft, started, gameComplete, roundComplete, matchedPairs, moves, handleRoundEnd])

  // Check completion (all matched)
  useEffect(() => {
    if (matchedPairs === activePairCount && matchedPairs > 0 && !roundComplete && !gameComplete) {
      handleRoundEnd(matchedPairs, moves, timeLeft)
    }
  }, [matchedPairs, activePairCount, moves, timeLeft, roundComplete, gameComplete, handleRoundEnd])

  const getStars = (): number => {
    const totalPairs = quiz ? totalRounds * activePairCount : activePairCount
    const totalM = quiz ? cumulativeMoves : moves
    if (quiz) {
      // Stars based on overall performance across all rounds
      const ratio = cumulativeScore / (totalPairs * 2)
      if (ratio >= 0.8) return 3
      if (ratio >= 0.5) return 2
      return 1
    }
    if (matchedPairs < activePairCount) return 1
    if (totalM <= activePairCount + 2) return 3
    if (totalM <= activePairCount + 6) return 2
    return 1
  }

  const handleFlip = useCallback((cardId: string) => {
    if (lockRef.current) return
    if (statuses[cardId] !== 'hidden') return
    if (gameComplete || roundComplete) return

    if (!started) setStarted(true)

    const card = deck.find(c => c.id === cardId)
    if (!card) return

    track('card_match_flip', { cardId: card.id, pairId: card.pairId })

    const newFlipped = [...flippedIds, cardId]
    setStatuses(prev => ({ ...prev, [cardId]: 'flipped' }))
    setFlippedIds(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      lockRef.current = true

      const [firstId, secondId] = newFlipped
      const first = deck.find(c => c.id === firstId)!
      const second = deck.find(c => c.id === secondId)!

      if (first.pairId === second.pairId) {
        setTimeout(() => {
          setStatuses(prev => ({
            ...prev,
            [firstId]: 'matched',
            [secondId]: 'matched',
          }))
          setMatchedPairs(p => p + 1)
          setFlippedIds([])
          lockRef.current = false
          track('card_match_pair_found', { pairId: first.pairId })
        }, MATCH_DELAY)
      } else {
        setTimeout(() => {
          setStatuses(prev => ({
            ...prev,
            [firstId]: 'mismatched',
            [secondId]: 'mismatched',
          }))
          setTimeout(() => {
            setStatuses(prev => ({
              ...prev,
              [firstId]: 'hidden',
              [secondId]: 'hidden',
            }))
            setFlippedIds([])
            lockRef.current = false
          }, 500)
        }, MISMATCH_DELAY)
      }
    }
  }, [deck, statuses, flippedIds, started, gameComplete, roundComplete])

  const handleNextRound = useCallback(() => {
    if (!quiz) return
    const nextRound = currentRound + 1
    if (nextRound >= totalRounds) return
    const newDeck = buildQuizDeck(quiz.rounds[nextRound])
    setCurrentRound(nextRound)
    setDeck(newDeck)
    const s: Record<string, CardStatus> = {}
    newDeck.forEach(c => { s[c.id] = 'hidden' })
    setStatuses(s)
    setFlippedIds([])
    setMoves(0)
    setMatchedPairs(0)
    setTimeLeft(ROUND_TIME)
    setRoundComplete(false)
    setStarted(false)
    lockRef.current = false
    completedRef.current = false
    track('card_match_next_round', { quizId: quiz.id, round: nextRound + 1 })
  }, [quiz, currentRound, totalRounds])

  const handlePlayAgain = useCallback(() => {
    const newDeck = quiz ? buildQuizDeck(quiz.rounds[0]) : buildDeck()
    setCurrentRound(0)
    setCumulativeScore(0)
    setCumulativeMoves(0)
    setDeck(newDeck)
    const s: Record<string, CardStatus> = {}
    newDeck.forEach(c => { s[c.id] = 'hidden' })
    setStatuses(s)
    setFlippedIds([])
    setMoves(0)
    setMatchedPairs(0)
    setTimeLeft(ROUND_TIME)
    setGameComplete(false)
    setRoundComplete(false)
    setStarted(false)
    lockRef.current = false
    completedRef.current = false
    track('card_match_play_again', { quizId: quiz?.id ?? 'card-match' })
  }, [quiz])

  const handleResults = useCallback(() => {
    const finalScore = quiz ? cumulativeScore : calculateScore(moves, matchedPairs)
    const finalTotal = quiz ? totalRounds * activePairCount : activePairCount
    navigate('/results', {
      state: { score: finalScore, total: finalTotal, quizTitle: quiz?.title ?? 'Card Match' },
    })
  }, [quiz, cumulativeScore, moves, matchedPairs, navigate, totalRounds, activePairCount])

  const handleBack = useCallback(() => {
    track('card_match_abandoned', { quizId: quiz?.id ?? 'card-match', moves, timeLeft, matchedPairs })
    navigate(-1)
  }, [quiz, moves, timeLeft, matchedPairs, navigate])

  const handleNext = useCallback(() => {
    if (roundComplete && !gameComplete) {
      handleNextRound()
      return
    }
    handleResults()
  }, [roundComplete, gameComplete, handleNextRound, handleResults])

  const progressPercent = quiz
    ? ((currentRound * activePairCount + matchedPairs) / (totalRounds * activePairCount)) * 100
    : (matchedPairs / activePairCount) * 100

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--c-lt-bg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <style>{KEYFRAMES}</style>
      <div
        className="page-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          maxWidth: 420,
          margin: '0 auto',
          width: '100%',
          padding: 'var(--sp-4)',
        }}
      >
        {/* ── Back button + Progress bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)' }}>
          <button
            onClick={handleBack}
            aria-label="Go back"
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--r-full)',
              background: 'var(--c-lt-surface)',
              border: '1px solid var(--c-lt-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 2px 8px var(--c-lt-shadow)',
              padding: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18.5C14.87 18.5 14.74 18.45 14.65 18.35L8.65 12.35C8.55 12.26 8.5 12.13 8.5 12C8.5 11.87 8.55 11.74 8.65 11.65L14.65 5.65C14.84 5.46 15.16 5.46 15.35 5.65C15.54 5.84 15.54 6.16 15.35 6.35L9.71 12L15.35 17.65C15.54 17.84 15.54 18.16 15.35 18.35C15.26 18.45 15.13 18.5 15 18.5Z"
                fill="var(--c-lt-text-1)"
              />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 8,
                background: 'var(--c-lt-border)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, var(--c-accent), var(--c-lt-correct-dark))',
                  borderRadius: 4,
                  transition: 'width 400ms var(--ease-out)',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Title ── */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--weight-light)',
            color: 'var(--c-lt-text-1)',
            letterSpacing: 'var(--tracking-tight)',
            textAlign: 'center',
            marginBottom: quiz ? 'var(--sp-2)' : 'var(--sp-6)',
          }}
        >
          {quiz ? quiz.rounds[currentRound].title : 'Match the cards'}
        </h1>
        {quiz && (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--c-lt-text-2)',
              textAlign: 'center',
              marginBottom: 'var(--sp-6)',
            }}
          >
            Round {currentRound + 1} of {totalRounds}
          </p>
        )}

        {/* ── Card Grid ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: `repeat(${Math.ceil(deck.length / 2)}, auto)`,
            gap: 'var(--sp-3)',
            marginBottom: 'var(--sp-6)',
          }}
        >
          {deck.map((card, i) => (
            <GameCard
              key={card.id}
              card={card}
              status={statuses[card.id]}
              dealDelay={i * DEAL_STAGGER}
              onFlip={() => handleFlip(card.id)}
            />
          ))}
        </div>

        {/* ── Timer ring ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-6)' }}>
          <TimerRing timeLeft={timeLeft} total={ROUND_TIME} />
        </div>

        {/* ── Next button ── */}
        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={handleNext}
            style={{
              width: '100%',
              height: 56,
              borderRadius: 32,
              border: 'none',
              background: 'var(--c-lt-brand)',
              color: 'var(--c-lt-white)',
              fontSize: 16,
              fontWeight: 'var(--weight-med)',
              fontFamily: 'inherit',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Next
          </button>
        </div>
      </div>

      {/* ── Round-complete overlay (quiz mode, between rounds) ── */}
      {roundComplete && !gameComplete && quiz && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-overlay)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--c-lt-overlay-heavy)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: 'var(--sp-6)',
          }}
        >
          <div
            className="page-in"
            style={{
              width: '100%',
              maxWidth: 320,
              background: 'var(--c-lt-surface)',
              border: '1px solid var(--c-lt-border)',
              borderRadius: 'var(--r-xl)',
              padding: 'var(--sp-8) var(--sp-6)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--sp-4)' }}>
              {matchedPairs === activePairCount ? '✅' : '⏱'}
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--weight-light)',
                color: 'var(--c-lt-text-1)',
                marginBottom: 'var(--sp-2)',
                letterSpacing: 'var(--tracking-tight)',
              }}
            >
              {matchedPairs === activePairCount ? 'Round Complete!' : 'Time\'s Up!'}
            </h2>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--c-lt-text-2)',
                marginBottom: 'var(--sp-6)',
              }}
            >
              {matchedPairs}/{activePairCount} pairs matched in {moves} moves
            </p>
            <button
              onClick={handleNextRound}
              style={{
                width: '100%',
                height: 56,
                borderRadius: 32,
                border: 'none',
                background: 'var(--c-lt-brand)',
                color: 'var(--c-lt-white)',
                fontSize: 16,
                fontWeight: 'var(--weight-med)',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              Next Round
            </button>
          </div>
        </div>
      )}

      {/* ── Completion overlay ── */}
      {gameComplete && (
        <CompletionOverlay
          moves={quiz ? cumulativeMoves : moves}
          timeLeft={timeLeft}
          stars={getStars()}
          pairCount={quiz ? totalRounds * activePairCount : activePairCount}
          onResults={handleResults}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}

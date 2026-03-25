import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { CARD_MATCH_QUIZZES, CardMatchPair } from '../data/cardMatchQuizzes'

// ─── Types ──────────────────────────────────────────────────────────────────────

interface MatchCard {
  id: string
  pairId: string
  type: 'clue' | 'answer'
  display: string
}

type CardStatus = 'hidden' | 'flipped' | 'matched' | 'mismatched'

// ─── Constants ──────────────────────────────────────────────────────────────────

const FLIP_DURATION = 400
const MISMATCH_DELAY = 800
const MATCH_DELAY = 500
const DEAL_STAGGER = 60
const ROUND_TIME = 45

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

function buildDeckFromPairs(pairs: CardMatchPair[]): MatchCard[] {
  const cards: MatchCard[] = []
  pairs.forEach(pair => {
    cards.push({
      id: `${pair.id}-clue`,
      pairId: pair.id,
      type: 'clue',
      display: pair.clue,
    })
    cards.push({
      id: `${pair.id}-answer`,
      pairId: pair.id,
      type: 'answer',
      display: pair.answer,
    })
  })
  return shuffle(cards)
}

function initStatuses(deck: MatchCard[]): Record<string, CardStatus> {
  const s: Record<string, CardStatus> = {}
  deck.forEach(c => { s[c.id] = 'hidden' })
  return s
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

  const isClue = card.type === 'clue'

  return (
    <button
      onClick={onFlip}
      disabled={status !== 'hidden'}
      aria-label={isFlipped ? card.display : 'Hidden card'}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '170 / 130',
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
              : isClue
              ? 'var(--c-lt-surface)'
              : 'var(--c-lt-bg)',
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
          {/* Type label */}
          <span
            style={{
              position: 'absolute',
              top: 'var(--sp-1)',
              left: 'var(--sp-2)',
              fontSize: 9,
              fontWeight: 'var(--weight-med)',
              fontFamily: 'var(--font-body)',
              color: isClue ? 'var(--c-lt-brand)' : 'var(--c-lt-text-2)',
              letterSpacing: 'var(--tracking-wider)',
              textTransform: 'uppercase',
            }}
          >
            {isClue ? 'Route' : 'City'}
          </span>

          <span
            style={{
              fontSize: isClue ? 'var(--text-2xs)' : 'var(--text-sm)',
              fontWeight: isClue ? 'var(--weight-reg)' : 'var(--weight-med)',
              color: 'var(--c-lt-text-1)',
              textAlign: 'center',
              lineHeight: 'var(--leading-snug)',
              letterSpacing: 'var(--tracking-snug)',
              fontFamily: isClue ? 'var(--font-body)' : 'var(--font-display)',
              padding: '0 var(--sp-1)',
            }}
          >
            {card.display}
          </span>

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

// ─── Round completion overlay ─────────────────────────────────────────────────

interface RoundCompleteProps {
  roundIndex: number
  totalRounds: number
  roundTitle: string
  matchedPairs: number
  pairCount: number
  moves: number
  timeLeft: number
  stars: number
  onNextRound: () => void
  onResults: () => void
}

function RoundCompleteOverlay({
  roundIndex,
  totalRounds,
  roundTitle,
  matchedPairs,
  pairCount,
  moves,
  timeLeft,
  stars,
  onNextRound,
  onResults,
}: RoundCompleteProps) {
  const [visible, setVisible] = useState(false)
  const isFinalRound = roundIndex === totalRounds - 1

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const label = isFinalRound
    ? (stars === 3 ? 'Perfect!' : stars === 2 ? 'Great Job!' : 'Well Done!')
    : (matchedPairs === pairCount ? 'Round Clear!' : 'Time\'s Up!')
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
        {/* Confetti burst on final round with good performance */}
        {visible && isFinalRound && stars >= 2 && <Confetti />}

        {/* Stars (only on final round) */}
        {isFinalRound && (
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
        )}

        {/* Round indicator (non-final) */}
        {!isFinalRound && (
          <div
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--c-lt-text-2)',
              marginBottom: 'var(--sp-2)',
              letterSpacing: 'var(--tracking-wider)',
              textTransform: 'uppercase',
            }}
          >
            {roundTitle}
          </div>
        )}

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
          {matchedPairs === pairCount
            ? `You matched all ${pairCount} pairs`
            : `You matched ${matchedPairs} of ${pairCount} pairs`}
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
          onClick={isFinalRound ? onResults : onNextRound}
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
          {isFinalRound ? 'View Results' : `Next Round (${roundIndex + 2}/${totalRounds})`}
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

  // Resolve quiz from location state or default to first quiz
  const quizId = (location.state as { quizId?: string } | null)?.quizId ?? CARD_MATCH_QUIZZES[0]?.id
  const quiz = CARD_MATCH_QUIZZES.find(q => q.id === quizId)

  // Multi-round state
  const [roundIndex, setRoundIndex] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [totalMoves, setTotalMoves] = useState(0)
  const [roundComplete, setRoundComplete] = useState(false)

  const rounds = quiz?.rounds ?? []
  const totalRounds = rounds.length
  const currentRound = rounds[roundIndex]
  const pairCount = currentRound?.pairs.length ?? 0

  const [deck, setDeck] = useState<MatchCard[]>(() =>
    currentRound ? buildDeckFromPairs(currentRound.pairs) : []
  )
  const [statuses, setStatuses] = useState<Record<string, CardStatus>>(() => initStatuses(deck))
  const [flippedIds, setFlippedIds] = useState<string[]>([])
  const [moves, setMoves] = useState(0)
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [started, setStarted] = useState(false)

  const lockRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedRef = useRef(false)

  // Reset completedRef when round changes
  useEffect(() => {
    completedRef.current = false
  }, [roundIndex])

  // Countdown timer
  useEffect(() => {
    if (started && !roundComplete) {
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
  }, [started, roundComplete])

  const calculateRoundScore = useCallback((m: number, matched: number, tLeft: number): number => {
    if (matched === 0) return 0
    const matchBonus = matched * 2
    const moveScore = Math.max(0, pairCount - Math.max(0, m - pairCount))
    const timeBonus = tLeft >= 30 ? 3 : tLeft >= 20 ? 2 : tLeft >= 10 ? 1 : 0
    return matchBonus + moveScore + timeBonus
  }, [pairCount])

  const finishRound = useCallback((m: number, matched: number, tLeft: number) => {
    if (completedRef.current) return
    completedRef.current = true
    setRoundComplete(true)
    const roundScore = calculateRoundScore(m, matched, tLeft)
    setTotalScore(prev => prev + roundScore)
    setTotalMoves(prev => prev + m)
    track('card_match_round_completed', {
      quizId,
      round: roundIndex + 1,
      moves: m,
      timeLeft: tLeft,
      score: roundScore,
      matchedPairs: matched,
      pairCount,
    })
  }, [calculateRoundScore, quizId, roundIndex, pairCount])

  // Time-up auto-complete
  useEffect(() => {
    if (timeLeft === 0 && started && !roundComplete) {
      finishRound(moves, matchedPairs, 0)
    }
  }, [timeLeft, started, roundComplete, moves, matchedPairs, finishRound])

  // Check completion (all matched)
  useEffect(() => {
    if (matchedPairs === pairCount && matchedPairs > 0 && !roundComplete) {
      finishRound(moves, matchedPairs, timeLeft)
    }
  }, [matchedPairs, pairCount, moves, timeLeft, roundComplete, finishRound])

  const getStars = (): number => {
    const avgMovesPerRound = totalMoves / Math.max(roundIndex + 1, 1)
    if (avgMovesPerRound <= pairCount + 1) return 3
    if (avgMovesPerRound <= pairCount + 4) return 2
    return 1
  }

  const handleFlip = useCallback((cardId: string) => {
    if (lockRef.current) return
    if (statuses[cardId] !== 'hidden') return
    if (roundComplete) return

    if (!started) setStarted(true)

    const card = deck.find(c => c.id === cardId)
    if (!card) return

    track('card_match_flip', { cardId: card.id, pairId: card.pairId, round: roundIndex + 1 })

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
          track('card_match_pair_found', { pairId: first.pairId, round: roundIndex + 1 })
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
  }, [deck, statuses, flippedIds, started, roundComplete, roundIndex])

  const handleNextRound = useCallback(() => {
    const nextIdx = roundIndex + 1
    if (nextIdx >= totalRounds) return
    const nextRound = rounds[nextIdx]
    const newDeck = buildDeckFromPairs(nextRound.pairs)
    setRoundIndex(nextIdx)
    setDeck(newDeck)
    setStatuses(initStatuses(newDeck))
    setFlippedIds([])
    setMoves(0)
    setMatchedPairs(0)
    setTimeLeft(ROUND_TIME)
    setRoundComplete(false)
    setStarted(false)
    lockRef.current = false
  }, [roundIndex, totalRounds, rounds])

  const handleResults = useCallback(() => {
    const finalScore = totalScore
    addPoints(finalScore)
    recordQuizResult(quizId ?? 'card-match', finalScore, totalRounds * pairCount)
    track('card_match_completed', { quizId, totalScore: finalScore, totalMoves, totalRounds })
    navigate('/results', {
      state: {
        score: finalScore,
        total: totalRounds * pairCount,
        quizTitle: quiz?.title ?? 'Card Match',
      },
    })
  }, [totalScore, totalMoves, totalRounds, pairCount, quizId, quiz, addPoints, recordQuizResult, navigate])

  const handleBack = useCallback(() => {
    track('card_match_abandoned', { quizId, round: roundIndex + 1, moves, timeLeft, matchedPairs })
    navigate(-1)
  }, [quizId, roundIndex, moves, timeLeft, matchedPairs, navigate])

  // Overall progress: completed rounds + current round progress
  const overallProgress = totalRounds > 0
    ? ((roundIndex * pairCount + matchedPairs) / (totalRounds * pairCount)) * 100
    : 0

  if (!quiz || !currentRound) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--c-lt-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'var(--c-lt-text-2)', fontFamily: 'var(--font-body)' }}>
          Quiz not found
        </p>
      </div>
    )
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
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
                  width: `${overallProgress}%`,
                  background: 'linear-gradient(90deg, var(--c-accent), var(--c-lt-correct-dark))',
                  borderRadius: 4,
                  transition: 'width 400ms var(--ease-out)',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Round title ── */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-4)' }}>
          <div
            style={{
              fontSize: 'var(--text-2xs)',
              color: 'var(--c-lt-text-2)',
              letterSpacing: 'var(--tracking-wider)',
              textTransform: 'uppercase',
              marginBottom: 'var(--sp-1)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Round {roundIndex + 1} of {totalRounds}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--weight-light)',
              color: 'var(--c-lt-text-1)',
              letterSpacing: 'var(--tracking-tight)',
            }}
          >
            {currentRound.title}
          </h1>
        </div>

        {/* ── Card Grid (2 columns x 4 rows for 4 pairs = 8 cards) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--sp-3)',
            marginBottom: 'var(--sp-4)',
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
          <TimerRing timeLeft={timeLeft} total={ROUND_TIME} />
          <span
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--c-lt-text-2)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {matchedPairs}/{pairCount} matched
          </span>
        </div>
      </div>

      {/* ── Round completion overlay ── */}
      {roundComplete && (
        <RoundCompleteOverlay
          roundIndex={roundIndex}
          totalRounds={totalRounds}
          roundTitle={currentRound.title}
          matchedPairs={matchedPairs}
          pairCount={pairCount}
          moves={moves}
          timeLeft={timeLeft}
          stars={getStars()}
          onNextRound={handleNextRound}
          onResults={handleResults}
        />
      )}
    </div>
  )
}

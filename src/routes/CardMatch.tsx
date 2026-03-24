import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { WORLD_CUP_TEAMS } from '../data/teams'

// ─── Types ──────────────────────────────────────────────────────────────────────

interface MatchCard {
  id: string
  pairId: string
  type: 'flag' | 'name'
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

// ─── Card back with brand pattern ───────────────────────────────────────────────

function CardBack() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'var(--f-brand-radius-small)',
        background: 'var(--f-brand-color-primary)',
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
        aria-hidden="true"
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
        borderRadius: 'var(--f-brand-radius-inner)',
        border: '2px solid var(--f-brand-color-background-success)',
        animation: 'match-ring var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit) forwards',
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
        transition: 'opacity var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit), transform var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: isFlipped || isMismatched ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: `transform ${FLIP_DURATION}ms var(--f-brand-motion-easing-exit)`,
          animation: isMismatched
            ? 'card-shake var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit)'
            : isMatched
            ? 'card-match-pop var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit)'
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
            borderRadius: 'var(--f-brand-radius-small)',
            background: isMatched
              ? 'var(--f-brand-color-background-success-accent)'
              : 'var(--f-brand-color-background-light)',
            border: `1.5px solid ${
              isMatched
                ? 'var(--f-brand-color-background-success)'
                : isMismatched
                ? 'var(--f-brand-color-status-error)'
                : 'var(--f-brand-color-border-default)'
            }`,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--f-brand-space-2xs)',
            padding: 'var(--f-brand-space-xs)',
            boxShadow: isMatched
              ? '0 0 16px var(--f-brand-color-border-success)'
              : isMismatched
              ? '0 0 16px var(--f-brand-color-border-error)'
              : '0 2px 8px var(--f-brand-shadow-medium)',
            transition: 'box-shadow var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), border-color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default), background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
            overflow: 'hidden',
          }}
        >
          {card.type === 'flag' ? (
            <span style={{ fontSize: '36', lineHeight: 1 }}>{card.display}</span>
          ) : (
            <span
              style={{
                fontSize: '11',
                fontWeight: '500',
                color: 'var(--f-brand-color-text-default)',
                textAlign: 'center',
                lineHeight: '1.28',
                letterSpacing: '-0.015em',
                fontFamily: 'var(--f-base-type-family-secondary)',
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
                top: 'var(--f-brand-space-2xs)',
                right: 'var(--f-brand-space-2xs)',
                width: 18,
                height: 18,
                borderRadius: 'var(--f-brand-radius-rounded)',
                background: 'var(--f-brand-color-background-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
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
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--f-brand-color-border-default)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--f-brand-color-primary)"
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
          fontWeight: '500',
          fontFamily: 'var(--f-base-type-family-secondary)',
          color: 'var(--f-brand-color-text-default)',
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
        fontSize: '22',
        fontWeight: '600',
        color: 'var(--f-brand-color-primary)',
        fontFamily: 'var(--f-base-type-family-secondary)',
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit), transform var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit)',
      }}
    >
      {value}
    </div>
  )
}

// ─── Confetti particles ─────────────────────────────────────────────────────────

function Confetti() {
  const particles = useMemo(() => {
    const colors = ['var(--f-brand-color-background-success)', 'var(--f-brand-color-primary)', 'var(--f-brand-color-status-warning)', 'var(--f-brand-color-accent)']
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
            borderRadius: p.id % 3 === 0 ? 'var(--f-brand-radius-rounded)' : 0,
            background: p.color,
            animation: `confetti-fall ${p.duration} var(--f-brand-motion-easing-exit) ${p.delay} forwards`,
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
  onResults: () => void
  onPlayAgain: () => void
}

function CompletionOverlay({ moves, timeLeft, stars, onResults, onPlayAgain }: CompletionProps) {
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
        background: visible ? 'var(--f-brand-color-background-dark-50a)' : 'transparent',
        backdropFilter: visible ? 'blur(12px)' : 'blur(0px)',
        WebkitBackdropFilter: visible ? 'blur(12px)' : 'blur(0px)',
        transition: 'background var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default), backdrop-filter var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-default)',
        padding: 'var(--f-brand-space-lg)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 320,
          background: 'var(--f-brand-color-background-light)',
          border: '1px solid var(--f-brand-color-border-default)',
          borderRadius: 'var(--f-brand-radius-outer)',
          padding: 'var(--f-brand-space-xl) var(--f-brand-space-lg)',
          textAlign: 'center',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
          transition: 'opacity var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit) var(--f-brand-motion-duration-instant), transform var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit) var(--f-brand-motion-duration-instant)',
          overflow: 'hidden',
        }}
      >
        {/* Confetti burst */}
        {visible && stars >= 2 && <Confetti />}

        {/* Stars */}
        <div style={{ fontSize: '36', marginBottom: 'var(--f-brand-space-md)', letterSpacing: 8 }}>
          {[1, 2, 3].map(i => (
            <span
              key={i}
              style={{
                opacity: i <= stars ? 1 : 0.2,
                filter: i <= stars ? 'drop-shadow(0 0 8px var(--c-lt-star-glow))' : 'none',
                display: 'inline-block',
                transform: visible && i <= stars ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-30deg)',
                transition: `transform var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit) ${300 + i * 180}ms, opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default) ${300 + i * 180}ms`,
              }}
            >
              ⭐
            </span>
          ))}
        </div>

        <h2
          style={{
            fontFamily: 'var(--f-base-type-family-primary)',
            fontSize: '28',
            fontWeight: '300',
            color: 'var(--f-brand-color-text-default)',
            marginBottom: 'var(--f-brand-space-xs)',
            letterSpacing: '-0.03em',
          }}
        >
          {label}
        </h2>
        <p
          style={{
            fontSize: '13',
            color: 'var(--f-brand-color-text-subtle)',
            marginBottom: 'var(--f-brand-space-lg)',
            lineHeight: '1.52',
          }}
        >
          You matched all {PAIR_COUNT} pairs
        </p>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--f-brand-space-lg)',
            marginBottom: 'var(--f-brand-space-xl)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <AnimatedStat value={String(moves)} delay={700} />
            <div style={{ fontSize: '10', color: 'var(--f-brand-color-text-subtle)', letterSpacing: '0.09em', textTransform: 'uppercase', marginTop: 2 }}>
              Moves
            </div>
          </div>
          <div style={{ width: 1, background: 'var(--f-brand-color-border-default)' }} />
          <div style={{ textAlign: 'center' }}>
            <AnimatedStat value={`${timeUsed}s`} delay={900} />
            <div style={{ fontSize: '10', color: 'var(--f-brand-color-text-subtle)', letterSpacing: '0.09em', textTransform: 'uppercase', marginTop: 2 }}>
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
            borderRadius: 'var(--f-brand-radius-rounded)',
            border: 'none',
            background: 'var(--f-brand-color-primary)',
            color: 'var(--f-brand-color-text-light)',
            fontSize: 16,
            fontWeight: '500',
            fontFamily: 'inherit',
            cursor: 'pointer',
            marginBottom: 'var(--f-brand-space-sm)',
          }}
        >
          View Results
        </button>
        <button
          onClick={onPlayAgain}
          style={{
            width: '100%',
            height: 56,
            borderRadius: 'var(--f-brand-radius-rounded)',
            border: '1.5px solid var(--f-brand-color-border-default)',
            background: 'var(--f-brand-color-background-light)',
            color: 'var(--f-brand-color-text-default)',
            fontSize: 16,
            fontWeight: '500',
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
  const { addPoints, recordQuizResult } = useStore()

  const [deck, setDeck] = useState<MatchCard[]>(() => buildDeck())
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

  const lockRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Countdown timer
  useEffect(() => {
    if (started && !gameComplete) {
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
  }, [started, gameComplete])

  // Time-up auto-complete
  useEffect(() => {
    if (timeLeft === 0 && started && !gameComplete) {
      setGameComplete(true)
      const score = calculateScore(moves, matchedPairs)
      addPoints(score)
      recordQuizResult('card-match', score, PAIR_COUNT)
      track('card_match_completed', { moves, timeLeft: 0, score, pairs: PAIR_COUNT, matchedPairs })
    }
  }, [timeLeft, started, gameComplete, moves, matchedPairs, addPoints, recordQuizResult])

  // Check completion (all matched)
  useEffect(() => {
    if (matchedPairs === PAIR_COUNT && matchedPairs > 0) {
      setGameComplete(true)
      const score = calculateScore(moves, matchedPairs)
      addPoints(score)
      recordQuizResult('card-match', score, PAIR_COUNT)
      track('card_match_completed', { moves, timeLeft, score, pairs: PAIR_COUNT })
    }
  }, [matchedPairs, moves, timeLeft, addPoints, recordQuizResult])

  const calculateScore = (m: number, matched: number): number => {
    if (matched === 0) return 0
    const matchBonus = matched * 2
    const moveScore = Math.max(0, PAIR_COUNT - Math.max(0, m - PAIR_COUNT))
    const timeBonus = timeLeft >= 20 ? 2 : timeLeft >= 10 ? 1 : 0
    return matchBonus + moveScore + timeBonus
  }

  const getStars = (): number => {
    if (matchedPairs < PAIR_COUNT) return 1
    if (moves <= PAIR_COUNT + 2) return 3
    if (moves <= PAIR_COUNT + 6) return 2
    return 1
  }

  const handleFlip = useCallback((cardId: string) => {
    if (lockRef.current) return
    if (statuses[cardId] !== 'hidden') return
    if (gameComplete) return

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
  }, [deck, statuses, flippedIds, started, gameComplete])

  const handlePlayAgain = useCallback(() => {
    const newDeck = buildDeck()
    setDeck(newDeck)
    const s: Record<string, CardStatus> = {}
    newDeck.forEach(c => { s[c.id] = 'hidden' })
    setStatuses(s)
    setFlippedIds([])
    setMoves(0)
    setMatchedPairs(0)
    setTimeLeft(ROUND_TIME)
    setGameComplete(false)
    setStarted(false)
    lockRef.current = false
    track('card_match_play_again')
  }, [])

  const handleResults = useCallback(() => {
    const score = calculateScore(moves, matchedPairs)
    navigate('/results', {
      state: { score, total: PAIR_COUNT, quizTitle: 'Card Match' },
    })
  }, [moves, matchedPairs, navigate])

  const handleBack = useCallback(() => {
    track('card_match_abandoned', { moves, timeLeft, matchedPairs })
    navigate(-1)
  }, [moves, timeLeft, matchedPairs, navigate])

  const handleNext = useCallback(() => {
    const score = calculateScore(moves, matchedPairs)
    navigate('/results', {
      state: { score, total: PAIR_COUNT, quizTitle: 'Card Match' },
    })
  }, [moves, matchedPairs, navigate])

  const progressPercent = (matchedPairs / PAIR_COUNT) * 100

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--f-brand-color-background-default)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <style>{KEYFRAMES}</style>
      <div
        className="f-page-enter"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          maxWidth: 420,
          margin: '0 auto',
          width: '100%',
          padding: 'var(--f-brand-space-md)',
        }}
      >
        {/* ── Back button + Progress bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--f-brand-space-sm)', marginBottom: 'var(--f-brand-space-lg)' }}>
          <button
            onClick={handleBack}
            aria-label="Go back"
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--f-brand-radius-rounded)',
              background: 'var(--f-brand-color-background-light)',
              border: '1px solid var(--f-brand-color-border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 2px 8px var(--f-brand-shadow-medium)',
              padding: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 18.5C14.87 18.5 14.74 18.45 14.65 18.35L8.65 12.35C8.55 12.26 8.5 12.13 8.5 12C8.5 11.87 8.55 11.74 8.65 11.65L14.65 5.65C14.84 5.46 15.16 5.46 15.35 5.65C15.54 5.84 15.54 6.16 15.35 6.35L9.71 12L15.35 17.65C15.54 17.84 15.54 18.16 15.35 18.35C15.26 18.45 15.13 18.5 15 18.5Z"
                fill="var(--f-brand-color-text-default)"
              />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 8,
                background: 'var(--f-brand-color-border-default)',
                borderRadius: 'var(--f-brand-radius-rounded)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, var(--f-brand-color-accent), var(--f-brand-color-background-success))',
                  borderRadius: 'var(--f-brand-radius-rounded)',
                  transition: 'width var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit)',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Title ── */}
        <h1
          style={{
            fontFamily: 'var(--f-base-type-family-primary)',
            fontSize: '28',
            fontWeight: '300',
            color: 'var(--f-brand-color-text-default)',
            letterSpacing: '-0.03em',
            textAlign: 'center',
            marginBottom: 'var(--f-brand-space-lg)',
          }}
        >
          Match the cards
        </h1>

        {/* ── Card Grid (2 columns x 3 rows) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: 'repeat(3, auto)',
            gap: 'var(--f-brand-space-sm)',
            marginBottom: 'var(--f-brand-space-lg)',
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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--f-brand-space-lg)' }}>
          <TimerRing timeLeft={timeLeft} total={ROUND_TIME} />
        </div>

        {/* ── Next button ── */}
        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={handleNext}
            style={{
              width: '100%',
              height: 56,
              borderRadius: 'var(--f-brand-radius-rounded)',
              border: 'none',
              background: 'var(--f-brand-color-primary)',
              color: 'var(--f-brand-color-text-light)',
              fontSize: 16,
              fontWeight: '500',
              fontFamily: 'inherit',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Next
          </button>
        </div>
      </div>

      {/* ── Completion overlay ── */}
      {gameComplete && (
        <CompletionOverlay
          moves={moves}
          timeLeft={timeLeft}
          stars={getStars()}
          onResults={handleResults}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}

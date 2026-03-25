import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { WORLD_CUP_TEAMS } from '../data/teams'
import './CardMatch.css'

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
    <div className="f-match-card__back">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 170 160"
        className="f-match-card__pattern"
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
      <div className="f-match-card__shimmer" />
    </div>
  )
}

// ─── Match ring burst effect ────────────────────────────────────────────────────

function MatchRing() {
  return <div className="f-match-card__ring" />
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

  const cardClasses = [
    'f-match-card',
    dealt && 'f-match-card--dealt',
    isFlipped && 'f-match-card--flipped',
    isMatched && 'f-match-card--matched',
    isMismatched && 'f-match-card--shaking',
    status !== 'hidden' && 'f-match-card--disabled',
  ].filter(Boolean).join(' ')

  return (
    <button
      onClick={onFlip}
      disabled={status !== 'hidden'}
      aria-label={isFlipped ? card.display : 'Hidden card'}
      className={cardClasses}
      style={{ transitionDelay: dealt ? undefined : `${dealDelay}ms` }}
    >
      <div className="f-match-card__inner">
        <CardBack />

        <div className="f-match-card__front">
          {card.type === 'flag' ? (
            <span className="f-match-card__flag">{card.display}</span>
          ) : (
            <span className="f-match-card__name">{card.display}</span>
          )}

          {isMatched && (
            <div className="f-match-card__check">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      </div>

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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="f-match-timer__ring-bg"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="f-match-timer__ring-progress"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span className="f-match-timer__label">{String(timeLeft).padStart(2, '0')}</span>
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
      className="f-match-modal__stat-value"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      {value}
    </div>
  )
}

// ─── Confetti particles ─────────────────────────────────────────────────────────

function Confetti() {
  const particles = useMemo(() => {
    const colors = ['var(--f-brand-color-background-success)', 'var(--f-brand-color-background-primary)', 'var(--c-warn)', 'var(--c-accent)']
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
    <div className="f-match-confetti">
      {particles.map(p => (
        <div
          key={p.id}
          className="f-match-confetti__particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: p.id % 3 === 0 ? 'var(--f-brand-radius-rounded)' : 0,
            background: p.color,
            animation: `f-match-confetti ${p.duration} var(--f-brand-motion-ease-out) ${p.delay} forwards`,
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

  const modalClasses = [
    'f-match-modal',
    visible && 'f-match-modal--visible',
  ].filter(Boolean).join(' ')

  return (
    <div className={modalClasses}>
      <div className="f-match-modal__card">
        {visible && stars >= 2 && <Confetti />}

        <div className="f-match-modal__stars">
          {[1, 2, 3].map(i => (
            <span
              key={i}
              style={{
                opacity: i <= stars ? 1 : 0.2,
                filter: i <= stars ? 'drop-shadow(0 0 8px var(--c-lt-star-glow))' : 'none',
                display: 'inline-block',
                transform: visible && i <= stars ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-30deg)',
                transition: `transform 500ms var(--f-brand-motion-ease-out) ${300 + i * 180}ms, opacity 300ms ease ${300 + i * 180}ms`,
              }}
            >
              ⭐
            </span>
          ))}
        </div>

        <h2 className="f-match-modal__title">{label}</h2>
        <p className="f-match-modal__subtitle">You matched all {PAIR_COUNT} pairs</p>

        <div className="f-match-modal__stats">
          <div style={{ textAlign: 'center' }}>
            <AnimatedStat value={String(moves)} delay={700} />
            <div className="f-match-modal__stat-label">Moves</div>
          </div>
          <div className="f-match-modal__divider" />
          <div style={{ textAlign: 'center' }}>
            <AnimatedStat value={`${timeUsed}s`} delay={900} />
            <div className="f-match-modal__stat-label">Time</div>
          </div>
        </div>

        <button onClick={onResults} className="f-match-modal__btn-primary">
          View Results
        </button>
        <button onClick={onPlayAgain} className="f-match-modal__btn-secondary">
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
    <div className="f-match-page">
      <div className="f-match-page__inner page-in">
        {/* ── Back button + Progress bar ── */}
        <div className="f-match-topbar">
          <button onClick={handleBack} aria-label="Go back" className="f-match-topbar__back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18.5C14.87 18.5 14.74 18.45 14.65 18.35L8.65 12.35C8.55 12.26 8.5 12.13 8.5 12C8.5 11.87 8.55 11.74 8.65 11.65L14.65 5.65C14.84 5.46 15.16 5.46 15.35 5.65C15.54 5.84 15.54 6.16 15.35 6.35L9.71 12L15.35 17.65C15.54 17.84 15.54 18.16 15.35 18.35C15.26 18.45 15.13 18.5 15 18.5Z"
                fill="var(--f-brand-color-text-default)"
              />
            </svg>
          </button>
          <div className="f-match-topbar__track">
            <div
              className="f-match-topbar__progress"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ── Title ── */}
        <h1 className="f-match-title">Match the cards</h1>

        {/* ── Card Grid (2 columns x 3 rows) ── */}
        <div className="f-match-grid">
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
        <div className="f-match-timer">
          <TimerRing timeLeft={timeLeft} total={ROUND_TIME} />
        </div>

        {/* ── Next button ── */}
        <div className="f-match-next">
          <button onClick={handleNext} className="f-match-next__btn">
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

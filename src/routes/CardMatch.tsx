import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { track } from '../lib/analytics'
import { useStore, type FlowId } from '../store/useStore'
import { WORLD_CUP_TEAMS } from '../data/teams'
import { CARD_MATCH_QUIZZES, type CardMatchPair } from '../data/cardMatchQuizzes'

// ─── Types ──────────────────────────────────────────────────────────────────────

interface MatchCard {
  id: string
  pairId: string
  type: 'flag' | 'name' | 'clue' | 'answer'
  display: string
  teamColors?: [string, string]
}

type CardStatus = 'hidden' | 'flipped' | 'matched' | 'mismatched'

// ─── Constants ──────────────────────────────────────────────────────────────────

const LEGACY_PAIR_COUNT = 3
const LEGACY_ROUND_TIME = 30
const FLOW_PAIR_COUNT = 4
const FLOW_ROUND_TIME = 45
const FLIP_DURATION = 400
const MISMATCH_DELAY = 800
const MATCH_DELAY = 500
const DEAL_STAGGER = 60

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
  const teams = shuffle(WORLD_CUP_TEAMS).slice(0, LEGACY_PAIR_COUNT)
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

function buildFlowDeck(pairs: CardMatchPair[]): MatchCard[] {
  const cards: MatchCard[] = []
  pairs.forEach(pair => {
    cards.push({ id: `${pair.id}-clue`, pairId: pair.id, type: 'clue', display: pair.clue })
    cards.push({ id: `${pair.id}-answer`, pairId: pair.id, type: 'answer', display: pair.answer })
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
      className="card-match-back-container"
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
        className="card-match-back-pattern-svg"
        width="100%"
        height="100%"
        viewBox="0 0 170 160"
        style={{ position: 'absolute', inset: 0, opacity: 0.15 }}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs className="card-match-back-pattern-defs">
          <pattern className="card-match-back-pattern" id="card-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle className="card-match-back-circle-center" cx="20" cy="20" r="12" fill="none" stroke="white" strokeWidth="0.8" />
            <circle className="card-match-back-circle-tl" cx="0" cy="0" r="8" fill="none" stroke="white" strokeWidth="0.5" />
            <circle className="card-match-back-circle-tr" cx="40" cy="0" r="8" fill="none" stroke="white" strokeWidth="0.5" />
            <circle className="card-match-back-circle-bl" cx="0" cy="40" r="8" fill="none" stroke="white" strokeWidth="0.5" />
            <circle className="card-match-back-circle-br" cx="40" cy="40" r="8" fill="none" stroke="white" strokeWidth="0.5" />
            <path className="card-match-back-cross" d="M20 8L20 32M8 20L32 20" stroke="white" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect className="card-match-back-fill" width="170" height="160" fill="url(#card-pattern)" />
      </svg>
      {/* Shimmer */}
      <div
        className="card-match-back-shimmer"
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
      className="card-match-ring-burst"
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
      className="card-match-game-button"
      onClick={onFlip}
      disabled={status !== 'hidden'}
      data-section="card-item"
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
        className="card-match-card-inner"
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
          className="card-match-card-front"
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
            <span className="card-match-flag-emoji" style={{ fontSize: 'var(--text-3xl)', lineHeight: 'var(--leading-none)' }}>{card.display}</span>
          ) : card.type === 'clue' ? (
            <span
              className="card-match-clue-text"
              style={{
                font: 'var(--f-brand-type-caption)',
                fontSize: 'var(--text-2xs)',
                color: 'var(--f-brand-color-text-subtle)',
                textAlign: 'center',
                lineHeight: 'var(--leading-relaxed)',
                letterSpacing: 'var(--tracking-snug)',
              }}
            >
              {card.display}
            </span>
          ) : (
            <span
              className="card-match-answer-text"
              style={{
                font: 'var(--f-brand-type-caption-medium)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--f-brand-color-text-default)',
                textAlign: 'center',
                lineHeight: 'var(--leading-snug)',
                letterSpacing: 'var(--tracking-snug)',
              }}
            >
              {card.display}
            </span>
          )}

          {/* Match checkmark */}
          {isMatched && (
            <div
              className="card-match-checkmark"
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
              <svg className="card-match-checkmark-icon" width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                <path className="card-match-checkmark-path" d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
    <div className="card-match-timer-ring" style={{ position: 'relative', width: size, height: size }}>
      <svg className="card-match-timer-svg" width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        {/* Background track */}
        <circle
          className="card-match-timer-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--f-brand-color-border-default)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          className="card-match-timer-progress"
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
        className="card-match-timer-value"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          font: 'var(--f-brand-type-body-medium)',
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
      className="card-match-animated-stat"
      style={{
        font: 'var(--f-brand-type-headline-medium)',
        fontSize: 'var(--text-xl)',
        fontWeight: 'var(--weight-bold)',
        color: 'var(--f-brand-color-primary)',
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
    <div className="card-match-confetti" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => (
        <div
          className="card-match-confetti-particle"
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
  totalMoves: number
  totalTimeUsed: number
  stars: number
  pairCount: number
  totalRounds: number
  onResults: () => void
  onPlayAgain: () => void
}

function CompletionOverlay({ totalMoves, totalTimeUsed, stars, pairCount, totalRounds, onResults, onPlayAgain }: CompletionProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const label = stars === 3 ? 'Perfect!' : stars === 2 ? 'Great Job!' : 'Well Done!'

  return (
    <div
      className="card-match-completion-overlay"
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
        className="card-match-completion-card"
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
        <div className="card-match-stars" style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--f-brand-space-md)', letterSpacing: 'var(--tracking-display-ultra)' }}>
          {[1, 2, 3].map(i => (
            <span
              className="card-match-star"
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
          className="card-match-completion-heading"
          style={{
            font: 'var(--f-brand-type-title-3)',
            color: 'var(--f-brand-color-text-default)',
            marginBottom: 'var(--f-brand-space-xs)',
            letterSpacing: 'var(--tracking-tight)',
          }}
        >
          {label}
        </h2>
        <p
          className="card-match-completion-description"
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--f-brand-color-text-subtle)',
            marginBottom: 'var(--f-brand-space-lg)',
            lineHeight: 'var(--leading-normal)',
          }}
        >
          You matched all {pairCount} pairs{totalRounds > 1 ? ` across ${totalRounds} rounds` : ''}
        </p>

        {/* Stats row */}
        <div
          className="card-match-completion-stats"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--f-brand-space-lg)',
            marginBottom: 'var(--f-brand-space-xl)',
          }}
        >
          <div className="card-match-stat-moves" style={{ textAlign: 'center' }}>
            <AnimatedStat value={String(totalMoves)} delay={700} />
            <div className="card-match-stat-label" style={{ fontSize: 'var(--text-2xs)', color: 'var(--f-brand-color-text-subtle)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginTop: 2 }}>
              Moves
            </div>
          </div>
          <div className="card-match-stat-divider" style={{ width: 1, background: 'var(--f-brand-color-border-default)' }} />
          <div className="card-match-stat-time" style={{ textAlign: 'center' }}>
            <AnimatedStat value={`${totalTimeUsed}s`} delay={900} />
            <div className="card-match-stat-label" style={{ fontSize: 'var(--text-2xs)', color: 'var(--f-brand-color-text-subtle)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginTop: 2 }}>
              Time
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <button
          className="card-match-view-results-button"
          onClick={onResults}
          style={{
            width: '100%',
            height: 56,
            borderRadius: 'var(--f-brand-radius-rounded)',
            border: 'none',
            background: 'var(--f-brand-color-primary)',
            color: 'var(--f-brand-color-text-light)',
            font: 'var(--f-brand-type-body-medium)',
            cursor: 'pointer',
            marginBottom: 'var(--f-brand-space-sm)',
          }}
        >
          View Results
        </button>
        <button
          className="card-match-play-again-button"
          onClick={onPlayAgain}
          style={{
            width: '100%',
            height: 56,
            borderRadius: 'var(--f-brand-radius-rounded)',
            border: '1.5px solid var(--f-brand-color-border-default)',
            background: 'var(--f-brand-color-background-light)',
            color: 'var(--f-brand-color-text-default)',
            font: 'var(--f-brand-type-body-medium)',
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
  const { addPoints, recordQuizResult, completeFlow } = useStore()

  const flowId = (location.state as { flowId?: string } | null)?.flowId ?? null
  const quiz = flowId ? (CARD_MATCH_QUIZZES.find(q => q.id === flowId) ?? null) : null
  const pairCount = quiz ? FLOW_PAIR_COUNT : LEGACY_PAIR_COUNT
  const roundTime = quiz ? FLOW_ROUND_TIME : LEGACY_ROUND_TIME
  const totalRounds = quiz ? quiz.rounds.length : 1

  const [currentRound, setCurrentRound] = useState(0)
  const [accumulatedScore, setAccumulatedScore] = useState(0)
  const [accumulatedMoves, setAccumulatedMoves] = useState(0)
  const [accumulatedTimeUsed, setAccumulatedTimeUsed] = useState(0)

  const [deck, setDeck] = useState<MatchCard[]>(() =>
    quiz ? buildFlowDeck(quiz.rounds[0].pairs) : buildDeck()
  )
  const [statuses, setStatuses] = useState<Record<string, CardStatus>>(() => initStatuses(deck))
  const [flippedIds, setFlippedIds] = useState<string[]>([])
  const [moves, setMoves] = useState(0)
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [timeLeft, setTimeLeft] = useState(roundTime)
  const [gameComplete, setGameComplete] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
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

  const finishGame = useCallback((roundScore: number, matched: number) => {
    const newAccumulated = accumulatedScore + roundScore
    const newTotalMoves = accumulatedMoves + moves
    const newTotalTimeUsed = accumulatedTimeUsed + (roundTime - timeLeft)
    if (quiz && currentRound < totalRounds - 1) {
      // Advance to next round
      setGameComplete(true)
      setAccumulatedScore(newAccumulated)
      setAccumulatedMoves(newTotalMoves)
      setAccumulatedTimeUsed(newTotalTimeUsed)
      const nextRound = currentRound + 1
      setTimeout(() => {
        const newDeck = buildFlowDeck(quiz.rounds[nextRound].pairs)
        setCurrentRound(nextRound)
        setDeck(newDeck)
        setStatuses(initStatuses(newDeck))
        setFlippedIds([])
        setMoves(0)
        setMatchedPairs(0)
        setTimeLeft(roundTime)
        setGameComplete(false)
        setStarted(false)
        lockRef.current = false
      }, 800)
    } else {
      const quizId = quiz ? quiz.id : 'card-match'
      setGameComplete(true)
      setShowCompletion(true)
      setAccumulatedMoves(newTotalMoves)
      setAccumulatedTimeUsed(newTotalTimeUsed)
      addPoints(newAccumulated)
      recordQuizResult(quizId, newAccumulated, pairCount * totalRounds)
      if (quiz) completeFlow(quiz.id)
      track('card_match_completed', { flowId, moves: newTotalMoves, timeUsed: newTotalTimeUsed, score: newAccumulated, pairs: pairCount, matchedPairs: matched })
    }
  }, [accumulatedScore, accumulatedMoves, accumulatedTimeUsed, quiz, currentRound, totalRounds, roundTime, flowId, pairCount, moves, timeLeft, addPoints, recordQuizResult, completeFlow])

  // Time-up auto-complete
  useEffect(() => {
    if (timeLeft === 0 && started && !gameComplete) {
      const score = calculateScore(moves, matchedPairs)
      finishGame(score, matchedPairs)
    }
  }, [timeLeft, started, gameComplete, moves, matchedPairs, finishGame])

  // Check completion (all matched)
  useEffect(() => {
    if (matchedPairs === pairCount && matchedPairs > 0) {
      const score = calculateScore(moves, matchedPairs)
      finishGame(score, matchedPairs)
    }
  }, [matchedPairs, pairCount, moves, finishGame])

  const calculateScore = (m: number, matched: number): number => {
    if (matched === 0) return 0
    const matchBonus = matched * 2
    const moveScore = Math.max(0, pairCount - Math.max(0, m - pairCount))
    const timeBonus = timeLeft >= 20 ? 2 : timeLeft >= 10 ? 1 : 0
    return matchBonus + moveScore + timeBonus
  }

  const getStars = (): number => {
    if (matchedPairs < pairCount) return 1
    if (moves <= pairCount + 2) return 3
    if (moves <= pairCount + 6) return 2
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
    const newDeck = quiz ? buildFlowDeck(quiz.rounds[0].pairs) : buildDeck()
    setCurrentRound(0)
    setAccumulatedScore(0)
    setAccumulatedMoves(0)
    setAccumulatedTimeUsed(0)
    setDeck(newDeck)
    setStatuses(initStatuses(newDeck))
    setFlippedIds([])
    setMoves(0)
    setMatchedPairs(0)
    setTimeLeft(roundTime)
    setGameComplete(false)
    setShowCompletion(false)
    setStarted(false)
    lockRef.current = false
    track('card_match_play_again', { flowId })
  }, [quiz, roundTime, flowId])

  const quizTitle = quiz?.title ?? 'Card Match'

  const handleResults = useCallback(() => {
    navigate('/results', {
      state: { score: accumulatedScore, total: pairCount * totalRounds, quizTitle },
    })
  }, [accumulatedScore, pairCount, totalRounds, quizTitle, navigate])

  const handleBack = useCallback(() => {
    track('card_match_abandoned', { moves, timeLeft, matchedPairs, flowId })
    navigate(-1)
  }, [moves, timeLeft, matchedPairs, flowId, navigate])

  const handleNext = useCallback(() => {
    navigate('/results', {
      state: { score: accumulatedScore, total: pairCount * totalRounds, quizTitle },
    })
  }, [accumulatedScore, pairCount, totalRounds, quizTitle, navigate])

  const progressPercent = quiz
    ? ((currentRound + matchedPairs / pairCount) / totalRounds) * 100
    : (matchedPairs / pairCount) * 100

  return (
    <div
      className="card-match-page"
      data-page="card-match"
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
        <div className="card-match-header" data-section="header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--f-brand-space-sm)', marginBottom: 'var(--f-brand-space-lg)' }}>
          <button
            className="card-match-back-button"
            onClick={handleBack}
            aria-label="Go back"
            data-ui="back-btn"
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
            <svg className="card-match-back-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                className="card-match-back-icon-path"
                d="M15 18.5C14.87 18.5 14.74 18.45 14.65 18.35L8.65 12.35C8.55 12.26 8.5 12.13 8.5 12C8.5 11.87 8.55 11.74 8.65 11.65L14.65 5.65C14.84 5.46 15.16 5.46 15.35 5.65C15.54 5.84 15.54 6.16 15.35 6.35L9.71 12L15.35 17.65C15.54 17.84 15.54 18.16 15.35 18.35C15.26 18.45 15.13 18.5 15 18.5Z"
                fill="var(--f-brand-color-text-default)"
              />
            </svg>
          </button>
          <div className="card-match-progress-wrapper" style={{ flex: 1 }}>
            <div
              className="card-match-progress-track"
              style={{
                height: 8,
                background: 'var(--f-brand-color-border-default)',
                borderRadius: 'var(--f-brand-radius-rounded)',
                overflow: 'hidden',
              }}
            >
              <div
                className="card-match-progress-fill"
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
          className="card-match-title"
          data-section="title"
          style={{
            font: 'var(--f-brand-type-title-3)',
            color: 'var(--f-brand-color-text-default)',
            letterSpacing: 'var(--tracking-tight)',
            textAlign: 'center',
            marginBottom: quiz ? 'var(--f-brand-space-xs)' : 'var(--f-brand-space-lg)',
          }}
        >
          {quiz ? quiz.title : 'Match the cards'}
        </h1>
        {quiz && (
          <p className="card-match-round-label" style={{
            font: 'var(--f-brand-type-caption)',
            color: 'var(--f-brand-color-text-subtle)',
            textAlign: 'center',
            marginBottom: 'var(--f-brand-space-md)',
          }}>
            Round {currentRound + 1} of {totalRounds} · {quiz.rounds[currentRound].title}
          </p>
        )}

        {/* ── Card Grid ── */}
        <div
          className="card-match-grid"
          data-section="card-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: `repeat(${pairCount}, auto)`,
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

        {/* ── Stats row: matches + timer + moves ── */}
        <div
          className="card-match-stats-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--f-brand-space-lg)',
            marginBottom: 'var(--f-brand-space-lg)',
          }}
        >
          {/* Matched pairs counter */}
          <div className="card-match-matched-counter" style={{ textAlign: 'center', minWidth: 48 }}>
            <div
              className="card-match-matched-value"
              style={{
                font: 'var(--f-brand-type-headline-medium)',
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--weight-bold)',
                color: matchedPairs > 0 ? 'var(--f-brand-color-background-success)' : 'var(--f-brand-color-text-default)',
                transition: 'color var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-default)',
              }}
            >
              {matchedPairs}/{pairCount}
            </div>
            <div
              className="card-match-matched-label"
              style={{
                font: 'var(--f-brand-type-caption)',
                fontSize: 'var(--text-2xs)',
                color: 'var(--f-brand-color-text-subtle)',
                letterSpacing: 'var(--tracking-wider)',
                textTransform: 'uppercase',
                marginTop: 2,
              }}
            >
              Matched
            </div>
          </div>

          {/* Timer ring (center) */}
          <TimerRing timeLeft={timeLeft} total={roundTime} />

          {/* Moves counter */}
          <div className="card-match-moves-counter" style={{ textAlign: 'center', minWidth: 48 }}>
            <div
              className="card-match-moves-value"
              style={{
                font: 'var(--f-brand-type-headline-medium)',
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--f-brand-color-text-default)',
              }}
            >
              {moves}
            </div>
            <div
              className="card-match-moves-label"
              style={{
                font: 'var(--f-brand-type-caption)',
                fontSize: 'var(--text-2xs)',
                color: 'var(--f-brand-color-text-subtle)',
                letterSpacing: 'var(--tracking-wider)',
                textTransform: 'uppercase',
                marginTop: 2,
              }}
            >
              Moves
            </div>
          </div>
        </div>

        {/* ── Next button ── */}
        <div className="card-match-next-wrapper" style={{ marginTop: 'auto' }}>
          <button
            className="card-match-next-btn"
            onClick={handleNext}
            style={{
              width: '100%',
              height: 56,
              borderRadius: 'var(--f-brand-radius-rounded)',
              border: 'none',
              background: 'var(--f-brand-color-primary)',
              color: 'var(--f-brand-color-text-light)',
              font: 'var(--f-brand-type-body-medium)',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Next
          </button>
        </div>
      </div>

      {/* ── Completion overlay ── */}
      {showCompletion && (
        <CompletionOverlay
          totalMoves={accumulatedMoves}
          totalTimeUsed={accumulatedTimeUsed}
          stars={getStars()}
          pairCount={pairCount}
          totalRounds={totalRounds}
          onResults={handleResults}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}

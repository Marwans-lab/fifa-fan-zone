import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { WORLD_CUP_TEAMS } from '../data/teams'
import chevLeft from '../assets/icons/Chevron-left-white.svg'

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

const PAIR_COUNT = 6
const FLIP_DURATION = 400
const MISMATCH_DELAY = 800
const MATCH_DELAY = 500
const DEAL_STAGGER = 60

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

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Card back SVG pattern ──────────────────────────────────────────────────────

function CardBack() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'var(--r-md)',
        background: 'linear-gradient(135deg, rgba(142,33,87,0.4) 0%, rgba(0,212,170,0.2) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* Diamond pattern */}
      <svg width="40" height="40" viewBox="0 0 40 40" style={{ opacity: 0.25 }}>
        <path d="M20 4L36 20L20 36L4 20Z" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
        <path d="M20 12L28 20L20 28L12 20Z" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      </svg>
    </div>
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
  const isFlipped = status === 'flipped' || status === 'matched'
  const isMatched = status === 'matched'
  const isMismatched = status === 'mismatched'

  useEffect(() => {
    const t = setTimeout(() => setDealt(true), dealDelay)
    return () => clearTimeout(t)
  }, [dealDelay])

  const glowColor = isMatched
    ? 'var(--c-correct-glow)'
    : isMismatched
    ? 'var(--c-error-glow)'
    : 'transparent'

  return (
    <button
      onClick={onFlip}
      disabled={status !== 'hidden'}
      aria-label={isFlipped ? card.display : 'Hidden card'}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '3 / 4',
        perspective: 600,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: status === 'hidden' ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
        opacity: dealt ? 1 : 0,
        transform: dealt ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.85)',
        transition: `opacity 400ms var(--ease-out), transform 400ms var(--ease-out)`,
      }}
    >
      <style>{`
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
      `}</style>

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: isFlipped || isMismatched ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: `transform ${FLIP_DURATION}ms var(--ease-out)`,
          animation: isMismatched
            ? `card-shake 500ms var(--ease-out)`
            : isMatched
            ? `card-match-pop 400ms var(--ease-out)`
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
              ? 'var(--c-correct-bg)'
              : `linear-gradient(145deg, ${card.teamColors[0]}22, ${card.teamColors[1]}22)`,
            border: `1.5px solid ${
              isMatched
                ? 'var(--c-correct-border)'
                : isMismatched
                ? 'var(--c-error-border)'
                : 'var(--c-border)'
            }`,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--sp-1)',
            padding: 'var(--sp-2)',
            boxShadow: `0 0 16px ${glowColor}`,
            transition: 'box-shadow 300ms ease, border-color 300ms ease',
            overflow: 'hidden',
          }}
        >
          {card.type === 'flag' ? (
            <span style={{ fontSize: 36, lineHeight: 1 }}>{card.display}</span>
          ) : (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-med)',
                color: 'var(--c-text-1)',
                textAlign: 'center',
                lineHeight: 'var(--leading-snug)',
                letterSpacing: 'var(--tracking-snug)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {card.display}
            </span>
          )}

          {/* Subtle shimmer line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
            }}
          />
        </div>
      </div>
    </button>
  )
}

// ─── Stats pill ─────────────────────────────────────────────────────────────────

function StatPill({ icon, value }: { icon: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-1)',
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 'var(--r-full)',
        padding: '6px 12px',
        fontSize: 'var(--text-xs)',
        color: 'var(--c-text-2)',
        letterSpacing: 'var(--tracking-wide)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontWeight: 'var(--weight-med)' }}>{value}</span>
    </div>
  )
}

// ─── Completion overlay ─────────────────────────────────────────────────────────

interface CompletionProps {
  moves: number
  time: number
  stars: number
  onResults: () => void
  onPlayAgain: () => void
}

function CompletionOverlay({ moves, time, stars, onResults, onPlayAgain }: CompletionProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const label = stars === 3 ? 'Perfect!' : stars === 2 ? 'Great Job!' : 'Well Done!'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: visible ? 'rgba(5,5,10,0.85)' : 'rgba(5,5,10,0)',
        backdropFilter: visible ? 'blur(12px)' : 'blur(0px)',
        WebkitBackdropFilter: visible ? 'blur(12px)' : 'blur(0px)',
        transition: 'background 400ms ease, backdrop-filter 400ms ease',
        padding: 'var(--sp-6)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 320,
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--r-xl)',
          padding: 'var(--sp-8) var(--sp-6)',
          textAlign: 'center',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
          transition: 'opacity 500ms var(--ease-out) 150ms, transform 500ms var(--ease-out) 150ms',
        }}
      >
        {/* Stars */}
        <div style={{ fontSize: 40, marginBottom: 'var(--sp-4)', letterSpacing: 8 }}>
          {[1, 2, 3].map(i => (
            <span
              key={i}
              style={{
                opacity: i <= stars ? 1 : 0.2,
                filter: i <= stars ? 'drop-shadow(0 0 8px rgba(255,184,0,0.6))' : 'none',
                display: 'inline-block',
                transform: visible && i <= stars ? 'scale(1)' : 'scale(0.5)',
                transition: `transform 400ms var(--ease-out) ${300 + i * 150}ms, opacity 300ms ease ${300 + i * 150}ms`,
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
            color: 'var(--c-text-1)',
            marginBottom: 'var(--sp-2)',
            letterSpacing: 'var(--tracking-tight)',
          }}
        >
          {label}
        </h2>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--c-text-2)',
            marginBottom: 'var(--sp-6)',
            lineHeight: 'var(--leading-normal)',
          }}
        >
          You matched all {PAIR_COUNT} pairs
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
            <div
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--c-accent)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {moves}
            </div>
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--c-text-3)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginTop: 2 }}>
              Moves
            </div>
          </div>
          <div style={{ width: 1, background: 'var(--c-border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--c-accent)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {formatTime(time)}
            </div>
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--c-text-3)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginTop: 2 }}>
              Time
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <button
          onClick={onResults}
          className="btn"
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 'var(--r-full)',
            border: 'none',
            background: '#ffffff',
            color: 'var(--c-brand)',
            fontSize: 'var(--text-md)',
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
          className="btn"
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 'var(--r-full)',
            border: '1px solid var(--c-border)',
            background: 'var(--c-surface)',
            color: 'var(--c-text-1)',
            fontSize: 'var(--text-md)',
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
  const [time, setTime] = useState(0)
  const [gameComplete, setGameComplete] = useState(false)
  const [started, setStarted] = useState(false)

  const lockRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer
  useEffect(() => {
    if (started && !gameComplete) {
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [started, gameComplete])

  // Check completion
  useEffect(() => {
    if (matchedPairs === PAIR_COUNT && matchedPairs > 0) {
      setGameComplete(true)
      const score = calculateScore(moves, time)
      addPoints(score)
      recordQuizResult('card-match', score, PAIR_COUNT)
      track('card_match_completed', { moves, time, score, pairs: PAIR_COUNT })
    }
  }, [matchedPairs, moves, time, addPoints, recordQuizResult])

  const calculateScore = (m: number, t: number): number => {
    // Perfect: 6 moves (one per pair), each additional move -1 point, min 1
    const moveScore = Math.max(1, PAIR_COUNT - Math.max(0, m - PAIR_COUNT))
    // Time bonus: under 30s = +2, under 60s = +1
    const timeBonus = t <= 30 ? 2 : t <= 60 ? 1 : 0
    return moveScore + timeBonus
  }

  const getStars = (): number => {
    if (moves <= PAIR_COUNT + 2) return 3
    if (moves <= PAIR_COUNT + 6) return 2
    return 1
  }

  const handleFlip = useCallback((cardId: string) => {
    if (lockRef.current) return
    if (statuses[cardId] !== 'hidden') return

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
        // Match!
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
        // Mismatch — show shake then flip back
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
  }, [deck, statuses, flippedIds, started])

  const handlePlayAgain = useCallback(() => {
    const newDeck = buildDeck()
    setDeck(newDeck)
    const s: Record<string, CardStatus> = {}
    newDeck.forEach(c => { s[c.id] = 'hidden' })
    setStatuses(s)
    setFlippedIds([])
    setMoves(0)
    setMatchedPairs(0)
    setTime(0)
    setGameComplete(false)
    setStarted(false)
    lockRef.current = false
    track('card_match_play_again')
  }, [])

  const handleResults = useCallback(() => {
    const score = calculateScore(moves, time)
    navigate('/results', {
      state: { score, total: PAIR_COUNT, quizTitle: 'Card Match' },
    })
  }, [moves, time, navigate])

  const handleBack = useCallback(() => {
    track('card_match_abandoned', { moves, time, matchedPairs })
    navigate(-1)
  }, [moves, time, matchedPairs, navigate])

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
        {/* ── Top bar ── */}
        <div style={{ padding: 'var(--sp-4)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <button onClick={handleBack} className="btn-icon">
              <img src={chevLeft} width={24} height={24} alt="Back" />
            </button>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  height: 4,
                  background: 'var(--c-surface-raise)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(matchedPairs / PAIR_COUNT) * 100}%`,
                    background: 'var(--c-accent)',
                    borderRadius: 2,
                    transition: 'width 400ms var(--ease-out)',
                  }}
                />
              </div>
            </div>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--c-text-2)',
                flexShrink: 0,
              }}
            >
              {matchedPairs}/{PAIR_COUNT}
            </span>
          </div>
        </div>

        {/* ── Title + Stats ── */}
        <div style={{ padding: '0 var(--sp-4) var(--sp-4)', flexShrink: 0 }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--weight-light)',
              color: 'var(--c-text-1)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--sp-3)',
            }}
          >
            Match the Pairs
          </h1>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <StatPill icon="⏱" value={formatTime(time)} />
            <StatPill icon="👆" value={`${moves} moves`} />
          </div>
        </div>

        {/* ── Card Grid ── */}
        <div
          style={{
            flex: 1,
            padding: '0 var(--sp-4) var(--sp-8)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
            gap: 'var(--sp-2)',
            alignContent: 'start',
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
      </div>

      {/* ── Completion overlay ── */}
      {gameComplete && (
        <CompletionOverlay
          moves={moves}
          time={time}
          stars={getStars()}
          onResults={handleResults}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </Screen>
  )
}

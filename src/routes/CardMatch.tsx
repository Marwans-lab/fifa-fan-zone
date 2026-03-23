import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { WORLD_CUP_TEAMS } from '../data/teams'
import chevLeft from '../assets/icons/Chevron-left-white.svg'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchCard {
  id: number
  teamId: string
  flag: string
  name: string
  colors: [string, string]
  flipped: boolean
  matched: boolean
}

type GamePhase = 'ready' | 'playing' | 'complete'

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID_COLS = 3
const PAIR_COUNT = 6
const FLIP_DURATION = 400
const MATCH_DELAY = 600
const MISMATCH_DELAY = 900
const COUNTDOWN_START = 3

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildDeck(): MatchCard[] {
  const teams = shuffleArray(WORLD_CUP_TEAMS).slice(0, PAIR_COUNT)
  const cards: MatchCard[] = []
  teams.forEach((team, i) => {
    cards.push({
      id: i * 2,
      teamId: team.id,
      flag: team.flag,
      name: team.name,
      colors: team.colors,
      flipped: false,
      matched: false,
    })
    cards.push({
      id: i * 2 + 1,
      teamId: team.id,
      flag: team.flag,
      name: team.name,
      colors: team.colors,
      flipped: false,
      matched: false,
    })
  })
  return shuffleArray(cards)
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Card component ───────────────────────────────────────────────────────────

function FlipCard({
  card,
  index,
  onFlip,
  entranceDelay,
}: {
  card: MatchCard
  index: number
  onFlip: (id: number) => void
  entranceDelay: number
}) {
  const isUp = card.flipped || card.matched
  const [entered, setEntered] = useState(false)
  const [matchPulse, setMatchPulse] = useState(false)
  const prevMatched = useRef(card.matched)

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), entranceDelay)
    return () => clearTimeout(t)
  }, [entranceDelay])

  useEffect(() => {
    if (card.matched && !prevMatched.current) {
      setMatchPulse(true)
      const t = setTimeout(() => setMatchPulse(false), 500)
      prevMatched.current = true
      return () => clearTimeout(t)
    }
    prevMatched.current = card.matched
  }, [card.matched])

  return (
    <button
      aria-label={isUp ? `${card.name} card` : `Hidden card ${index + 1}`}
      onClick={() => onFlip(card.id)}
      disabled={isUp}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '3 / 4',
        perspective: '600px',
        border: 'none',
        background: 'transparent',
        cursor: isUp ? 'default' : 'pointer',
        WebkitTapHighlightColor: 'transparent',
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.85)',
        transition: `opacity 380ms var(--ease-out) ${entranceDelay}ms, transform 380ms var(--ease-out) ${entranceDelay}ms`,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: isUp ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: `transform ${FLIP_DURATION}ms var(--ease-out)`,
        }}
      >
        {/* ── Card back (face-down) ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            borderRadius: 'var(--r-md)',
            background: 'var(--c-surface)',
            border: '1.5px solid var(--c-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Pattern */}
          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.06,
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 8px,
              rgba(255,255,255,0.3) 8px,
              rgba(255,255,255,0.3) 9px
            )`,
          }} />
          {/* FIFA logo/icon */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.25 }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 2C12 2 8 7 8 12s4 10 4 10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 2C12 2 16 7 16 12s-4 10-4 10" stroke="currentColor" strokeWidth="1.5" />
            <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        {/* ── Card front (face-up) ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: 'var(--r-md)',
            background: `linear-gradient(135deg, ${card.colors[0]}, ${card.colors[1]})`,
            border: `1.5px solid ${card.matched ? 'var(--c-correct-border)' : 'var(--c-border-raise)'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--sp-1)',
            overflow: 'hidden',
            boxShadow: matchPulse
              ? `0 0 20px var(--c-correct-glow), 0 0 40px var(--c-correct-glow)`
              : card.matched
              ? `0 0 12px var(--c-correct-glow)`
              : `0 4px 16px rgba(0,0,0,0.3)`,
            transition: `box-shadow 400ms var(--ease-out), border-color 300ms var(--ease-out)`,
          }}
        >
          {/* Shine overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)',
            pointerEvents: 'none',
          }} />
          {/* Match checkmark */}
          {card.matched && (
            <div style={{
              position: 'absolute',
              top: 'var(--sp-2)',
              right: 'var(--sp-2)',
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'var(--c-correct)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: '#fff',
              fontWeight: 600,
              opacity: matchPulse ? 1 : 0.9,
              transform: matchPulse ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 300ms var(--ease-out), opacity 300ms var(--ease-out)',
            }}>
              ✓
            </div>
          )}
          <span style={{
            fontSize: 32,
            lineHeight: 1,
            zIndex: 1,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          }}>
            {card.flag}
          </span>
          <span style={{
            fontSize: 'var(--text-2xs)',
            fontWeight: 'var(--weight-med)',
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            letterSpacing: 'var(--tracking-wide)',
            textTransform: 'uppercase',
            zIndex: 1,
            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            padding: '0 var(--sp-1)',
            lineHeight: 'var(--leading-tight)',
          }}>
            {card.name}
          </span>
        </div>
      </div>
    </button>
  )
}

// ─── Countdown overlay ────────────────────────────────────────────────────────

function Countdown({ count, onDone }: { count: number; onDone: () => void }) {
  const [current, setCurrent] = useState(count)

  useEffect(() => {
    if (current <= 0) {
      onDone()
      return
    }
    const t = setTimeout(() => setCurrent(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [current, onDone])

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      background: 'rgba(5,5,10,0.7)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
      <div
        key={current}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: current === 0 ? 'var(--text-2xl)' : '72px',
          fontWeight: 'var(--weight-light)',
          color: 'var(--c-text-1)',
          animation: 'match-countdown-pop 800ms var(--ease-out) both',
        }}
      >
        {current === 0 ? 'Go!' : current}
      </div>
      <style>{`
        @keyframes match-countdown-pop {
          0% { opacity: 0; transform: scale(0.5); }
          40% { opacity: 1; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

// ─── Completion overlay ───────────────────────────────────────────────────────

function CompletionOverlay({
  moves,
  elapsed,
  pairs,
  onPlayAgain,
  onHome,
}: {
  moves: number
  elapsed: number
  pairs: number
  onPlayAgain: () => void
  onHome: () => void
}) {
  const efficiency = Math.max(0, Math.round(((pairs / moves) * 100)))
  const stars = efficiency >= 90 ? 3 : efficiency >= 60 ? 2 : 1
  const label = stars === 3 ? 'Perfect Memory!' : stars === 2 ? 'Great Job!' : 'Well Done!'

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      background: 'rgba(5,5,10,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      animation: 'match-fade-in 400ms var(--ease-out) both',
      padding: 'var(--sp-6)',
    }}>
      {/* Stars */}
      <div style={{
        display: 'flex',
        gap: 'var(--sp-2)',
        marginBottom: 'var(--sp-5)',
        animation: 'match-stars-in 600ms var(--ease-out) 200ms both',
      }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              fontSize: 40,
              opacity: i < stars ? 1 : 0.2,
              transform: i < stars ? 'scale(1)' : 'scale(0.8)',
              transition: `opacity 300ms ease ${300 + i * 150}ms, transform 300ms var(--ease-out) ${300 + i * 150}ms`,
              filter: i < stars ? 'drop-shadow(0 0 8px rgba(255,184,0,0.5))' : 'none',
            }}
          >
            ⭐
          </div>
        ))}
      </div>

      {/* Label */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-2xl)',
        fontWeight: 'var(--weight-light)',
        color: 'var(--c-text-1)',
        marginBottom: 'var(--sp-2)',
        animation: 'match-slide-up 400ms var(--ease-out) 400ms both',
      }}>
        {label}
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex',
        gap: 'var(--sp-8)',
        marginBottom: 'var(--sp-8)',
        animation: 'match-slide-up 400ms var(--ease-out) 550ms both',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-med)',
            color: 'var(--c-accent)',
          }}>
            {moves}
          </div>
          <div style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--c-text-2)',
            letterSpacing: 'var(--tracking-wide)',
            textTransform: 'uppercase',
          }}>
            Moves
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-med)',
            color: 'var(--c-accent)',
          }}>
            {formatTime(elapsed)}
          </div>
          <div style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--c-text-2)',
            letterSpacing: 'var(--tracking-wide)',
            textTransform: 'uppercase',
          }}>
            Time
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-med)',
            color: 'var(--c-accent)',
          }}>
            {efficiency}%
          </div>
          <div style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--c-text-2)',
            letterSpacing: 'var(--tracking-wide)',
            textTransform: 'uppercase',
          }}>
            Accuracy
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-3)',
        width: '100%',
        maxWidth: 280,
        animation: 'match-slide-up 400ms var(--ease-out) 700ms both',
      }}>
        <button
          onClick={onPlayAgain}
          className="btn btn-primary"
          style={{ width: '100%', padding: 'var(--sp-4) 0' }}
        >
          Play Again
        </button>
        <button
          onClick={onHome}
          className="btn btn-secondary"
          style={{ width: '100%', padding: 'var(--sp-4) 0' }}
        >
          Back to Home
        </button>
      </div>

      <style>{`
        @keyframes match-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes match-stars-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes match-slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Main route ───────────────────────────────────────────────────────────────

export default function CardMatchRoute() {
  const navigate = useNavigate()
  const { addPoints, recordQuizResult } = useStore()

  const [cards, setCards] = useState<MatchCard[]>(() => buildDeck())
  const [phase, setPhase] = useState<GamePhase>('ready')
  const [selected, setSelected] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matchCount, setMatchCount] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer
  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = setInterval(() => setElapsed(t => t + 1), 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase])

  // Check for game completion
  useEffect(() => {
    if (matchCount === PAIR_COUNT && phase === 'playing') {
      if (timerRef.current) clearInterval(timerRef.current)

      const score = Math.max(1, PAIR_COUNT - Math.max(0, moves - PAIR_COUNT))
      addPoints(score)
      recordQuizResult('card-match', score, PAIR_COUNT)
      track('card_match_completed', { moves, elapsed, pairs: PAIR_COUNT, score })

      setTimeout(() => setPhase('complete'), 600)
    }
  }, [matchCount, phase, moves, elapsed, addPoints, recordQuizResult])

  const handleCountdownDone = useCallback(() => {
    setPhase('playing')
    track('card_match_started', { pairs: PAIR_COUNT })
  }, [])

  const handleFlip = useCallback((id: number) => {
    if (phase !== 'playing' || isLocked) return
    if (selected.length >= 2) return

    const cardIdx = cards.findIndex(c => c.id === id)
    if (cardIdx < 0 || cards[cardIdx].flipped || cards[cardIdx].matched) return
    if (selected.includes(id)) return

    const newCards = [...cards]
    newCards[cardIdx] = { ...newCards[cardIdx], flipped: true }
    setCards(newCards)

    const newSelected = [...selected, id]
    setSelected(newSelected)

    track('card_match_flip', { cardId: id, teamId: newCards[cardIdx].teamId })

    if (newSelected.length === 2) {
      setMoves(m => m + 1)
      setIsLocked(true)

      const first = newCards.find(c => c.id === newSelected[0])!
      const second = newCards.find(c => c.id === newSelected[1])!

      if (first.teamId === second.teamId) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.teamId === first.teamId ? { ...c, matched: true } : c
          ))
          setMatchCount(m => m + 1)
          setSelected([])
          setIsLocked(false)
          track('card_match_pair_found', { teamId: first.teamId })
        }, MATCH_DELAY)
      } else {
        // Mismatch — flip back
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            newSelected.includes(c.id) ? { ...c, flipped: false } : c
          ))
          setSelected([])
          setIsLocked(false)
        }, MISMATCH_DELAY)
      }
    }
  }, [phase, isLocked, selected, cards])

  const handlePlayAgain = useCallback(() => {
    setCards(buildDeck())
    setPhase('ready')
    setSelected([])
    setMoves(0)
    setMatchCount(0)
    setElapsed(0)
    setIsLocked(false)
    track('card_match_play_again')
  }, [])

  const handleBack = useCallback(() => {
    track('card_match_abandoned', { moves, elapsed })
    navigate(-1)
  }, [moves, elapsed, navigate])

  const handleHome = useCallback(() => {
    navigate('/card')
  }, [navigate])

  return (
    <Screen>
      <div
        className="page-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          maxWidth: 420,
          margin: '0 auto',
          width: '100%',
          position: 'relative',
        }}
      >
        {/* ── Top bar ── */}
        <div style={{
          padding: 'var(--sp-4)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-3)',
        }}>
          <button onClick={handleBack} className="btn-icon" aria-label="Go back">
            <img src={chevLeft} width={24} height={24} alt="" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-light)',
              color: 'var(--c-text-1)',
              lineHeight: 'var(--leading-tight)',
            }}>
              Card Match
            </div>
          </div>
          {phase !== 'ready' && (
            <div style={{
              display: 'flex',
              gap: 'var(--sp-4)',
              alignItems: 'center',
            }}>
              <StatChip label="Moves" value={moves} />
              <StatChip label="Time" value={formatTime(elapsed)} />
            </div>
          )}
        </div>

        {/* ── Progress ── */}
        <div style={{
          padding: '0 var(--sp-4)',
          marginBottom: 'var(--sp-3)',
          flexShrink: 0,
        }}>
          <div style={{
            height: 3,
            background: 'var(--c-surface-raise)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(matchCount / PAIR_COUNT) * 100}%`,
              background: 'var(--c-accent)',
              borderRadius: 2,
              transition: 'width 400ms var(--ease-out)',
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 'var(--sp-1)',
          }}>
            <span style={{
              fontSize: 'var(--text-2xs)',
              color: 'var(--c-text-2)',
              letterSpacing: 'var(--tracking-wide)',
            }}>
              {matchCount}/{PAIR_COUNT} pairs
            </span>
            <span style={{
              fontSize: 'var(--text-2xs)',
              color: matchCount === PAIR_COUNT ? 'var(--c-correct)' : 'var(--c-text-3)',
              letterSpacing: 'var(--tracking-wide)',
              transition: 'color 300ms var(--ease-out)',
            }}>
              {matchCount === PAIR_COUNT ? 'Complete!' : 'Find all pairs'}
            </span>
          </div>
        </div>

        {/* ── Card grid ── */}
        <div style={{
          flex: 1,
          padding: '0 var(--sp-4) var(--sp-4)',
          display: 'flex',
          alignItems: 'center',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gap: 'var(--sp-3)',
            width: '100%',
          }}>
            {cards.map((card, idx) => (
              <FlipCard
                key={card.id}
                card={card}
                index={idx}
                onFlip={handleFlip}
                entranceDelay={80 + idx * 50}
              />
            ))}
          </div>
        </div>

        {/* ── Countdown overlay ── */}
        {phase === 'ready' && (
          <Countdown count={COUNTDOWN_START} onDone={handleCountdownDone} />
        )}

        {/* ── Completion overlay ── */}
        {phase === 'complete' && (
          <CompletionOverlay
            moves={moves}
            elapsed={elapsed}
            pairs={PAIR_COUNT}
            onPlayAgain={handlePlayAgain}
            onHome={handleHome}
          />
        )}
      </div>
    </Screen>
  )
}

// ─── Small stat chip ──────────────────────────────────────────────────────────

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: 48,
    }}>
      <span style={{
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-med)',
        color: 'var(--c-text-1)',
        lineHeight: 'var(--leading-tight)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </span>
      <span style={{
        fontSize: 'var(--text-2xs)',
        color: 'var(--c-text-3)',
        letterSpacing: 'var(--tracking-wider)',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  )
}

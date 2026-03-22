import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { WORLD_CUP_TEAMS } from '../data/teams'
import type { WorldCupTeam } from '../data/teams'
import tickWhite from '../assets/icons/Tick-white.svg'

// ─── Search icon (inline SVG) ─────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11.5 11.5L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// ─── Team card component ──────────────────────────────────────────────────────
interface TeamCardProps {
  team: WorldCupTeam
  selected: boolean
  onSelect: (id: string) => void
}

function TeamCard({ team, selected, onSelect }: TeamCardProps) {
  const [c1, c2] = team.colors

  return (
    <button
      onClick={() => onSelect(team.id)}
      aria-label={`Select ${team.name}`}
      aria-pressed={selected}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-2)',
        padding: 'var(--sp-4) var(--sp-2)',
        background: selected
          ? `linear-gradient(160deg, ${c1}33, ${c2}33)`
          : 'var(--glass-bg)',
        border: selected
          ? `2px solid ${c1}`
          : '1px solid var(--c-border)',
        borderRadius: 'var(--r-lg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        color: 'var(--c-text-1)',
        textAlign: 'center',
        transition: `background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out), transform var(--dur-fast) var(--ease-out)`,
        WebkitTapHighlightColor: 'transparent',
        minHeight: 100,
        overflow: 'hidden',
      }}
    >
      {/* Selected checkmark */}
      {selected && (
        <div style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: c1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img src={tickWhite} width={12} height={12} alt="" />
        </div>
      )}

      {/* Flag + color gradient circle */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        flexShrink: 0,
        border: '2px solid rgba(255,255,255,0.12)',
        boxShadow: selected ? `0 4px 16px ${c1}55` : 'none',
        transition: 'box-shadow var(--dur-base) var(--ease-out)',
      }}>
        {team.flag}
      </div>

      {/* Team name */}
      <span style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-med)',
        lineHeight: 'var(--leading-tight)',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {team.name}
      </span>
    </button>
  )
}

// ─── Main TeamSelection route ─────────────────────────────────────────────────
export default function TeamSelection() {
  const navigate = useNavigate()
  const { updateFanCard } = useStore()
  const [query, setQuery] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  const filtered = useMemo(
    () => WORLD_CUP_TEAMS.filter(t =>
      t.name.toLowerCase().includes(query.toLowerCase())
    ),
    [query]
  )

  function handleSelect(id: string) {
    setSelectedTeamId(prev => prev === id ? null : id)
  }

  function handleContinue() {
    if (!selectedTeamId) return
    updateFanCard({ teamId: selectedTeamId })
    track('team_selection_confirmed', { teamId: selectedTeamId })
    navigate('/identity', { state: { fromTeamSelection: true } })
  }

  return (
    <Screen>
      <div className="page-in" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: 'var(--sp-6) var(--sp-5) 0',
      }}>

        {/* Header */}
        <div style={{ flexShrink: 0, marginBottom: 'var(--sp-5)' }}>
          <div style={{
            fontSize: 'var(--text-2xs)',
            letterSpacing: 'var(--tracking-wider)',
            textTransform: 'uppercase',
            color: 'var(--c-accent)',
            marginBottom: 'var(--sp-2)',
            fontWeight: 'var(--weight-med)',
          }}>
            Step 1 of 2
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--weight-light)',
            letterSpacing: 'var(--tracking-tight)',
            marginBottom: 'var(--sp-1)',
          }}>
            Choose your team
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)' }}>
            Select the country you'll be supporting
          </p>
        </div>

        {/* Search bar */}
        <div style={{
          flexShrink: 0,
          marginBottom: 'var(--sp-4)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            left: 'var(--sp-4)',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--c-text-3)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
          }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search teams..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 'var(--sp-10)' }}
          />
        </div>

        {/* Team grid — scrollable */}
        <div className="scroll-y" style={{
          flex: 1,
          paddingBottom: selectedTeamId ? 'var(--sp-20)' : 'var(--sp-6)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--sp-2)',
          }}>
            {filtered.map(team => (
              <TeamCard
                key={team.id}
                team={team}
                selected={selectedTeamId === team.id}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: 'var(--sp-12) var(--sp-4)',
              color: 'var(--c-text-3)',
            }}>
              <p style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--sp-2)' }}>
                No teams found
              </p>
              <p style={{ fontSize: 'var(--text-sm)' }}>
                Try a different search
              </p>
            </div>
          )}
        </div>

        {/* Sticky continue button */}
        {selectedTeamId && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 'var(--sp-4) var(--sp-5)',
            paddingBottom: 'calc(var(--sp-6) + env(safe-area-inset-bottom, 0px))',
            background: 'linear-gradient(to top, var(--c-bg) 60%, transparent)',
            zIndex: 'var(--z-overlay)',
          }}>
            <button
              onClick={handleContinue}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </Screen>
  )
}

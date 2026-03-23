import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { track } from '../lib/analytics'
import { WORLD_CUP_TEAMS } from '../data/teams'

export default function TeamSelection() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const filtered = WORLD_CUP_TEAMS.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase())
  )

  function handleBack() {
    track('team_selection_back_tapped')
    navigate('/')
  }

  function handleTeamSelect(id: string) {
    track('team_selection_team_selected', { teamId: id })
    navigate('/picture', { state: { teamId: id } })
  }

  return (
    <div style={{
      height: '100%',
      width: '100%',
      background: 'var(--c-lt-bg)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="page-in" style={{
        flexShrink: 0,
        padding: 'var(--sp-5) var(--sp-5) 0',
      }}>
        {/* Back button */}
        <button
          onClick={handleBack}
          aria-label="Go back"
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--r-full)',
            border: '1px solid var(--c-lt-border)',
            background: 'var(--c-lt-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginBottom: 'var(--sp-5)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="var(--c-lt-text-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Title & subtitle */}
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--weight-light)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
          color: 'var(--c-lt-text-1)',
          marginBottom: 'var(--sp-1)',
        }}>
          Choose your team
        </h2>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--c-lt-text-2)',
          marginBottom: 'var(--sp-5)',
        }}>
          Select the country you're supporting
        </p>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 'var(--sp-4)' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              position: 'absolute',
              left: 'var(--sp-4)',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          >
            <circle cx="11" cy="11" r="7" stroke="var(--c-lt-text-2)" strokeWidth="2" />
            <path d="M20 20l-4-4" stroke="var(--c-lt-text-2)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search teams..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--sp-3) var(--sp-4) var(--sp-3) var(--sp-10)',
              background: 'var(--c-lt-surface)',
              border: '1px solid var(--c-lt-border)',
              borderRadius: 'var(--r-full)',
              color: 'var(--c-lt-text-1)',
              fontSize: 'var(--text-md)',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* ── Team list ──────────────────────────────────────────── */}
      <div
        className="scroll-y stagger"
        style={{
          flex: 1,
          padding: '0 var(--sp-5) var(--sp-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-2)',
        }}
      >
        {filtered.map(team => (
          <button
            key={team.id}
            onClick={() => handleTeamSelect(team.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-3)',
              padding: 'var(--sp-3) var(--sp-4)',
              background: 'var(--c-lt-surface)',
              border: '1px solid var(--c-lt-border)',
              borderRadius: 'var(--r-md)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: 'var(--c-lt-text-1)',
              textAlign: 'left',
              flexShrink: 0,
              width: '100%',
              WebkitTapHighlightColor: 'transparent',
              transition: 'background var(--dur-base) var(--ease-out), transform var(--dur-fast) var(--ease-out)',
            }}
          >
            {/* Flag circle with team colours */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--r-full)',
              flexShrink: 0,
              background: `linear-gradient(135deg, ${team.colors[0]}, ${team.colors[1]})`,
              border: '1px solid var(--c-lt-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}>
              {team.flag}
            </div>

            {/* Team name */}
            <span style={{
              fontSize: 'var(--text-md)',
              fontWeight: 'var(--weight-reg)',
              flex: 1,
              color: 'var(--c-lt-text-1)',
            }}>
              {team.name}
            </span>

            {/* Chevron */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M9 5l7 7-7 7" stroke="var(--c-lt-text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}

        {filtered.length === 0 && (
          <p style={{
            textAlign: 'center',
            color: 'var(--c-lt-text-2)',
            fontSize: 'var(--text-sm)',
            padding: 'var(--sp-8) 0',
          }}>
            No teams found
          </p>
        )}
      </div>
    </div>
  )
}

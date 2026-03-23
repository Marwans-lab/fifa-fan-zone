import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { track } from '../lib/analytics'
import { WORLD_CUP_TEAMS } from '../data/teams'

/* ── Progress bar (reused from Picture flow) ──────────────────────────────── */
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      style={{
        flex: 1,
        height: 8,
        borderRadius: 'var(--r-full)',
        background: 'var(--c-lt-border)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: '100%',
          borderRadius: 'var(--r-full)',
          background: 'linear-gradient(-90deg, var(--c-correct) 61.5%, var(--c-lt-correct-dark) 100%)',
          boxShadow: '1px 0px 6px rgba(0,0,0,0.25)',
          transition: `width var(--dur-slow) var(--ease-out)`,
        }}
      />
    </div>
  )
}

/* ── TeamSelection ────────────────────────────────────────────────────────── */
export default function TeamSelection() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedTeam = selectedId
    ? WORLD_CUP_TEAMS.find(t => t.id === selectedId)
    : null

  /* close dropdown on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleBack() {
    track('team_selection_back_tapped')
    navigate('/')
  }

  function handleTeamSelect(id: string) {
    track('team_selection_team_selected', { teamId: id })
    setSelectedId(id)
    setOpen(false)
  }

  function handleContinue() {
    if (!selectedId) return
    navigate('/picture', { state: { teamId: selectedId } })
  }

  return (
    <div
      className="page-in"
      style={{
        height: '100%',
        width: '100%',
        background: 'var(--c-lt-bg)',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--sp-5)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ── Row: Back button + Progress bar ─────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-4)',
        flexShrink: 0,
      }}>
        <button
          onClick={handleBack}
          aria-label="Go back"
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--r-full)',
            border: 'none',
            background: 'var(--c-lt-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="var(--c-lt-text-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <ProgressBar progress={50} />
      </div>

      {/* ── Title ───────────────────────────────────────────────── */}
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 28,
        lineHeight: '36px',
        fontWeight: 'var(--weight-light)',
        color: 'var(--c-lt-text-1)',
        textAlign: 'center',
        marginTop: 'var(--sp-8)',
        marginBottom: 'var(--sp-8)',
      }}>
        Select your team
      </h2>

      {/* ── Dropdown ────────────────────────────────────────────── */}
      <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
        {/* Trigger input */}
        <button
          onClick={() => setOpen(prev => !prev)}
          aria-haspopup="listbox"
          aria-expanded={open}
          style={{
            width: '100%',
            height: 48,
            background: 'var(--c-lt-surface)',
            border: '1px solid var(--c-lt-border)',
            borderRadius: 'var(--r-sm)',
            padding: '0 var(--sp-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 16,
            color: selectedTeam ? 'var(--c-lt-text-1)' : 'var(--c-lt-text-2)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span>{selectedTeam ? selectedTeam.name : 'Select a team'}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              flexShrink: 0,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: `transform var(--dur-base) var(--ease-out)`,
            }}
          >
            <path d="M6 9l6 6 6-6" stroke="var(--c-lt-text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Listbox */}
        {open && (
          <ul
            role="listbox"
            style={{
              position: 'absolute',
              top: 'calc(100% + var(--sp-2))',
              left: 0,
              right: 0,
              background: 'var(--c-lt-surface)',
              borderRadius: 'var(--r-sm)',
              boxShadow: '0px 2px 4px 2px var(--c-lt-shadow)',
              padding: '0 var(--sp-4)',
              maxHeight: 280,
              overflowY: 'auto',
              zIndex: 10,
              listStyle: 'none',
              margin: 0,
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--c-lt-text-3) transparent',
            }}
          >
            {WORLD_CUP_TEAMS.map((team, i) => (
              <li
                key={team.id}
                role="option"
                aria-selected={team.id === selectedId}
                onClick={() => handleTeamSelect(team.id)}
                style={{
                  padding: 'var(--sp-4) 0',
                  borderBottom: i < WORLD_CUP_TEAMS.length - 1
                    ? '1px solid var(--c-lt-bg)'
                    : 'none',
                  fontSize: 16,
                  color: 'var(--c-lt-text-1)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {team.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Spacer ──────────────────────────────────────────────── */}
      <div style={{ flex: 1 }} />

      {/* ── "Already have a card? Log in" ───────────────────────── */}
      <p style={{
        textAlign: 'center',
        fontSize: 18,
        color: 'var(--c-lt-text-1)',
        marginBottom: 'var(--sp-4)',
        flexShrink: 0,
      }}>
        Already have a card?{' '}
        <span style={{
          fontWeight: 'var(--weight-med)',
          textDecoration: 'underline',
          cursor: 'pointer',
        }}>
          Log in
        </span>
      </p>

      {/* ── Continue button ─────────────────────────────────────── */}
      <button
        onClick={handleContinue}
        disabled={!selectedId}
        style={{
          width: '100%',
          height: 56,
          borderRadius: 32,
          border: 'none',
          background: 'var(--c-lt-brand)',
          color: 'var(--c-lt-surface)',
          fontSize: 16,
          fontWeight: 'var(--weight-med)',
          fontFamily: 'inherit',
          cursor: selectedId ? 'pointer' : 'default',
          opacity: selectedId ? 1 : 0.5,
          transition: `opacity var(--dur-base) var(--ease-out)`,
          flexShrink: 0,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Continue
      </button>
    </div>
  )
}

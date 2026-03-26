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
        borderRadius: 'var(--f-brand-radius-rounded)',
        background: 'var(--f-brand-color-border-default)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: '100%',
          borderRadius: 'var(--f-brand-radius-rounded)',
          background: 'linear-gradient(-90deg, var(--f-brand-color-border-success) 61.5%, var(--f-brand-color-background-success) 100%)',
          boxShadow: '1px 0px 6px var(--f-brand-shadow-large)',
          transition: `width var(--f-brand-motion-duration-quick) var(--f-brand-motion-easing-exit)`,
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
      className="f-page-enter"
      style={{
        height: '100%',
        width: '100%',
        background: 'var(--f-brand-color-background-default)',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--f-brand-space-md)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ── Row: Back button + Progress bar ─────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--f-brand-space-md)',
        flexShrink: 0,
      }}>
        <button
          onClick={handleBack}
          aria-label="Go back"
          style={{
            width: 'var(--sp-12)',
            height: 'var(--sp-12)',
            borderRadius: 'var(--f-brand-radius-rounded)',
            border: 'none',
            background: 'var(--f-brand-color-background-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 19l-7-7 7-7" stroke="var(--f-brand-color-text-default)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <ProgressBar progress={50} />
      </div>

      {/* ── Title ───────────────────────────────────────────────── */}
      <h2 style={{
        fontFamily: 'var(--f-base-type-family-primary)',
        fontSize: 28,
        lineHeight: 'var(--sp-9)',
        fontWeight: '300',
        color: 'var(--f-brand-color-text-default)',
        textAlign: 'center',
        marginTop: 'var(--f-brand-space-xl)',
        marginBottom: 'var(--f-brand-space-xl)',
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
            height: 'var(--sp-12)',
            background: 'var(--f-brand-color-background-light)',
            border: '1px solid var(--f-brand-color-border-default)',
            borderRadius: 'var(--f-brand-radius-base)',
            padding: '0 var(--f-brand-space-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 16,
            color: selectedTeam ? 'var(--f-brand-color-text-default)' : 'var(--f-brand-color-text-subtle)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span>{selectedTeam ? selectedTeam.name : 'Select a team'}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{
              flexShrink: 0,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: `transform var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)`,
            }}
          >
            <path d="M6 9l6 6 6-6" stroke="var(--f-brand-color-text-subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Listbox */}
        {open && (
          <ul
            role="listbox"
            style={{
              position: 'absolute',
              top: 'calc(100% + var(--f-brand-space-xs))',
              left: 0,
              right: 0,
              background: 'var(--f-brand-color-background-light)',
              borderRadius: 'var(--f-brand-radius-base)',
              boxShadow: '0px 2px 4px 2px var(--f-brand-shadow-medium)',
              padding: '0 var(--f-brand-space-md)',
              maxHeight: 280,
              overflowY: 'auto',
              zIndex: 10,
              listStyle: 'none',
              margin: 0,
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--f-brand-color-text-muted) transparent',
            }}
          >
            {WORLD_CUP_TEAMS.map((team, i) => (
              <li
                key={team.id}
                role="option"
                aria-selected={team.id === selectedId}
                onClick={() => handleTeamSelect(team.id)}
                style={{
                  padding: 'var(--f-brand-space-md) 0',
                  borderBottom: i < WORLD_CUP_TEAMS.length - 1
                    ? '1px solid var(--f-brand-color-background-default)'
                    : 'none',
                  fontSize: 16,
                  color: 'var(--f-brand-color-text-default)',
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
        color: 'var(--f-brand-color-text-default)',
        marginBottom: 'var(--f-brand-space-md)',
        flexShrink: 0,
      }}>
        Already have a card?{' '}
        <span style={{ fontWeight: '500' }}>Log in</span>
      </p>

      {/* ── Continue button ─────────────────────────────────────── */}
      <button
        onClick={handleContinue}
        disabled={!selectedId}
        style={{
          width: '100%',
          height: 'var(--sp-14)',
          borderRadius: 'var(--f-brand-radius-rounded)',
          border: 'none',
          background: 'var(--f-brand-color-primary)',
          color: 'var(--f-brand-color-background-light)',
          fontSize: 16,
          fontWeight: '500',
          fontFamily: 'inherit',
          cursor: selectedId ? 'pointer' : 'default',
          opacity: selectedId ? 1 : 0.5,
          transition: `opacity var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)`,
          flexShrink: 0,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Continue
      </button>
    </div>
  )
}

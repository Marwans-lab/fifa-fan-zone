import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { WORLD_CUP_TEAMS } from '../data/teams'
import chevLeft from '../assets/icons/Chevron-left-white.svg'

// ─── Chevron-down icon (inline SVG) ──────────────────────────────────────────
function ChevronDownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="#6e7780" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Light-theme colors (matching Figma spec) ────────────────────────────────
const LIGHT = {
  bg: '#f2f3fa',
  surface: '#ffffff',
  border: '#dbdee8',
  text: '#1f212b',
  textMuted: '#6e7780',
  progressTrack: '#dbdee8',
  progressFillFrom: '#34DB80',
  progressFillTo: '#1C7544',
  brand: '#8e2157',
  shadow: '0px 2px 4px 2px rgba(31,33,43,0.08)',
  scrollThumb: '#4a525d',
} as const

export default function TeamSelection() {
  const navigate = useNavigate()
  const { updateFanCard } = useStore()
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [query, setQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedTeam = useMemo(
    () => WORLD_CUP_TEAMS.find(t => t.id === selectedTeamId) ?? null,
    [selectedTeamId]
  )

  const filtered = useMemo(
    () => WORLD_CUP_TEAMS.filter(t =>
      t.name.toLowerCase().includes(query.toLowerCase())
    ),
    [query]
  )

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setQuery('')
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  // Focus the search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [dropdownOpen])

  function handleSelect(id: string) {
    setSelectedTeamId(id)
    setDropdownOpen(false)
    setQuery('')
    track('team_selection_picked', { teamId: id })
  }

  function handleContinue() {
    if (!selectedTeamId) return
    updateFanCard({ teamId: selectedTeamId })
    track('team_selection_confirmed', { teamId: selectedTeamId })
    navigate('/identity', { state: { fromTeamSelection: true } })
  }

  function handleBack() {
    navigate(-1)
  }

  return (
    <div className="page-in" style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      background: LIGHT.bg,
      fontFamily: 'var(--font-body)',
      color: LIGHT.text,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>

      {/* ── Top bar: back button + progress bar ─────────────────── */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-3)',
        padding: 'var(--sp-4) var(--sp-4) 0',
        paddingTop: 'calc(var(--sp-4) + env(safe-area-inset-top, 0px))',
      }}>
        <button
          onClick={handleBack}
          aria-label="Go back"
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--r-full)',
            background: LIGHT.surface,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: LIGHT.shadow,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <img
            src={chevLeft}
            width={24}
            height={24}
            alt=""
            style={{ filter: 'brightness(0)' }}
          />
        </button>

        {/* Progress bar */}
        <div style={{
          flex: 1,
          height: 8,
          borderRadius: 'var(--r-full)',
          background: LIGHT.progressTrack,
          overflow: 'hidden',
        }}>
          <div style={{
            width: '50%',
            height: '100%',
            borderRadius: 'var(--r-full)',
            background: `linear-gradient(90deg, ${LIGHT.progressFillFrom}, ${LIGHT.progressFillTo})`,
            transition: 'width var(--dur-slow) var(--ease-out)',
          }} />
        </div>
      </div>

      {/* ── Title ───────────────────────────────────────────────── */}
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-2xl)',
        fontWeight: 'var(--weight-thin)',
        lineHeight: '36px',
        color: LIGHT.text,
        textAlign: 'center',
        margin: 0,
        padding: 'var(--sp-8) var(--sp-5) 0',
      }}>
        Select your team
      </h2>

      {/* ── Dropdown selector ───────────────────────────────────── */}
      <div
        ref={dropdownRef}
        style={{
          position: 'relative',
          margin: 'var(--sp-8) var(--sp-5) 0',
        }}
      >
        {/* Dropdown trigger / search input */}
        <button
          onClick={() => setDropdownOpen(prev => !prev)}
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 'var(--r-sm)',
            background: LIGHT.surface,
            border: `1px solid ${LIGHT.border}`,
            display: dropdownOpen ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--sp-4)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-md)',
            color: selectedTeam ? LIGHT.text : LIGHT.textMuted,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span>{selectedTeam ? selectedTeam.name : 'Select a team'}</span>
          <ChevronDownIcon />
        </button>

        {/* Search input (shown when dropdown is open) */}
        {dropdownOpen && (
          <input
            ref={inputRef}
            type="text"
            placeholder="Select a team"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 'var(--r-sm)',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              background: LIGHT.surface,
              border: `1px solid ${LIGHT.border}`,
              borderBottom: 'none',
              padding: '0 var(--sp-4)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-md)',
              color: LIGHT.text,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        )}

        {/* Dropdown listbox */}
        {dropdownOpen && (
          <div
            role="listbox"
            aria-label="Team list"
            style={{
              position: 'absolute',
              top: 48,
              left: 0,
              right: 0,
              maxHeight: 280,
              overflowY: 'auto',
              background: LIGHT.surface,
              borderRadius: `0 0 var(--r-sm) var(--r-sm)`,
              border: `1px solid ${LIGHT.border}`,
              borderTop: 'none',
              boxShadow: LIGHT.shadow,
              zIndex: 10,
              scrollbarWidth: 'thin',
              scrollbarColor: `${LIGHT.scrollThumb} transparent`,
            }}
          >
            {filtered.map(team => (
              <button
                key={team.id}
                role="option"
                aria-selected={selectedTeamId === team.id}
                onClick={() => handleSelect(team.id)}
                style={{
                  width: '100%',
                  display: 'block',
                  padding: 'var(--sp-4)',
                  background: 'none',
                  border: 'none',
                  borderBottom: `1px solid ${LIGHT.bg}`,
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-md)',
                  fontWeight: selectedTeamId === team.id ? 'var(--weight-med)' : 'var(--weight-reg)',
                  color: LIGHT.text,
                  textAlign: 'left',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {team.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{
                padding: 'var(--sp-4)',
                textAlign: 'center',
                color: LIGHT.textMuted,
                fontSize: 'var(--text-md)',
              }}>
                No teams found
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Spacer ──────────────────────────────────────────────── */}
      <div style={{ flex: 1 }} />

      {/* ── "Already have a card? Log in" ────────────────────────── */}
      <div style={{
        textAlign: 'center',
        padding: '0 var(--sp-5)',
        marginBottom: 'var(--sp-4)',
      }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-lg)',
          color: LIGHT.text,
        }}>
          Already have a card?{' '}
        </span>
        <button
          onClick={() => track('team_selection_login_tapped')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-med)',
            color: LIGHT.text,
            textDecoration: 'underline',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Log in
        </button>
      </div>

      {/* ── Continue button ─────────────────────────────────────── */}
      <div style={{
        padding: '0 var(--sp-5)',
        paddingBottom: 'calc(var(--sp-6) + env(safe-area-inset-bottom, 0px))',
      }}>
        <button
          onClick={handleContinue}
          disabled={!selectedTeamId}
          style={{
            width: '100%',
            height: 56,
            borderRadius: 'var(--r-full)',
            background: LIGHT.brand,
            border: 'none',
            color: '#ffffff',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--weight-med)',
            cursor: selectedTeamId ? 'pointer' : 'default',
            opacity: selectedTeamId ? 1 : 0.5,
            transition: 'opacity var(--dur-base) var(--ease-out)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

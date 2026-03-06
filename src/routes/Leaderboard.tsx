import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useLeaderboard, LEADERBOARD_REFRESH_MS } from '../lib/leaderboard'
import { useStore } from '../store/useStore'

function pad2(n: number) { return String(n).padStart(2, '0') }
function formatRefresh(d: Date) { return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}` }

export default function Leaderboard() {
  const navigate = useNavigate()
  const { state } = useStore()
  const { entries, myRank, lastRefresh, refresh } = useLeaderboard()
  const homeRoute = state.fanCard.teamId ? '/card' : '/'

  return (
    <Screen>
      <div className="page-in" style={{ display: 'flex', flexDirection: 'column', padding: 'var(--sp-6) var(--sp-5) 100px', width: '100%', maxWidth: 420, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
          <button onClick={() => navigate(-1)} className="btn-icon">‹</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-light)',
              letterSpacing: 'var(--tracking-tight)',
              color: 'var(--c-text-1)',
            }}>
              Leaderboard
            </h2>
          </div>
          <button
            onClick={() => { track('leaderboard_refresh_tapped'); refresh() }}
            className="btn-icon"
            style={{ color: 'var(--c-text-2)', fontSize: 14 }}
            aria-label="Refresh leaderboard"
          >↻</button>
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', textAlign: 'center', marginBottom: 'var(--sp-5)', lineHeight: 'var(--leading-normal)', letterSpacing: 'var(--tracking-wide)' }}>
          Cumulative score · Updated {formatRefresh(lastRefresh)} · auto-refreshes every {LEADERBOARD_REFRESH_MS / 60_000} min
        </div>

        {/* Your rank */}
        {myRank !== null && (
          <div style={{
            textAlign: 'center', marginBottom: 'var(--sp-5)',
            padding: 'var(--sp-3) var(--sp-4)',
            borderRadius: 'var(--r-md)',
            background: 'rgba(200,16,46,0.07)',
            border: '1px solid var(--c-border-brand)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
          }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)' }}>Your rank: </span>
            <span style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-med)', color: 'var(--c-accent)' }}>#{myRank}</span>
            {myRank <= 5 && (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--c-accent)', marginLeft: 8 }}>
                🏆 Top 5 — Avios eligible!
              </span>
            )}
          </div>
        )}

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {entries.map(row => (
            <div
              key={row.rank}
              style={{
                display: 'flex', alignItems: 'center',
                padding: 'var(--sp-4) var(--sp-4)',
                borderRadius: 'var(--r-md)',
                background: row.isMe ? 'rgba(200,16,46,0.07)' : 'var(--glass-bg)',
                border: `1px solid ${row.isMe ? 'var(--c-border-brand)' : 'var(--c-border)'}`,
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                boxShadow: 'var(--glass-shine)',
                transition: 'background var(--dur-base) var(--ease-out)',
              }}
            >
              <div style={{ width: 28, fontSize: row.rank <= 3 ? 18 : 'var(--text-sm)', fontWeight: 'var(--weight-med)', color: row.rank <= 3 ? 'var(--c-accent)' : 'var(--c-text-3)', flexShrink: 0, lineHeight: 1 }}>
                {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}
              </div>
              <div style={{ flex: 1, fontSize: 'var(--text-md)', color: 'var(--c-text-1)', fontWeight: row.isMe ? 'var(--weight-med)' : 'var(--weight-reg)' }}>
                {row.name}
                {row.isMe && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-accent)', marginLeft: 8, letterSpacing: 'var(--tracking-wide)' }}>you</span>}
              </div>
              {[
                { label: 'SCORE',    value: `${row.pts} Pts` },
                { label: 'DURATION', value: `${row.durationMins} Mins` },
              ].map(col => (
                <div key={col.label} style={{ textAlign: 'right', marginLeft: 'var(--sp-3)', minWidth: 54 }}>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--c-text-3)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginBottom: 2 }}>{col.label}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-1)', fontWeight: 'var(--weight-med)' }}>{col.value}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p style={{ marginTop: 'var(--sp-6)', fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', textAlign: 'center', lineHeight: 'var(--leading-normal)', letterSpacing: 'var(--tracking-wide)' }}>
          Top 5 fans win Avios. Rankings are provisional until end-of-event.
        </p>
      </div>

      {/* Sticky CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 'var(--sp-4) var(--sp-6) var(--sp-8)', background: 'linear-gradient(transparent, var(--c-bg) 40%)' }}>
        <button
          onClick={() => { track('leaderboard_home_tapped'); navigate(homeRoute) }}
          className="btn btn-primary"
          style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }}
        >
          Back home
        </button>
      </div>
    </Screen>
  )
}

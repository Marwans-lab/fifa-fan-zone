import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useLeaderboard, LEADERBOARD_REFRESH_MS } from '../lib/leaderboard'
import { useStore } from '../store/useStore'
import chevLeft   from '../assets/icons/Chevron-left-white.svg'
import flipIcon   from '../assets/icons/flip-white.svg'
import trophyIcon from '../assets/icons/Trophy-white.svg'

function pad2(n: number) { return String(n).padStart(2, '0') }
function formatRefresh(d: Date) { return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}` }

export default function Leaderboard() {
  const navigate = useNavigate()
  const { state } = useStore()
  const { entries, myRank, lastRefresh, refresh } = useLeaderboard()
  const homeRoute = state.fanCard.teamId ? '/card' : '/'

  return (
    <Screen>
      <div className="f-page-enter scroll-y" style={{ display: 'flex', flexDirection: 'column', padding: 'var(--f-brand-space-lg) var(--f-brand-space-md) 100px', width: '100%', maxWidth: 420, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--f-brand-space-xs)' }}>
          <button onClick={() => navigate(-1)} className="f-button f-button--ghost"><img src={chevLeft} width={24} height={24} alt="Back" /></button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h2 style={{
              fontFamily: 'var(--f-base-type-family-primary)',
              fontSize: '18',
              fontWeight: '300',
              letterSpacing: '-0.03em',
              color: 'var(--f-brand-color-text-default)',
            }}>
              Leaderboard
            </h2>
          </div>
          <button
            onClick={() => { track('leaderboard_refresh_tapped'); refresh() }}
            className="f-button f-button--ghost"
            aria-label="Refresh leaderboard"
          ><img src={flipIcon} width={24} height={24} alt="Refresh" /></button>
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: '11', color: 'var(--f-brand-color-text-muted)', textAlign: 'center', marginBottom: 'var(--f-brand-space-md)', lineHeight: '1.52', letterSpacing: '0.05em' }}>
          Cumulative score · Updated {formatRefresh(lastRefresh)} · auto-refreshes every {LEADERBOARD_REFRESH_MS / 60_000} min
        </div>

        {/* Your rank */}
        {myRank !== null && (
          <div style={{
            textAlign: 'center', marginBottom: 'var(--f-brand-space-md)',
            padding: 'var(--f-brand-space-sm) var(--f-brand-space-md)',
            borderRadius: 'var(--f-brand-radius-small)',
            background: 'rgba(200,16,46,0.07)',
            border: '1px solid var(--f-brand-color-border-primary)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}>
            <span style={{ fontSize: '13', color: 'var(--f-brand-color-text-subtle)' }}>Your rank: </span>
            <span style={{ fontSize: '15', fontWeight: '500', color: 'var(--f-brand-color-accent)' }}>#{myRank}</span>
            {myRank <= 5 && (
              <span style={{ fontSize: '13', color: 'var(--f-brand-color-accent)', marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <img src={trophyIcon} width={24} height={24} alt="" /> Top 5 — Avios eligible!
              </span>
            )}
          </div>
        )}

        {/* Rows */}
        <div className="f-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--f-brand-space-xs)' }}>
          {entries.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: 'var(--f-brand-space-2xl) var(--f-brand-space-md)',
              color: 'var(--f-brand-color-text-muted)',
              fontSize: '15',
              lineHeight: '1.5',
            }}>
              <img src={trophyIcon} width={32} height={32} alt="" style={{ opacity: 0.4, marginBottom: 'var(--f-brand-space-sm)' }} />
              <p>No players yet — complete a quiz to appear on the leaderboard</p>
            </div>
          )}
          {entries.map(row => (
            <div
              key={row.rank}
              style={{
                display: 'flex', alignItems: 'center',
                padding: 'var(--f-brand-space-md) var(--f-brand-space-md)',
                borderRadius: 'var(--f-brand-radius-small)',
                background: row.isMe ? 'rgba(200,16,46,0.07)' : 'rgba(255,255,255,0.10)',
                border: `1px solid ${row.isMe ? 'var(--f-brand-color-border-primary)' : 'var(--f-brand-color-border-default)'}`,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
                transition: 'background var(--f-brand-motion-duration-instant) var(--f-brand-motion-easing-exit)',
              }}
            >
              <div style={{ width: 28, fontSize: '13', fontWeight: '500', color: row.rank <= 3 ? 'var(--f-brand-color-accent)' : 'var(--f-brand-color-text-muted)', flexShrink: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>
                {row.rank === 1 ? <img src={trophyIcon} width={24} height={24} alt="1" /> : row.rank}
              </div>
              <div style={{ flex: 1, fontSize: '15', color: 'var(--f-brand-color-text-default)', fontWeight: row.isMe ? '500' : '400' }}>
                {row.name}
                {row.isMe && <span style={{ fontSize: '11', color: 'var(--f-brand-color-accent)', marginLeft: 8, letterSpacing: '0.05em' }}>you</span>}
              </div>
              {[
                { label: 'Score',    value: `${row.pts} pts` },
                { label: 'Duration', value: `${row.durationMins} min` },
              ].map(col => (
                <div key={col.label} style={{ textAlign: 'right', marginLeft: 'var(--f-brand-space-sm)', minWidth: 54 }}>
                  <div style={{ fontSize: '10', color: 'var(--f-brand-color-text-muted)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 2 }}>{col.label}</div>
                  <div style={{ fontSize: '13', color: 'var(--f-brand-color-text-default)', fontWeight: '500' }}>{col.value}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p style={{ marginTop: 'var(--f-brand-space-lg)', fontSize: '11', color: 'var(--f-brand-color-text-muted)', textAlign: 'center', lineHeight: '1.52', letterSpacing: '0.05em' }}>
          Top 5 fans win Avios. Rankings are provisional until end-of-event.
        </p>
      </div>

      {/* Sticky CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 'var(--f-brand-space-md) var(--f-brand-space-lg) var(--f-brand-space-xl)', background: 'linear-gradient(transparent, var(--f-brand-color-background-dark) 40%)' }}>
        <button
          onClick={() => { track('leaderboard_home_tapped'); navigate(homeRoute) }}
          className="f-button"
          style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }}
        >
          Return home
        </button>
      </div>
    </Screen>
  )
}

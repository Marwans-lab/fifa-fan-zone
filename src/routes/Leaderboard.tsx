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
      <div data-page="leaderboard" className="f-page-enter scroll-y" style={{ display: 'flex', flexDirection: 'column', padding: 'var(--f-brand-space-lg) var(--f-brand-space-md) 100px', width: '100%', maxWidth: 420, margin: '0 auto' }}>

        {/* Header */}
        <div data-section="header" className="leaderboard-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--f-brand-space-xs)' }}>
          <button data-ui="back-btn" onClick={() => navigate(-1)} className="f-button f-button--ghost leaderboard-back-btn"><img className="leaderboard-back-icon" src={chevLeft} width={24} height={24} alt="Back" /></button>
          <div className="leaderboard-title-wrapper" style={{ flex: 1, textAlign: 'center' }}>
            <h2 className="leaderboard-title" style={{
              font: 'var(--f-brand-type-headline)',
              fontWeight: 'var(--weight-light)',
              letterSpacing: 'var(--tracking-tight)',
              color: 'var(--f-brand-color-text-default)',
            }}>
              Leaderboard
            </h2>
          </div>
          <button
            data-ui="refresh-btn"
            onClick={() => { track('leaderboard_refresh_tapped'); refresh() }}
            className="f-button f-button--ghost leaderboard-refresh-btn"
            aria-label="Refresh leaderboard"
          ><img className="leaderboard-refresh-icon" src={flipIcon} width={24} height={24} alt="Refresh" /></button>
        </div>

        {/* Subtitle */}
        <div data-section="subtitle" className="leaderboard-subtitle" style={{ font: 'var(--f-brand-type-caption)', fontSize: 'var(--text-xs)', color: 'var(--f-brand-color-text-muted)', textAlign: 'center', marginBottom: 'var(--f-brand-space-md)', lineHeight: 'var(--leading-normal)', letterSpacing: 'var(--tracking-wide)' }}>
          Cumulative score · Updated {formatRefresh(lastRefresh)} · auto-refreshes every {LEADERBOARD_REFRESH_MS / 60_000} min
        </div>

        {/* Your rank */}
        {myRank !== null && (
          <div data-section="your-rank" className="leaderboard-your-rank" style={{
            textAlign: 'center', marginBottom: 'var(--f-brand-space-md)',
            padding: 'var(--f-brand-space-sm) var(--f-brand-space-md)',
            borderRadius: 'var(--f-brand-radius-small)',
            background: 'rgba(200,16,46,0.07)',
            border: '1px solid var(--f-brand-color-border-primary)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}>
            <span className="leaderboard-your-rank-label" style={{ font: 'var(--f-brand-type-caption)', fontSize: 'var(--text-sm)', color: 'var(--f-brand-color-text-subtle)' }}>Your rank: </span>
            <span className="leaderboard-your-rank-value" style={{ font: 'var(--f-brand-type-body-medium)', fontSize: 'var(--text-md)', color: 'var(--f-brand-color-accent)' }}>#{myRank}</span>
            {myRank <= 5 && (
              <span className="leaderboard-your-rank-badge" style={{ font: 'var(--f-brand-type-caption)', fontSize: 'var(--text-sm)', color: 'var(--f-brand-color-accent)', marginLeft: 'var(--sp-2)', display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
                <img className="leaderboard-your-rank-trophy" src={trophyIcon} width={24} height={24} alt="" /> Top 5 — Avios eligible!
              </span>
            )}
          </div>
        )}

        {/* Rows */}
        <div data-section="rank-list" className="f-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--f-brand-space-xs)' }}>
          {entries.length === 0 && (
            <div className="leaderboard-empty" style={{
              textAlign: 'center',
              padding: 'var(--f-brand-space-2xl) var(--f-brand-space-md)',
              color: 'var(--f-brand-color-text-muted)',
              fontSize: 'var(--text-md)',
              lineHeight: 'var(--leading-body)',
            }}>
              <img className="leaderboard-empty-icon" src={trophyIcon} width={32} height={32} alt="" style={{ opacity: 0.4, marginBottom: 'var(--f-brand-space-sm)' }} />
              <p className="leaderboard-empty-text">No players yet — complete a quiz to appear on the leaderboard</p>
            </div>
          )}
          {entries.map(row => (
            <div
              data-section="rank-row"
              className="leaderboard-rank-row"
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
              <div className="leaderboard-rank-number" style={{ width: 28, font: 'var(--f-brand-type-caption-medium)', fontSize: 'var(--text-sm)', color: row.rank <= 3 ? 'var(--f-brand-color-accent)' : 'var(--f-brand-color-text-muted)', flexShrink: 0, lineHeight: 'var(--leading-none)', display: 'flex', alignItems: 'center' }}>
                {row.rank === 1 ? <img className="leaderboard-rank-trophy" src={trophyIcon} width={24} height={24} alt="1" /> : row.rank}
              </div>
              <div className="leaderboard-rank-name" style={{ flex: 1, font: 'var(--f-brand-type-body)', fontSize: 'var(--text-md)', color: 'var(--f-brand-color-text-default)', fontWeight: row.isMe ? 'var(--weight-med)' : 'var(--weight-reg)' }}>
                {row.name}
                {row.isMe && <span className="leaderboard-rank-you" style={{ font: 'var(--f-brand-type-caption)', fontSize: 'var(--text-xs)', color: 'var(--f-brand-color-accent)', marginLeft: 'var(--sp-2)', letterSpacing: 'var(--tracking-wide)' }}>you</span>}
              </div>
              {[
                { label: 'Score',    value: `${row.pts} pts` },
                { label: 'Duration', value: `${row.durationMins} min` },
              ].map(col => (
                <div className="leaderboard-rank-col" key={col.label} style={{ textAlign: 'right', marginLeft: 'var(--f-brand-space-sm)', minWidth: 54 }}>
                  <div className="leaderboard-rank-col-label" style={{ font: 'var(--f-brand-type-caption)', fontSize: 'var(--text-2xs)', color: 'var(--f-brand-color-text-muted)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginBottom: 2 }}>{col.label}</div>
                  <div className="leaderboard-rank-col-value" style={{ font: 'var(--f-brand-type-caption-medium)', fontSize: 'var(--text-sm)', color: 'var(--f-brand-color-text-default)' }}>{col.value}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="leaderboard-disclaimer" style={{ marginTop: 'var(--f-brand-space-lg)', font: 'var(--f-brand-type-caption)', fontSize: 'var(--text-xs)', color: 'var(--f-brand-color-text-muted)', textAlign: 'center', lineHeight: 'var(--leading-normal)', letterSpacing: 'var(--tracking-wide)' }}>
          Top 5 fans win Avios. Rankings are provisional until end-of-event.
        </p>
      </div>

      {/* Sticky CTA */}
      <div className="leaderboard-sticky-cta" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 'var(--f-brand-space-md) var(--f-brand-space-lg) var(--f-brand-space-xl)', background: 'linear-gradient(transparent, var(--f-brand-color-background-dark) 40%)' }}>
        <button
          data-ui="return-home-btn"
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

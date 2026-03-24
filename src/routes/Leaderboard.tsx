import { useNavigate } from 'react-router-dom'
import { track } from '../lib/analytics'
import { useLeaderboard, LEADERBOARD_REFRESH_MS } from '../lib/leaderboard'
import { useStore } from '../store/useStore'
import chevLeft   from '../assets/icons/Chevron-left-dark.svg'
import flipIcon   from '../assets/icons/flip-dark.svg'
import trophyIcon from '../assets/icons/Trophy-dark.svg'

function pad2(n: number) { return String(n).padStart(2, '0') }
function formatRefresh(d: Date) { return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}` }

export default function Leaderboard() {
  const navigate = useNavigate()
  const { state } = useStore()
  const { entries, myRank, lastRefresh, refresh } = useLeaderboard()
  const homeRoute = state.fanCard.teamId ? '/card' : '/'
  const isTop5 = myRank !== null && myRank <= 5

  return (
    <div style={{
      minHeight: '100%',
      background: 'var(--f-brand-color-background-default)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div className="page-in scroll-y" style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--f-brand-space-lg) var(--f-brand-space-md) 120px',
        width: '100%',
        maxWidth: 420,
        margin: '0 auto',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--f-brand-space-xs)' }}>
          <button onClick={() => navigate(-1)} className="f-button--ghost" aria-label="Go back">
            <img src={chevLeft} width={24} height={24} alt="" />
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h2 style={{ font: 'var(--f-brand-type-title-4)', color: 'var(--f-brand-color-text-heading)' }}>
              Leaderboard
            </h2>
          </div>
          <button
            onClick={() => { track('leaderboard_refresh_tapped'); refresh() }}
            className="f-button--ghost"
            aria-label="Refresh leaderboard"
          >
            <img src={flipIcon} width={24} height={24} alt="" />
          </button>
        </div>

        {/* Subtitle */}
        <div style={{
          font: 'var(--f-brand-type-caption)',
          color: 'var(--f-brand-color-text-subtle)',
          textAlign: 'center',
          marginBottom: 'var(--f-brand-space-md)',
        }}>
          Cumulative score &middot; Updated {formatRefresh(lastRefresh)} &middot; auto-refreshes every {LEADERBOARD_REFRESH_MS / 60_000} min
        </div>

        {/* Your rank highlight card */}
        {myRank !== null && (
          <div className="f-leaderboard-rank" style={{
            textAlign: 'center',
            marginBottom: 'var(--f-brand-space-md)',
            padding: 'var(--f-brand-space-md)',
            borderRadius: 'var(--f-brand-radius-inner)',
            ...(isTop5 ? {
              background: 'var(--f-brand-color-background-primary)',
              color: 'var(--f-brand-color-text-light)',
            } : {
              background: 'var(--f-brand-color-background-light)',
              border: '1px solid var(--f-brand-color-border-default)',
              color: 'var(--f-brand-color-text-default)',
            }),
          }}>
            <div style={{
              font: 'var(--f-brand-type-title-2)',
              marginBottom: 'var(--f-brand-space-2xs)',
            }}>
              #{myRank}
            </div>
            <div style={{
              font: 'var(--f-brand-type-headline-medium)',
              opacity: isTop5 ? 0.85 : 1,
              color: isTop5 ? 'var(--f-brand-color-text-light)' : 'var(--f-brand-color-text-muted)',
            }}>
              {entries.find(e => e.isMe)?.pts ?? 0} Pts
            </div>
            {isTop5 && (
              <div style={{
                font: 'var(--f-brand-type-caption)',
                marginTop: 'var(--f-brand-space-xs)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--f-brand-space-2xs)',
                color: 'var(--f-brand-color-text-light)',
              }}>
                <img src={trophyIcon} width={20} height={20} alt="" style={{ filter: 'brightness(0) invert(1)' }} />
                Top 5 — Avios eligible!
              </div>
            )}
          </div>
        )}

        {/* Top 5 Avios eligibility banner */}
        {!isTop5 && (
          <div style={{
            background: 'var(--f-brand-color-background-primary)',
            color: 'var(--f-brand-color-text-light)',
            borderRadius: 'var(--f-brand-radius-inner)',
            padding: 'var(--f-brand-space-md)',
            marginBottom: 'var(--f-brand-space-md)',
            textAlign: 'center',
            font: 'var(--f-brand-type-subheading-medium)',
          }}>
            Top 5 fans win Avios — keep playing to climb!
          </div>
        )}

        {/* Leaderboard rows */}
        <div className="f-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--f-brand-space-xs)' }}>
          {entries.map(row => (
            <div
              key={row.rank}
              className={`f-leaderboard-row${row.isMe ? ' f-leaderboard-row--highlighted' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--f-brand-space-sm) var(--f-brand-space-md)',
                borderRadius: 'var(--f-brand-radius-base)',
                background: 'var(--f-brand-color-background-light)',
                boxShadow: 'var(--f-brand-shadow-medium)',
                ...(row.isMe ? { borderLeft: '3px solid var(--f-brand-color-border-primary)' } : {}),
              }}
            >
              {/* Rank */}
              <div style={{
                width: 32,
                flexShrink: 0,
                font: 'var(--f-brand-type-body-medium)',
                color: row.rank <= 3 ? 'var(--f-brand-color-text-primary)' : 'var(--f-brand-color-text-subtle)',
                display: 'flex',
                alignItems: 'center',
              }}>
                {row.rank === 1
                  ? <img src={trophyIcon} width={20} height={20} alt="1st" />
                  : row.rank}
              </div>

              {/* Name */}
              <div style={{
                flex: 1,
                font: row.isMe ? 'var(--f-brand-type-body-medium)' : 'var(--f-brand-type-body)',
                color: 'var(--f-brand-color-text-default)',
              }}>
                {row.name}
                {row.isMe && (
                  <span style={{
                    font: 'var(--f-brand-type-caption)',
                    color: 'var(--f-brand-color-text-primary)',
                    marginLeft: 'var(--f-brand-space-xs)',
                  }}>
                    you
                  </span>
                )}
              </div>

              {/* Score */}
              <div style={{ textAlign: 'right', marginLeft: 'var(--f-brand-space-sm)', minWidth: 54 }}>
                <div style={{
                  font: 'var(--f-brand-type-subheading-medium)',
                  color: 'var(--f-brand-color-text-primary)',
                }}>
                  {row.pts} Pts
                </div>
              </div>

              {/* Duration */}
              <div style={{ textAlign: 'right', marginLeft: 'var(--f-brand-space-sm)', minWidth: 54 }}>
                <div style={{
                  font: 'var(--f-brand-type-caption)',
                  color: 'var(--f-brand-color-text-subtle)',
                }}>
                  {row.durationMins} Mins
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p style={{
          marginTop: 'var(--f-brand-space-lg)',
          font: 'var(--f-brand-type-caption)',
          color: 'var(--f-brand-color-text-subtle)',
          textAlign: 'center',
        }}>
          Top 5 fans win Avios. Rankings are provisional until end-of-event.
        </p>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 'var(--f-brand-space-md) var(--f-brand-space-lg) var(--f-brand-space-xl)',
        background: 'linear-gradient(transparent, var(--f-brand-color-background-default) 40%)',
      }}>
        <button
          onClick={() => { track('leaderboard_home_tapped'); navigate(homeRoute) }}
          className="f-button--primary"
          style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }}
        >
          Back home
        </button>
      </div>
    </div>
  )
}

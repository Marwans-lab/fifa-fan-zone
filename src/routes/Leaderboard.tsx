import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useLeaderboard, LEADERBOARD_REFRESH_MS } from '../lib/leaderboard'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function formatRefresh(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

export default function Leaderboard() {
  const navigate = useNavigate()
  const { entries, myRank, lastRefresh, refresh } = useLeaderboard()

  function handleRefresh() {
    track('leaderboard_refresh_tapped')
    refresh()
  }

  return (
    <Screen>
      <div
        style={{
          display: 'flex', flexDirection: 'column',
          padding: '24px 20px 100px', width: '100%', maxWidth: 420, margin: '0 auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1px solid #2a2a2a', background: 'none',
              color: '#fff', cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontFamily: 'inherit',
            }}
          >
            ‹
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
              Leaderboard
            </h2>
          </div>
          <button
            onClick={handleRefresh}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1px solid #2a2a2a', background: 'none',
              color: '#ffffff88', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontFamily: 'inherit',
            }}
            title="Refresh leaderboard"
            aria-label="Refresh leaderboard"
          >
            ↻
          </button>
        </div>

        {/* Scoring basis + refresh info */}
        <div
          style={{
            fontSize: 11, color: '#ffffff44', textAlign: 'center',
            marginBottom: 20, lineHeight: 1.5,
          }}
        >
          Cumulative score across all quizzes
          {' · '}
          Updated {formatRefresh(lastRefresh)}
          {' · '}
          auto-refreshes every {LEADERBOARD_REFRESH_MS / 60_000} min
        </div>

        {/* Your rank banner */}
        {myRank !== null && (
          <div
            style={{
              textAlign: 'center', marginBottom: 20,
              padding: '10px 16px', borderRadius: 12,
              background: 'rgba(200,16,46,0.1)',
              border: '1px solid rgba(200,16,46,0.3)',
            }}
          >
            <span style={{ fontSize: 13, color: '#ffffff99' }}>Your rank: </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#c8102e' }}>
              #{myRank}
            </span>
            {myRank <= 5 && (
              <span style={{ fontSize: 13, color: '#00d4aa', marginLeft: 8 }}>
                🏆 Top 5 — Avios eligible!
              </span>
            )}
          </div>
        )}

        {/* Leaderboard rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map(row => (
            <div
              key={row.rank}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '14px 16px', borderRadius: 14,
                background: row.isMe ? 'rgba(200,16,46,0.1)' : '#ffffff0d',
                border: row.isMe ? '1.5px solid #c8102e' : '1px solid transparent',
              }}
            >
              {/* Rank number */}
              <div
                style={{
                  width: 28, fontSize: 13, fontWeight: 700,
                  color: row.rank <= 3 ? '#00d4aa' : '#ffffff55',
                  flexShrink: 0,
                }}
              >
                {row.rank}
              </div>

              {/* Name */}
              <div style={{ flex: 1, fontSize: 15, color: '#fff', fontWeight: row.isMe ? 700 : 500 }}>
                {row.name}
                {row.isMe && (
                  <span style={{ fontSize: 11, color: '#c8102e', marginLeft: 6 }}>
                    ← you
                  </span>
                )}
              </div>

              {/* Stats */}
              {[
                { label: 'SCORE',    value: `${row.pts} Pts` },
                { label: 'DURATION', value: `${row.durationMins} Mins` },
              ].map(col => (
                <div key={col.label} style={{ textAlign: 'right', marginLeft: 12, minWidth: 54 }}>
                  <div style={{ fontSize: 9, color: '#ffffff44', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>
                    {col.label}
                  </div>
                  <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
                    {col.value}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Top 5 disclaimer */}
        <p
          style={{
            marginTop: 24, fontSize: 11, color: '#ffffff33',
            textAlign: 'center', lineHeight: 1.5,
          }}
        >
          Top 5 fans win Avios. Rankings are provisional until end-of-event.
          Authoritative scores verified server-side.
        </p>
      </div>

      {/* Sticky bottom button */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '16px 24px 28px',
          background: 'linear-gradient(transparent, #0d0d0d 40%)',
        }}
      >
        <button
          onClick={() => { track('leaderboard_home_tapped'); navigate('/') }}
          style={{
            width: '100%', maxWidth: 420, display: 'block', margin: '0 auto',
            padding: '16px 0', borderRadius: 50, border: 'none',
            background: '#fff', color: '#c8102e',
            fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Back home
        </button>
      </div>
    </Screen>
  )
}

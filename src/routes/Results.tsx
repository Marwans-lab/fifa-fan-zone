import { useNavigate, useLocation } from 'react-router-dom'
import { useCallback } from 'react'
import Screen from '../components/Screen'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { renderScorecardToBlob } from '../lib/cardExport'

interface QuizResult {
  score: number
  total: number
  quizTitle: string
}

// Mock leaderboard — replaced by real data in MAR-33
const BASE_BOARD = [
  { name: 'Chris', ranking: 1, pts: 49, mins: 2 },
  { name: 'Simon', ranking: 3, pts: 49, mins: 2 },
  { name: 'Alex',  ranking: 4, pts: 42, mins: 3 },
]

export default function Results() {
  const navigate              = useNavigate()
  const location              = useLocation()
  const { state: appState }   = useStore()
  const result                = location.state as QuizResult | undefined

  const score     = result?.score     ?? 0
  const total     = result?.total     ?? 5
  const quizTitle = result?.quizTitle ?? ''

  const myPts  = score * 10
  const arcR   = 70
  const arcLen = 2 * Math.PI * arcR
  const arcFill = total > 0 ? (score / total) * arcLen : 0

  // Build leaderboard with current user at rank 2
  const board = [
    BASE_BOARD[0],
    { name: 'You', ranking: 2, pts: myPts, mins: 2, isMe: true },
    ...BASE_BOARD.slice(1),
  ]

  const handleShare = useCallback(async (platform: 'twitter' | 'instagram' | 'facebook') => {
    track('results_share_tapped', { platform })
    const text = `I scored ${score}/${total} on the FIFA Fan Zone Quiz! ⚽🏆 #FIFAFanZone #WorldCup2026`

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
      return
    }
    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`, '_blank')
      return
    }
    // Instagram — use Web Share API with scorecard image when supported
    if (navigator.share) {
      try {
        const blob = await renderScorecardToBlob({ score, total, quizTitle, totalPts: appState.points })
        const file = new File([blob], 'scorecard.png', { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], text })
          return
        }
      } catch { /* fall through */ }
      navigator.share({ text }).catch(() => {})
    }
  }, [score, total, quizTitle, appState.points])

  // ── No result: direct navigation ─────────────────────────────────────────────
  if (!result) {
    return (
      <Screen>
        <div
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '48px 24px 120px', width: '100%', maxWidth: 400, margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 18, color: '#fff', marginBottom: 28, fontWeight: 400 }}>
            Your total score
          </p>
          <div style={{ position: 'relative', width: 160, height: 160, marginBottom: 40 }}>
            <svg width="160" height="160" style={{ position: 'absolute', inset: 0 }}>
              <circle cx="80" cy="80" r={arcR} fill="none" stroke="#ffffff22" strokeWidth="4" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 52, fontWeight: 300, color: '#fff', lineHeight: 1 }}>
                {String(appState.points).padStart(2, '0')}
              </div>
              <div style={{ fontSize: 14, color: '#ffffffaa', marginTop: 4 }}>Points</div>
            </div>
          </div>
          <button
            onClick={() => { track('results_play_again'); navigate('/quiz') }}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 50, border: 'none',
              background: '#fff', color: '#c8102e', fontSize: 16, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Play a Quiz
          </button>
        </div>
      </Screen>
    )
  }

  // ── Full results screen ───────────────────────────────────────────────────────
  return (
    <Screen>
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '48px 24px 100px', width: '100%', maxWidth: 400, margin: '0 auto',
        }}
      >
        {/* Heading */}
        <p style={{ fontSize: 18, color: '#fff', marginBottom: 28, fontWeight: 400 }}>
          Your score is
        </p>

        {/* Score ring */}
        <div style={{ position: 'relative', width: 160, height: 160, marginBottom: 36 }}>
          {/* Green dot at top of ring */}
          <div
            style={{
              position: 'absolute', top: 3, left: '50%',
              transform: 'translateX(-50%)',
              width: 8, height: 8, borderRadius: '50%',
              background: '#4caf50', zIndex: 1,
            }}
          />
          <svg width="160" height="160" style={{ position: 'absolute', inset: 0 }}>
            <circle cx="80" cy="80" r={arcR} fill="none" stroke="#ffffff22" strokeWidth="4" />
            {score > 0 && (
              <circle
                cx="80" cy="80" r={arcR}
                fill="none" stroke="#00d4aa" strokeWidth="4"
                strokeDasharray={`${arcFill} ${arcLen}`}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
              />
            )}
          </svg>
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 52, fontWeight: 300, color: '#fff', lineHeight: 1 }}>
              {String(score).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 14, color: '#ffffffaa', marginTop: 4 }}>Points</div>
          </div>
        </div>

        {/* Social share */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 36 }}>
          {([
            { id: 'twitter'   as const, symbol: '𝕏' },
            { id: 'instagram' as const, symbol: '◎' },
            { id: 'facebook'  as const, symbol: 'f' },
          ] as const).map(({ id, symbol }) => (
            <button
              key={id}
              onClick={() => handleShare(id)}
              aria-label={`Share on ${id}`}
              style={{
                width: 52, height: 52, borderRadius: 14,
                border: '1.5px solid #c8102e', background: 'none',
                color: '#fff', fontSize: 20, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'inherit',
              }}
            >
              {symbol}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {board.map(row => {
            const isMe = 'isMe' in row && row.isMe
            return (
              <div
                key={row.ranking}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '14px 16px', borderRadius: 14,
                  background: '#ffffff0d',
                  border: isMe ? '1.5px solid #c8102e' : '1px solid transparent',
                }}
              >
                <div style={{ flex: 1, fontSize: 15, color: '#fff', fontWeight: 500 }}>
                  {row.name}
                </div>
                {[
                  { label: 'RANKING',  value: row.ranking },
                  { label: 'SCORE',    value: `${row.pts} Pts` },
                  { label: 'DURATION', value: `${row.mins} Mins` },
                ].map(col => (
                  <div key={col.label} style={{ textAlign: 'right', marginLeft: 12, minWidth: 54 }}>
                    <div
                      style={{
                        fontSize: 9, color: '#ffffff55',
                        letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2,
                      }}
                    >
                      {col.label}
                    </div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
                      {col.value}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Sticky Back home button */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '16px 24px 28px',
          background: 'linear-gradient(transparent, #0d0d0d 40%)',
        }}
      >
        <button
          onClick={() => { track('results_home_tapped'); navigate('/') }}
          style={{
            width: '100%', maxWidth: 400, display: 'block', margin: '0 auto',
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

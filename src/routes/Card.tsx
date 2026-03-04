import { useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Screen from '../components/Screen'
import Button from '../components/Button'
import FanCard, { type FanCardHandle } from '../components/FanCard'
import { track } from '../lib/analytics'
import { useStore } from '../store/useStore'
import { renderCardToBlob, buildShareText } from '../lib/cardExport'

export default function Card() {
  const navigate = useNavigate()
  const { state, updateFanCard } = useStore()
  const cardRef = useRef<FanCardHandle>(null)
  const [sharing, setSharing] = useState(false)
  const [saving,  setSaving]  = useState(false)

  function handleSave(answers: Record<string, string>) {
    updateFanCard({ answers, completedAt: new Date().toISOString() })
  }

  const handleEdit = useCallback(() => {
    cardRef.current?.startEditing()
  }, [])

  const handleShare = useCallback(async () => {
    setSharing(true)
    try {
      const blob = await renderCardToBlob(state.fanCard)
      const file = new File([blob], 'fan-card.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My FIFA Fan Card' })
      } else {
        await window.QAApp.openNativeShare({
          title: 'My FIFA Fan Card',
          text: buildShareText(state.fanCard),
        })
      }
      track('card_shared')
    } catch {
      // user cancelled — not an error
    } finally {
      setSharing(false)
    }
  }, [state.fanCard])

  const handleSaveToDevice = useCallback(async () => {
    setSaving(true)
    try {
      const blob = await renderCardToBlob(state.fanCard)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = 'my-fan-card.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      track('card_saved_to_device')
    } finally {
      setSaving(false)
    }
  }, [state.fanCard])

  return (
    <Screen centered>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-6)',
          padding: 'var(--space-6) var(--space-4)',
          width: '100%',
          maxWidth: 400,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-1)' }}>
            Your Fan Card
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Tap to flip &amp; complete your profile
          </p>
        </div>

        <FanCard ref={cardRef} fanCard={state.fanCard} onSave={handleSave} />

        {/* ── Edit / Share / Save actions ──────────────────────── */}
        <div style={{ display: 'flex', gap: 'var(--space-5)', justifyContent: 'center' }}>
          <ActionBtn icon="✏" label="Edit"  onClick={handleEdit} />
          <ActionBtn icon="⤴" label="Share" onClick={handleShare} loading={sharing} />
          <ActionBtn icon="⬇" label="Save"  onClick={handleSaveToDevice} loading={saving} />
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Button
            fullWidth
            onClick={() => { track('card_to_quiz_tapped'); navigate('/quiz') }}
          >
            Start Quiz
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => { track('card_back_tapped'); navigate(-1) }}
          >
            Back
          </Button>
        </div>
      </div>
    </Screen>
  )
}

// ─── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({
  icon, label, onClick, loading,
}: {
  icon: string
  label: string
  onClick: () => void
  loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        background: 'none',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 20px',
        cursor: loading ? 'default' : 'pointer',
        opacity: loading ? 0.5 : 1,
        color: 'var(--color-text-primary)',
        fontFamily: 'inherit',
        transition: 'opacity var(--transition-fast)',
      }}
    >
      <span style={{ fontSize: 20 }}>{loading ? '…' : icon}</span>
      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{label}</span>
    </button>
  )
}

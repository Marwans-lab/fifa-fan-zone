import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { REMOTE_EVENT, type RemoteCommand } from './remoteControl'

export function useRemoteControl(): void {
  const navigate = useNavigate()
  const { updateFanCard, addPoints, resetState } = useStore()

  useEffect(() => {
    function onCommand(e: Event) {
      const cmd = (e as CustomEvent<RemoteCommand>).detail
      switch (cmd.type) {
        case 'navigate':
          navigate(cmd.path)
          break
        case 'reset':
          resetState()
          navigate('/')
          break
        case 'updateFanCard':
          updateFanCard(cmd.patch)
          break
        case 'addPoints':
          addPoints(cmd.n)
          break
      }
    }

    window.addEventListener(REMOTE_EVENT, onCommand)
    return () => window.removeEventListener(REMOTE_EVENT, onCommand)
  }, [navigate, updateFanCard, addPoints, resetState])
}

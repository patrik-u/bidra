import { createFileRoute } from '@tanstack/react-router'
import Bidra from '../components/Bidra'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/vibe-callback')({ component: VibeCallback })

function VibeCallback() {
  const [redirect, setRedirect] = useState(false)
  useEffect(() => {
    void import('@vibe/sdk').then(({ completePopupCallback }) => {
      if (!completePopupCallback('/vibe-callback/')) setRedirect(true)
    })
  }, [])
  if (redirect) return <Bidra />
  return <main className="callback-status"><img src="/bidra-symbol.svg" width="52" height="52" alt="" /><h1>bidra.</h1><p role="status">Du är snart tillbaka i Bidra …</p><button onClick={() => window.close()}>Stäng fönstret</button></main>
}

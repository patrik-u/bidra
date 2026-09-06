import { useEffect, useRef } from 'react'
import { createAccountMenu } from '@vibe/account-menu'
import type { AccountMenu, AccountMenuOptions } from '@vibe/account-menu'
import '@vibe/account-menu/style.css'

/** Thin React adapter; rendering, focus and menu behavior live in the shared package. */
export default function VibeAccountMenu({ options }: { options: AccountMenuOptions }) {
  const root = useRef<HTMLDivElement>(null)
  const menu = useRef<AccountMenu | null>(null)
  const latest = useRef(options)
  latest.current = options
  useEffect(() => {
    if (!root.current) return
    menu.current = createAccountMenu(root.current, latest.current)
    return () => { menu.current?.destroy(); menu.current = null }
  }, [])
  useEffect(() => { menu.current?.update(options) }, [options])
  return <div ref={root} className="bidra-account-menu" />
}

'use client'

import { ReactNode, useState } from 'react'
import { ensureDemoWorkspaceSeeded } from '@/lib/demo-data'
import { isDemoMode } from '@/lib/env'

export function DemoWorkspaceProvider({
  children,
  preview = false,
}: {
  children: ReactNode
  preview?: boolean
}) {
  const [ready] = useState(() => {
    // Seed demo data in demo mode OR preview mode.
    if (isDemoMode() || preview) ensureDemoWorkspaceSeeded()
    return true
  })

  if (!ready) return null
  return <>{children}</>
}

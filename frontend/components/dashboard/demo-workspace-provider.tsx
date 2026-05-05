'use client'

import { ReactNode, useState } from 'react'
import { ensureDemoWorkspaceSeeded } from '@/lib/demo-data'
import { isDemoMode } from '@/lib/env'

export function DemoWorkspaceProvider({ children }: { children: ReactNode }) {
  const [ready] = useState(() => {
    // Demo mode must seed before dashboard children read localStorage.
    if (isDemoMode()) ensureDemoWorkspaceSeeded()
    return true
  })

  if (!ready) return null
  return <>{children}</>
}

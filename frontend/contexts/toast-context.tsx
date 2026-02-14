'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toasts: Toast[]
  show: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0
const TOAST_DURATION_MS = 4000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => remove(id), TOAST_DURATION_MS)
  }, [remove])

  const success = useCallback((message: string) => show(message, 'success'), [show])
  const error = useCallback((message: string) => show(message, 'error'), [show])

  return (
    <ToastContext.Provider value={{ toasts, show, success, error }}>
      {children}
      <ToastList toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  )
}

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null
  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
            t.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : t.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-slate-200 bg-white text-slate-800'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      show: (msg: string) => {},
      success: (msg: string) => {},
      error: (msg: string) => {},
    }
  }
  return ctx
}

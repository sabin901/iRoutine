import type { Metadata } from 'next'
import './globals.css'
import { ErrorBoundaryWrapper } from '@/components/error-boundary-wrapper'
import { ToastProvider } from '@/contexts/toast-context'

export const metadata: Metadata = {
  title: 'iRoutine — Personal Life Operating System',
  description: 'A calm system that connects time, money, energy, and focus with cross-domain intelligence.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorBoundaryWrapper>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  )
}

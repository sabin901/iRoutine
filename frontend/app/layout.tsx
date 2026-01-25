import type { Metadata } from 'next'
import './globals.css'
import { ErrorBoundaryWrapper } from '@/components/error-boundary-wrapper'

export const metadata: Metadata = {
  title: 'Routine',
  description: 'A calm system for understanding how you spend your time and attention',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
      </body>
    </html>
  )
}

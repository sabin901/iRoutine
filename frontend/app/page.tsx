import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-6 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-light tracking-tight">Routine</h1>
          <p className="text-muted-foreground">
            A calm system for understanding how you spend your time and attention
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="block w-full rounded-lg border border-foreground px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="block w-full rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}

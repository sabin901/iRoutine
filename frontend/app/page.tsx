import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero – light, spacious */}
      <section className="flex-1 flex items-center">
        <div className="w-full max-w-4xl mx-auto px-6 py-16 sm:py-24">
          <div className="text-center space-y-8">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              iRoutine
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              A calm system for understanding how you spend your time and attention.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/signup"
                className="btn-primary inline-flex items-center justify-center"
              >
                Get started
              </Link>
              <Link
                href="/auth/login"
                className="btn-secondary inline-flex items-center justify-center"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dark strip – contrast */}
      <section className="dark-block py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-slate-300 text-sm">
            Track time, focus, and energy in one place.
          </p>
        </div>
      </section>
    </div>
  )
}

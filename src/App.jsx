import { lazy, Suspense, useEffect, useState } from 'react'

const AdminApp = lazy(() => import('./admin/AdminApp'))
const Terms    = lazy(() => import('./components/Terms/Terms'))
const Privacy  = lazy(() => import('./components/Privacy/Privacy'))
const ThankYou = lazy(() => import('./components/ThankYou/ThankYou'))
// Pre-wedding main site — kept as an unadvertised backup at #main-site.
const MainSite = lazy(() => import('./components/MainSite'))

function useHash() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const handler = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  return hash
}

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">
      Loading…
    </div>
  )
}

export default function App() {
  const hash = useHash()

  if (hash === '#admin') {
    return (
      <Suspense fallback={<RouteFallback />}>
        <AdminApp />
      </Suspense>
    )
  }

  if (hash === '#terms') {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Terms />
      </Suspense>
    )
  }

  if (hash === '#privacy') {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Privacy />
      </Suspense>
    )
  }

  if (hash === '#main-site') {
    return (
      <Suspense fallback={<RouteFallback />}>
        <MainSite />
      </Suspense>
    )
  }

  // Everything else — Thank You.
  return (
    <Suspense fallback={<RouteFallback />}>
      <ThankYou />
    </Suspense>
  )
}

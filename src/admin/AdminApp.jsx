import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Btn } from './components/ui'
import LoginScreen from './LoginScreen'
import GroupsView from './views/GroupsView'
import GuestsView from './views/GuestsView'
import ResponsesView from './views/ResponsesView'
import EventsView from './views/EventsView'
import ContactRequestsView from './views/ContactRequestsView'
import EventBreakdownView from './views/EventBreakdownView'
import AccommodationsView from './views/AccommodationsView'

const TABS = [
  { key: 'guests',         label: 'Guests' },
  { key: 'groups',         label: 'Groups' },
  { key: 'events',         label: 'Events' },
  { key: 'responses',      label: 'Responses' },
  { key: 'attendance',     label: 'Attendance' },
  { key: 'accommodations', label: 'Accommodations' },
  { key: 'contact',        label: 'Contact requests' },
]

export default function AdminApp() {
  const [session, setSession]         = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab]                 = useState('guests')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (authLoading) return (
    <div id="admin-root" className="min-h-screen flex items-center justify-center text-sm text-gray-400">
      Loading…
    </div>
  )

  if (!session) return <LoginScreen />

  return (
    <div id="admin-root" className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Guest Manager</h1>
          <p className="text-xs text-gray-400">Snigdha &amp; Pramod · August 16, 2026</p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="text-xs text-gray-400 hover:text-gray-600"
            onClick={e => { e.preventDefault(); window.location.hash = '' }}
          >
            ← Back to site
          </a>
          <Btn variant="secondary" onClick={() => supabase.auth.signOut()}>Sign out</Btn>
        </div>
      </header>

      <nav className="border-b border-gray-200 bg-white px-6 flex">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`py-3 px-4 text-sm border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-rose-400 text-rose-500 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="p-6">
        {tab === 'guests'    && <GuestsView />}
        {tab === 'groups'    && <GroupsView />}
        {tab === 'events'    && <EventsView />}
        {tab === 'responses'      && <ResponsesView />}
        {tab === 'attendance'     && <EventBreakdownView />}
        {tab === 'accommodations' && <AccommodationsView />}
        {tab === 'contact'        && <ContactRequestsView />}
      </main>
    </div>
  )
}

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppProvider, useAppContext } from './context/AppContext'
import NavTabs from './components/NavTabs'
import AgendaView from './components/AgendaView'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
})

function AppContent() {
  const { currentView } = useAppContext()

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="font-serif text-5xl mb-8">Agenda</h1>
      <NavTabs />

      {currentView === 'agenda' && <AgendaView />}
      {currentView === 'calendar' && <div className="text-gray-400">Calendar view coming soon...</div>}
      {currentView === 'list' && <div className="text-gray-400">List view coming soon...</div>}
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </QueryClientProvider>
  )
}

export default App

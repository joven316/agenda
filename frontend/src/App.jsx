import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppProvider } from './context/AppContext'
import NavTabs from './components/NavTabs'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <div className="min-h-screen p-8 max-w-6xl mx-auto">
          <h1 className="font-serif text-5xl mb-8">Agenda</h1>
          <NavTabs />
          <p className="text-gray-400">View content coming soon...</p>
        </div>
      </AppProvider>
    </QueryClientProvider>
  )
}

export default App

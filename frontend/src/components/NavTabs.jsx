import React from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../context/AppContext'

const tabs = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'list', label: 'List' },
  { id: 'notes', label: 'Notes' },
]

export default function NavTabs() {
  const { currentView, setCurrentView, openEditPanel } = useAppContext()

  return (
    <div className="flex items-center border-b border-gray-700 mb-8">
      <div className="flex gap-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentView(tab.id)}
            className={`relative pb-2 text-lg transition-colors ${
              currentView === tab.id ? 'text-text' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {currentView === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {(currentView === 'agenda' || currentView === 'list' || currentView === 'notes') && (
        <button
          onClick={() => openEditPanel(
            null,
            currentView === 'list' ? new Date() : null,
            currentView === 'notes'
          )}
          className="btn-primary ml-auto mb-2"
        >
          + add row
        </button>
      )}
    </div>
  )
}

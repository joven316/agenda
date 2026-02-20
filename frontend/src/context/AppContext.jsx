import React, { createContext, useContext, useState } from 'react'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [currentView, setCurrentView] = useState('agenda')
  const [calendarSubView, setCalendarSubView] = useState('week')
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = day === 0 ? -6 : 1 - day // Monday as week start
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    return monday
  })
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [editPanelState, setEditPanelState] = useState({
    isOpen: false,
    taskId: null,
    mode: 'new', // 'new' | 'edit'
    defaultDate: null, // Pre-selected date for new tasks
  })

  const openEditPanel = (taskId = null, defaultDate = null) => {
    setEditPanelState({
      isOpen: true,
      taskId,
      mode: taskId ? 'edit' : 'new',
      defaultDate,
    })
  }

  const closeEditPanel = () => {
    setEditPanelState({
      isOpen: false,
      taskId: null,
      mode: 'new',
      defaultDate: null,
    })
  }

  const value = {
    currentView,
    setCurrentView,
    calendarSubView,
    setCalendarSubView,
    currentWeekStart,
    setCurrentWeekStart,
    currentMonth,
    setCurrentMonth,
    editPanelState,
    openEditPanel,
    closeEditPanel,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}

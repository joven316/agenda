import React, { createContext, useContext, useState } from 'react'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [currentView, setCurrentView] = useState('agenda')
  const [calendarSubView, setCalendarSubView] = useState('week')
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    const day = today.getDay() // 0 = Sunday
    const sunday = new Date(today)
    sunday.setDate(today.getDate() - day) // Sunday as week start
    return sunday
  })
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [editPanelState, setEditPanelState] = useState({
    isOpen: false,
    taskId: null,
    mode: 'new',
    defaultDate: null,
    defaultIsNote: false,
  })

  const openEditPanel = (taskId = null, defaultDate = null, defaultIsNote = false) => {
    setEditPanelState({
      isOpen: true,
      taskId,
      mode: taskId ? 'edit' : 'new',
      defaultDate,
      defaultIsNote,
    })
  }

  const closeEditPanel = () => {
    setEditPanelState({
      isOpen: false,
      taskId: null,
      mode: 'new',
      defaultDate: null,
      defaultIsNote: false,
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

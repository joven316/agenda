import React from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfMonth, endOfMonth, eachWeekOfInterval, addMonths, subMonths, isSameMonth, isSameDay } from 'date-fns'
import { useTasks } from '../hooks/useTasks'
import { useAppContext } from '../context/AppContext'

function WeeklyCalendar() {
  const { tasks } = useTasks('calendar')
  const { currentWeekStart, setCurrentWeekStart, openEditPanel } = useAppContext()

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeekStart, { weekStartsOn: 0 }),
    end: endOfWeek(currentWeekStart, { weekStartsOn: 0 }),
  })

  const getTasksForDay = (day) => {
    return tasks.filter((task) =>
      task.due_date && isSameDay(new Date(task.due_date), day)
    )
  }

  const handlePrevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1))
  }

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1))
  }

  return (
    <div>
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrevWeek} className="p-2 hover:bg-gray-800 rounded">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-medium">
          Week of {format(weekDays[0], 'MMM d')}–{format(weekDays[6], 'd, yyyy')}
        </h2>
        <button onClick={handleNextWeek} className="p-2 hover:bg-gray-800 rounded">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayTasks = getTasksForDay(day)
          return (
            <div
              key={day.toISOString()}
              className="border border-gray-700 rounded-lg p-3 min-h-[200px]"
            >
              <div className="font-medium text-sm mb-2">
                <div className="text-gray-400">{format(day, 'EEE')}</div>
                <div className="text-2xl">{format(day, 'd')}</div>
              </div>

              <div className="space-y-1">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => openEditPanel(task.id)}
                    className={`text-xs p-2 rounded cursor-pointer hover:bg-accent/20 transition-colors ${
                      task.completed ? 'opacity-60 line-through' : ''
                    }`}
                  >
                    {task.title}
                  </div>
                ))}
              </div>

              <button
                onClick={() => openEditPanel(null, day)}
                className="mt-2 text-xs text-gray-500 hover:text-accent transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add task
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MonthlyCalendar() {
  const { tasks } = useTasks('calendar')
  const { currentMonth, setCurrentMonth, openEditPanel } = useAppContext()

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const weeks = eachWeekOfInterval(
    { start: calendarStart, end: calendarEnd },
    { weekStartsOn: 0 }
  )

  const getTasksForDay = (day) => {
    return tasks.filter((task) =>
      task.due_date && isSameDay(new Date(task.due_date), day)
    )
  }

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  return (
    <div>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-800 rounded">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-medium">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-800 rounded">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm text-gray-500 font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week) =>
          eachDayOfInterval({
            start: week,
            end: endOfWeek(week, { weekStartsOn: 0 }),
          }).map((day) => {
            const dayTasks = getTasksForDay(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)

            return (
              <div
                key={day.toISOString()}
                className={`border border-gray-700 rounded p-2 min-h-[120px] ${
                  !isCurrentMonth ? 'opacity-40' : ''
                }`}
              >
                <div className="text-sm font-medium mb-1">{format(day, 'd')}</div>

                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => openEditPanel(task.id)}
                      className={`text-xs p-1 rounded cursor-pointer hover:bg-accent/20 transition-colors truncate ${
                        task.completed ? 'opacity-60 line-through' : ''
                      }`}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>

                <button
                  onClick={() => openEditPanel(null, day)}
                  className="mt-1 text-xs text-gray-600 hover:text-accent transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function CalendarView() {
  const { calendarSubView, setCalendarSubView } = useAppContext()

  return (
    <div>
      {/* Sub-navigation */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setCalendarSubView('week')}
          className={`pb-2 border-b-2 transition-colors ${
            calendarSubView === 'week'
              ? 'border-accent text-text'
              : 'border-transparent text-gray-500'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setCalendarSubView('month')}
          className={`pb-2 border-b-2 transition-colors ${
            calendarSubView === 'month'
              ? 'border-accent text-text'
              : 'border-transparent text-gray-500'
          }`}
        >
          Monthly
        </button>
      </div>

      {/* Calendar Content */}
      {calendarSubView === 'week' ? <WeeklyCalendar /> : <MonthlyCalendar />}
    </div>
  )
}

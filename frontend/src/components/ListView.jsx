import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { useTasks } from '../hooks/useTasks'
import { useAppContext } from '../context/AppContext'

export default function ListView() {
  const { tasks, isLoading, updateTask } = useTasks('list')
  const { openEditPanel } = useAppContext()

  const handleToggleComplete = (task) => {
    updateTask({
      id: task.id,
      data: { completed: !task.completed },
    })
  }

  const handleDoubleClick = (task) => {
    openEditPanel(task.id)
  }

  // Sort tasks: "No Date" active, dated active, all completed
  const sortedTasks = React.useMemo(() => {
    const active = tasks.filter((t) => !t.completed)
    const completed = tasks.filter((t) => t.completed)

    const activeNoDate = active.filter((t) => !t.due_date)
    const activeDated = active.filter((t) => t.due_date).sort((a, b) =>
      new Date(a.due_date) - new Date(b.due_date)
    )

    const completedDated = completed.filter((t) => t.due_date).sort((a, b) =>
      new Date(a.due_date) - new Date(b.due_date)
    )
    const completedNoDate = completed.filter((t) => !t.due_date)

    return [...activeNoDate, ...activeDated, ...completedDated, ...completedNoDate]
  }, [tasks])

  if (isLoading) {
    return <div className="text-gray-400">Loading...</div>
  }

  return (
    <div>
      <AnimatePresence>
        {sortedTasks.map((task, index) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`task-row ${task.completed ? 'task-row-completed' : ''}`}
            onClick={() => handleToggleComplete(task)}
            onDoubleClick={() => handleDoubleClick(task)}
          >
            <span className="row-number">
              {String(index + 1).padStart(2, '0')}
            </span>

            <span className={`flex-1 ${task.completed ? 'line-through' : ''}`}>
              {task.title}
            </span>

            {task.due_date && (
              <span className="text-gray-400 text-sm">
                {format(new Date(task.due_date), 'MM/dd')}
              </span>
            )}

            {task.completed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-600"
              >
                (completed)
              </motion.span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        onClick={() => openEditPanel(null, new Date())}
        className="btn-primary mt-4"
      >
        + add row
      </button>
    </div>
  )
}

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useAppContext } from '../context/AppContext'

function TaskRow({ task, index, onToggleComplete, onDoubleClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`task-row ${task.completed ? 'task-row-completed' : ''}`}
      onClick={() => onToggleComplete(task)}
      onDoubleClick={() => onDoubleClick(task)}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2"
      >
        <GripVertical className="w-4 h-4 text-gray-600" />
      </div>

      <span className="row-number">
        {String(index + 1).padStart(2, '0')}
      </span>

      <span className={`flex-1 ${task.completed ? 'line-through' : ''}`}>
        {task.title}
      </span>

      {task.completed && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => {
            e.stopPropagation()
            // Will be handled by parent
          }}
          className="btn-secondary text-sm px-3 py-1"
        >
          remove
        </motion.button>
      )}
    </motion.div>
  )
}

export default function AgendaView() {
  const { tasks, isLoading, updateTask, reorderTasks } = useTasks('agenda')
  const { openEditPanel } = useAppContext()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Separate active and completed tasks
  const activeTasks = tasks.filter((t) => !t.completed)
  const completedTasks = tasks.filter((t) => t.completed)
  const orderedTasks = [...activeTasks, ...completedTasks]

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = activeTasks.findIndex((t) => t.id === active.id)
      const newIndex = activeTasks.findIndex((t) => t.id === over.id)

      const reordered = arrayMove(activeTasks, oldIndex, newIndex)
      const reorderPayload = reordered.map((task, idx) => ({
        id: task.id,
        sort_order: idx,
      }))

      reorderTasks(reorderPayload)
    }
  }

  const handleToggleComplete = (task) => {
    updateTask({
      id: task.id,
      data: { completed: !task.completed },
    })
  }

  const handleDoubleClick = (task) => {
    openEditPanel(task.id)
  }

  if (isLoading) {
    return <div className="text-gray-400">Loading...</div>
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={activeTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence>
            {orderedTasks.map((task, index) => (
              <TaskRow
                key={task.id}
                task={task}
                index={index}
                onToggleComplete={handleToggleComplete}
                onDoubleClick={handleDoubleClick}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

      <button
        onClick={() => openEditPanel(null, null)}
        className="btn-primary mt-4"
      >
        + add row
      </button>
    </div>
  )
}

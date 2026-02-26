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
import { GripVertical, Pencil, Trash2, ChevronsUp } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useAppContext } from '../context/AppContext'

function TaskRow({ task, index, onToggleComplete, onEdit, onRemove, onMoveToTop }) {
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
      className={`task-row group ${task.completed ? 'task-row-completed' : ''}`}
      onClick={() => onToggleComplete(task)}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-gray-600" />
      </div>

      <span className="row-number">
        {String(index + 1).padStart(2, '0')}
      </span>

      <span className={`flex-1 text-xl ${task.completed ? 'line-through' : ''}`}>
        {task.title}
      </span>

      {!task.completed && index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onMoveToTop(task) }}
          className="group/top opacity-0 group-hover:opacity-100 transition-opacity flex items-center px-2.5 py-1.5 rounded hover:bg-gray-700 text-gray-400"
        >
          <ChevronsUp className="w-3.5 h-3.5 group-hover/top:text-accent" />
          <span className="ml-1.5 text-xs">move to top</span>
        </button>
      )}

      {!task.completed && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(task) }}
          className="group/modify opacity-0 group-hover:opacity-100 transition-opacity flex items-center px-2.5 py-1.5 rounded hover:bg-gray-700 text-gray-400"
        >
          <Pencil className="w-3.5 h-3.5 group-hover/modify:text-accent" />
          <span className="ml-1.5 text-xs">modify</span>
        </button>
      )}

      {task.completed && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(task) }}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center px-2.5 py-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="ml-1.5 text-xs">remove</span>
        </button>
      )}
    </motion.div>
  )
}

export default function AgendaView({ view = 'agenda' }) {
  const { tasks, isLoading, updateTask, deleteTask, reorderTasks } = useTasks(view)
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

  const handleEdit = (task) => {
    openEditPanel(task.id)
  }

  const handleRemove = (task) => {
    deleteTask(task.id)
  }

  const handleMoveToTop = (task) => {
    const reordered = [task, ...activeTasks.filter((t) => t.id !== task.id)]
    const reorderPayload = reordered.map((t, idx) => ({ id: t.id, sort_order: idx }))
    reorderTasks(reorderPayload)
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
                onEdit={handleEdit}
                onRemove={handleRemove}
                onMoveToTop={handleMoveToTop}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

    </div>
  )
}

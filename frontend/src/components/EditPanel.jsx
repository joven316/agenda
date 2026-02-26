import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksAPI, attachmentsAPI } from '../api/client'
import { useAppContext } from '../context/AppContext'
import DatePicker from './DatePicker'
import FileAttachments from './FileAttachments'

export default function EditPanel() {
  const { editPanelState, closeEditPanel } = useAppContext()
  const { isOpen, taskId, mode, defaultDate, defaultIsNote } = editPanelState
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState(defaultDate)
  const [noDate, setNoDate] = useState(!defaultDate)
  const [isNote, setIsNote] = useState(false)

  // Fetch task if editing
  const { data: task } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksAPI.getOne(taskId),
    enabled: !!taskId && isOpen,
  })

  // Fetch attachments if editing
  const { data: attachments = [] } = useQuery({
    queryKey: ['attachments', taskId],
    queryFn: () => attachmentsAPI.getForTask(taskId),
    enabled: !!taskId && isOpen,
  })

  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setNotes(task.notes || '')
      setDueDate(task.due_date ? new Date(task.due_date) : null)
      setNoDate(!task.due_date)
      setIsNote(task.is_note || false)
    } else if (mode === 'new') {
      setTitle('')
      setNotes('')
      setDueDate(defaultDate)
      setNoDate(!defaultDate)
      setIsNote(defaultIsNote || false)
    }
  }, [task, mode, defaultDate, defaultIsNote, isOpen])

  // Auto-save for existing tasks (debounced)
  useEffect(() => {
    if (mode === 'edit' && taskId) {
      const timer = setTimeout(() => {
        tasksAPI.update(taskId, {
          title: title || 'Untitled',
          notes,
          due_date: noDate ? null : dueDate?.toISOString().split('T')[0],
          is_note: isNote,
        }).then(() => {
          queryClient.invalidateQueries(['tasks'])
        })
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [title, notes, dueDate, noDate, isNote, mode, taskId, queryClient])

  const createMutation = useMutation({
    mutationFn: tasksAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      closeEditPanel()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: tasksAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      closeEditPanel()
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (files) => attachmentsAPI.upload(taskId, files),
    onSuccess: () => {
      queryClient.invalidateQueries(['attachments', taskId])
    },
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: attachmentsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['attachments', taskId])
    },
  })

  const handleSave = () => {
    if (mode === 'new') {
      if (title.trim()) {
        createMutation.mutate({
          title: title.trim(),
          notes,
          due_date: noDate ? null : dueDate?.toISOString().split('T')[0],
          completed: false,
          is_note: isNote,
        })
      }
    } else {
      // For edit mode, just close (auto-save already happened)
      closeEditPanel()
    }
  }

  const handleRemove = () => {
    if (taskId && confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate(taskId)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (mode === 'edit') {
        closeEditPanel() // Auto-saved
      } else {
        closeEditPanel() // Discard new task
      }
    }
  }

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      handleBackdropClick({ target: e.currentTarget, currentTarget: e.currentTarget })
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, mode])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-8"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="w-full bg-transparent text-2xl font-bold text-text border-none outline-none placeholder-gray-600"
                autoFocus
              />

              {/* Notes */}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                rows={4}
                className="w-full bg-gray-800 text-text p-3 rounded border border-gray-700 outline-none focus:border-accent resize-none placeholder-gray-600"
              />

              {/* Date Picker */}
              <DatePicker
                selected={dueDate}
                onSelect={setDueDate}
                noDate={noDate}
                onNoDateChange={setNoDate}
                isNote={isNote}
                onIsNoteChange={setIsNote}
              />

              {/* File Attachments (only for existing tasks) */}
              {taskId && (
                <FileAttachments
                  taskId={taskId}
                  attachments={attachments}
                  onUpload={(files) => uploadMutation.mutate(files)}
                  onDelete={(id) => deleteAttachmentMutation.mutate(id)}
                />
              )}

              {/* Actions */}
              <div className="flex justify-between pt-4">
                {mode === 'edit' && (
                  <button
                    onClick={handleRemove}
                    className="btn-secondary"
                  >
                    Remove
                  </button>
                )}
                {mode === 'new' && <div />}

                <button
                  onClick={handleSave}
                  className="btn-primary"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

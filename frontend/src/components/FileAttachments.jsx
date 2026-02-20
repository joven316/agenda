import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  FileSpreadsheet,
  FileType,
  FileImage,
  File as FileIcon,
  Upload,
  X,
} from 'lucide-react'
import { attachmentsAPI } from '../api/client'

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  const iconProps = { className: 'w-8 h-8' }

  if (ext === 'docx' || ext === 'doc') {
    return <FileText {...iconProps} className="w-8 h-8 text-blue-400" />
  }
  if (ext === 'xlsx' || ext === 'xls') {
    return <FileSpreadsheet {...iconProps} className="w-8 h-8 text-green-400" />
  }
  if (ext === 'pdf') {
    return <FileType {...iconProps} className="w-8 h-8 text-red-400" />
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
    return <FileImage {...iconProps} className="w-8 h-8 text-purple-400" />
  }
  return <FileIcon {...iconProps} className="w-8 h-8 text-gray-400" />
}

function FileItem({ file, onDelete }) {
  const [showDelete, setShowDelete] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = () => {
    if (showConfirm) {
      onDelete(file.id)
      setShowConfirm(false)
    } else {
      setShowConfirm(true)
    }
  }

  const handleDownload = () => {
    attachmentsAPI.download(file.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => {
        setShowDelete(false)
        setShowConfirm(false)
      }}
      className="relative flex items-center gap-3 p-3 rounded border border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer group"
      onClick={handleDownload}
    >
      {getFileIcon(file.filename)}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{file.filename}</p>
        <p className="text-xs text-gray-500">
          {(file.file_size / 1024).toFixed(1)} KB
        </p>
      </div>

      <AnimatePresence>
        {showDelete && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            className={`absolute top-2 right-2 p-1 rounded transition-colors ${
              showConfirm
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={showConfirm ? 'Click again to confirm' : 'Delete file'}
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FileAttachments({ taskId, attachments, onUpload, onDelete }) {
  const fileInputRef = React.useRef(null)

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      await onUpload(files)
      e.target.value = '' // Reset input
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">Attachments</h3>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1 text-sm btn-secondary"
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {attachments?.map((file) => (
            <FileItem key={file.id} file={file} onDelete={onDelete} />
          ))}
        </AnimatePresence>

        {(!attachments || attachments.length === 0) && (
          <p className="text-sm text-gray-600 text-center py-4">
            No attachments
          </p>
        )}
      </div>
    </div>
  )
}

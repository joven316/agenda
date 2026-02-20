const API_BASE = '/api'

// Helper for fetch requests
async function fetchAPI(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Request failed')
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null
  }

  return response.json()
}

// Task API
export const tasksAPI = {
  getAll: (view = 'agenda', dateFilter = null) => {
    const params = new URLSearchParams({ view })
    if (dateFilter) params.append('date', dateFilter)
    return fetchAPI(`/tasks?${params}`)
  },

  getOne: (id) => fetchAPI(`/tasks/${id}`),

  create: (task) =>
    fetchAPI('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),

  update: (id, task) =>
    fetchAPI(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    }),

  delete: (id) =>
    fetchAPI(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  reorder: (tasks) =>
    fetchAPI('/tasks/reorder', {
      method: 'PUT',
      body: JSON.stringify({ tasks }),
    }),
}

// Attachment API
export const attachmentsAPI = {
  getForTask: (taskId) => fetchAPI(`/tasks/${taskId}/attachments`),

  upload: async (taskId, files) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    const response = await fetch(`${API_BASE}/tasks/${taskId}/attachments`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    return response.json()
  },

  download: (attachmentId) => {
    window.open(`${API_BASE}/attachments/${attachmentId}/download`, '_blank')
  },

  delete: (attachmentId) =>
    fetchAPI(`/attachments/${attachmentId}`, {
      method: 'DELETE',
    }),
}

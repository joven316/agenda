import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksAPI } from '../api/client'

export function useTasks(view = 'agenda') {
  const queryClient = useQueryClient()

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', view],
    queryFn: () => tasksAPI.getAll(view),
  })

  const createMutation = useMutation({
    mutationFn: tasksAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => tasksAPI.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries(['tasks', view])
      const previousTasks = queryClient.getQueryData(['tasks', view])

      queryClient.setQueryData(['tasks', view], (old) =>
        old?.map((task) => (task.id === id ? { ...task, ...data } : task))
      )

      return { previousTasks }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['tasks', view], context.previousTasks)
    },
    onSettled: () => {
      queryClient.invalidateQueries(['tasks'])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: tasksAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
    },
  })

  const reorderMutation = useMutation({
    mutationFn: tasksAPI.reorder,
    onMutate: async (reorderedTasks) => {
      await queryClient.cancelQueries(['tasks', view])
      const previousTasks = queryClient.getQueryData(['tasks', view])

      queryClient.setQueryData(['tasks', view], reorderedTasks)

      return { previousTasks }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['tasks', view], context.previousTasks)
    },
    onSettled: () => {
      queryClient.invalidateQueries(['tasks'])
    },
  })

  return {
    tasks,
    isLoading,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    reorderTasks: reorderMutation.mutate,
  }
}

/**
 * optimistic-mutation — Helpers for optimistic UI updates with TanStack Query
 *
 * Provides factory functions to create optimistic mutations that:
 * 1. Update the cache immediately
 * 2. Roll back on error
 * 3. Invalidate queries on success
 * 4. Queue when offline
 */

/**
 * Create an optimistic update mutation for list resources.
 *
 * Usage:
 *   const addItem = useOptimisticCreate({
 *     queryKey: ['items'],
 *     mutationFn: (newItem) => apiClient.post('/items', newItem),
 *     itemBuilder: (variables) => ({ id: 'temp-'+Date.now(), ...variables }),
 *   });
 *
 * @param {object} options
 * @param {Array} options.queryKey — TanStack Query key to update
 * @param {Function} options.mutationFn — The API call
 * @param {Function} [options.itemBuilder] — Build optimistic item from variables
 * @param {Function} [options.onSuccess] — Extra success callback
 * @returns {object} — useMutation result
 */
export function useOptimisticCreate(options) {
  const { useMutation, useQueryClient } = require('@tanstack/react-query');
  const queryClient = useQueryClient();
  const { queryKey, mutationFn, itemBuilder, onSuccess } = options;

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      const optimisticItem = itemBuilder
        ? itemBuilder(variables)
        : { ...variables, id: `temp-${Date.now()}`, _optimistic: true };

      queryClient.setQueryData(queryKey, (old = []) => [optimisticItem, ...old]);

      return { previous, optimisticItem };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic item with server response
      if (context?.optimisticItem && data?.data) {
        queryClient.setQueryData(queryKey, (old = []) =>
          old.map((item) =>
            item.id === context.optimisticItem.id ? data.data : item
          )
        );
      }
      onSuccess?.(data, variables);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Create an optimistic update mutation for updating an item.
 *
 * Usage:
 *   const updateItem = useOptimisticUpdate({
 *     queryKey: ['items'],
 *     mutationFn: ({ id, ...data }) => apiClient.put(`/items/${id}`, data),
 *     updateOptimistic: (old, variables) => ({ ...old, ...variables }),
 *   });
 *
 * @param {object} options
 * @param {Array} options.queryKey
 * @param {Function} options.mutationFn
 * @param {Function} options.updateOptimistic — Merge function: (oldItem, variables) => newItem
 * @param {Function} [options.onSuccess]
 * @returns {object}
 */
export function useOptimisticUpdate(options) {
  const { useMutation, useQueryClient } = require('@tanstack/react-query');
  const queryClient = useQueryClient();
  const { queryKey, mutationFn, updateOptimistic, onSuccess } = options;

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      if (updateOptimistic) {
        queryClient.setQueryData(queryKey, (old = []) =>
          old.map((item) =>
            item.id === (variables.id || variables._id)
              ? { ...updateOptimistic(item, variables), _optimistic: true }
              : item
          )
        );
      }

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    ...(onSuccess ? { onSuccess } : {}),
  });
}

/**
 * Create an optimistic delete mutation.
 *
 * Usage:
 *   const deleteItem = useOptimisticDelete({
 *     queryKey: ['items'],
 *     mutationFn: (id) => apiClient.delete(`/items/${id}`),
 *   });
 *
 * @param {object} options
 * @param {Array} options.queryKey
 * @param {Function} options.mutationFn
 * @param {Function} [options.onSuccess]
 * @returns {object}
 */
export function useOptimisticDelete(options) {
  const { useMutation, useQueryClient } = require('@tanstack/react-query');
  const queryClient = useQueryClient();
  const { queryKey, mutationFn, onSuccess } = options;

  return useMutation({
    mutationFn,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old = []) =>
        old.filter((item) => item.id !== id && item._tempId !== id)
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    ...(onSuccess ? { onSuccess } : {}),
  });
}

"use client";
import {
  convexQuery,
  useConvexAction,
  useConvexMutation,
} from "@convex-dev/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/../convex/_generated/api";

export function useCreateUserConfig() {
  return useMutation({
    mutationFn: useConvexMutation(api.userConfig.createUserConfig),
  });
}

export function useGetUserConfig(userId: string) {
  return useQuery({
    ...convexQuery(api.userConfig.getUserConfig, {
      userId,
    }),
    enabled: !!userId,
  });
}

export function useUpdateUserConfig() {
  return useMutation({
    mutationFn: useConvexMutation(api.userConfig.updateUserConfig),
  });
}

export function useSyncGoogleCalendarWithUserConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexAction(
      api.userConfig.syncGoogleCalendarWithUserConfig
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendar", "getAllEventsForUser"],
      });
    },
  });
}

"use client";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/../convex/_generated/api";

export function useGetGoalsByUserId(userId: string) {
  return useQuery({
    ...convexQuery(api.goals.getGoalsByUserId, {
      userId,
    }),
    initialData: [],
    enabled: !!userId,
  });
}

export function useCreateGoal() {
  return useMutation({
    mutationFn: useConvexMutation(api.goals.createGoal),
  });
}

export function useUpdateGoal() {
  return useMutation({
    mutationFn: useConvexMutation(api.goals.updateGoal),
  });
}

export function useDeleteGoal() {
  return useMutation({
    mutationFn: useConvexMutation(api.goals.deleteGoal),
  });
}

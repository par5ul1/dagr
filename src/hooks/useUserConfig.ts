"use client";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
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
    initialData: null,
    enabled: !!userId,
  });
}

export function useUpdateUserConfig() {
  return useMutation({
    mutationFn: useConvexMutation(api.userConfig.updateUserConfig),
  });
}

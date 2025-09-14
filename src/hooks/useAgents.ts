"use client";
import { useConvexAction } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/../convex/_generated/api";

export function useTalkWithAgent() {
  return useMutation({
    mutationFn: useConvexAction(api.agent.talkWithAgent),
  });
}

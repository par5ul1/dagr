"use client";
import { useConvexAction } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/../convex/_generated/api";

export function useGetAllEventsForUser({
  userId,
  calendarIds,
  timeMin,
  timeMax,
  maxEvents = 2500,
}: {
  userId: string;
  calendarIds: string[];
  timeMin: string;
  timeMax: string;
  maxEvents?: number;
}) {
  const fn = useConvexAction(api.calendar.getAllEventsForUser);

  return useQuery({
    queryKey: ["calendar", "getAllEventsForUser", userId],
    queryFn: () =>
      fn({
        userId,
        calendarIds,
        timeMin,
        timeMax,
        maxEvents,
      }),
  });
}

export function useInsertCalendarEvent() {
  return useMutation({
    mutationFn: useConvexAction(api.calendar.insertCalendarEvent),
  });
}

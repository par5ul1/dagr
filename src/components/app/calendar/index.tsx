"use client";

import { addWeeks, formatDate, startOfWeek, subWeeks } from "date-fns";
import { useState } from "react";
import { Calendar, type CalendarEvent } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAllEventsForUser } from "@/hooks/useCalendar";
import { useGetUserConfig } from "@/hooks/useUserConfig";
import { authClient } from "@/lib/authClient";

export default function CalendarComponent({
  today,
  setToday,
  weekStart,
}: {
  today: Date;
  setToday: (date: Date) => void;
  weekStart: Date;
}) {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const userId = session?.user?.id ?? "";
  const { data: userConfig, isLoading: isUserConfigLoading } =
    useGetUserConfig(userId);
  const calendarIds =
    userConfig?.calendars?.items?.map((calendar) => calendar.id) ?? [];

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const { data: events, isLoading: isEventsLoading } = useGetAllEventsForUser({
    userId: session?.user?.id ?? "",
    calendarIds,
    timeMin: weekStart.toISOString(),
    timeMax: weekEnd.toISOString(),
  });

  if (isSessionPending || isUserConfigLoading || isEventsLoading) {
    return <Skeleton className="w-full h-full rounded-md" />;
  }

  return (
    <div className="border-[1px] border-border rounded-md overflow-hidden">
      <Calendar
        events={
          events
            ?.filter(
              (event) =>
                !event.start.date &&
                !event.end.date &&
                event.start.dateTime &&
                event.end.dateTime
            )
            .map((event) => ({
              start: new Date(event.start.dateTime ?? ""),
              end: new Date(event.end.dateTime ?? ""),
              title: event.summary,
              color: "pink",
              readonly: true,
              id: event.id,
            })) ?? []
        }
        setEvents={() => {
          throw new Error("Not implemented");
        }}
        date={today}
        setDate={setToday}
        className="h-full"
      />
    </div>
  );
}

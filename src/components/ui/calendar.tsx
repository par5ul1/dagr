"use client";

import { addDays, format, isSameDay, startOfDay, startOfWeek } from "date-fns";
import { CircleIcon } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useInterval } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const HOURS_IN_DAY = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 100; /* Height of each hour cell in pixels */
const TIME_COLUMN_WIDTH = 48; /* Width of the time column */
const HEADER_HEIGHT = 33; /* Height of the day header */
const MIN_DAY_WIDTH = 150; /* Minimum width for each day column */

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  readonly: boolean;
  color: string;
};

export type CalendarProps = {
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;
  date: Date;
  setDate: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  className?: string;
};

const CalendarContext = createContext<{
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;
  date: Date;
  setDate: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
} | null>(null);

function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error(
      "useCalendarContext must be used within a CalendarProvider"
    );
  }
  return context;
}

function getOverlappingEvents(
  currentEvent: CalendarEvent,
  events: CalendarEvent[],
  currentDate: Date
): CalendarEvent[] {
  return events.filter((event) => {
    if (event.id === currentEvent.id) return false;

    const eventsOverlap =
      currentEvent.start < event.end && currentEvent.end > event.start;

    const dayStart = startOfDay(currentDate);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const currentEventVisible =
      isSameDay(currentEvent.start, currentDate) ||
      (currentEvent.start < dayEnd && currentEvent.end > dayStart);

    const eventVisible =
      isSameDay(event.start, currentDate) ||
      (event.start < dayEnd && event.end > dayStart);

    return eventsOverlap && currentEventVisible && eventVisible;
  });
}

function getEventGroups(
  events: CalendarEvent[],
  currentDate: Date
): CalendarEvent[][] {
  const groups: CalendarEvent[][] = [];
  const processed = new Set<string>();

  events.forEach((event) => {
    if (processed.has(event.id)) return;

    const group = [event];
    processed.add(event.id);

    const overlapping = getOverlappingEvents(event, events, currentDate);
    overlapping.forEach((overlappingEvent) => {
      if (!processed.has(overlappingEvent.id)) {
        group.push(overlappingEvent);
        processed.add(overlappingEvent.id);
      }
    });

    group.sort((a, b) => a.start.getTime() - b.start.getTime());
    groups.push(group);
  });

  return groups;
}

function calculateEventPosition(
  event: CalendarEvent,
  allEvents: CalendarEvent[],
  currentDate: Date
): React.CSSProperties {
  const dayEvents = allEvents.filter((e) => {
    const eventStart = e.start;
    const eventEnd = e.end;
    const dayStart = startOfDay(currentDate);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    return (
      isSameDay(eventStart, currentDate) ||
      (eventStart < dayEnd && eventEnd > dayStart)
    );
  });

  const groups = getEventGroups(dayEvents, currentDate);
  const group = groups.find((g) => g.some((e) => e.id === event.id));

  const dayStart = startOfDay(currentDate);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const effectiveStart = event.start > dayStart ? event.start : dayStart;
  const effectiveEnd = event.end < dayEnd ? event.end : dayEnd;

  if (!group) {
    const startHour = effectiveStart.getHours();
    const startMinutes = effectiveStart.getMinutes();
    const endHour = effectiveEnd.getHours();
    const endMinutes = effectiveEnd.getMinutes();

    const topPosition =
      startHour * HOUR_HEIGHT + (startMinutes / 60) * HOUR_HEIGHT;
    const duration =
      endHour * 60 + endMinutes - (startHour * 60 + startMinutes);
    const height = (duration / 60) * HOUR_HEIGHT;

    return {
      position: "absolute",
      left: "0%",
      width: "100%",
      top: `${topPosition}px`,
      height: `${height}px`,
    };
  }

  const position = group.indexOf(event);
  const totalEvents = group.length;

  const width = `${100 / totalEvents}%`;
  const left = `${(position * 100) / totalEvents}%`;

  const startHour = effectiveStart.getHours();
  const startMinutes = effectiveStart.getMinutes();
  const endHour = effectiveEnd.getHours();
  const endMinutes = effectiveEnd.getMinutes();

  const topPosition =
    startHour * HOUR_HEIGHT + (startMinutes / 60) * HOUR_HEIGHT;
  const duration = endHour * 60 + endMinutes - (startHour * 60 + startMinutes);
  const height = (duration / 60) * HOUR_HEIGHT;

  return {
    position: "absolute",
    left,
    width,
    top: `${topPosition}px`,
    height: `${height}px`,
  };
}

function CalendarEvent({
  event,
  currentDate,
}: {
  event: CalendarEvent;
  currentDate: Date;
}) {
  const { events, onEventClick } = useCalendarContext();
  const style = calculateEventPosition(event, events, currentDate);

  const isEventStart = isSameDay(event.start, currentDate);
  const isEventEnd = isSameDay(event.end, currentDate);
  const isMultiDay = !isSameDay(event.start, event.end);
  const isContinuation = isMultiDay && !isEventStart;

  return (
    <div style={{ ...style }} className="px-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            tabIndex={-1}
            type="button"
            className={cn(
              "w-full h-[inherit] px-2 py-1 rounded-md truncate cursor-pointer transition-all duration-200 text-left flex flex-col",
              event.readonly
                ? "bg-gray-200/20 border border-gray-500 text-gray-200"
                : "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500 text-amber-500"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick?.(event);
            }}
          >
            <p className="font-bold truncate text-xs">{event.title}</p>
            <p className="text-xs truncate">
              {isEventStart && format(event.start, "h:mm a")} -{" "}
              {isEventEnd && format(event.end, "h:mm a")}
            </p>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-semibold">{event.title}</p>
            <p className="text-xs opacity-90">
              {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function CalendarHeader({ date }: { date: Date }) {
  const isToday = isSameDay(date, new Date());

  return (
    <div className="flex items-center justify-center gap-1 py-2 w-full sticky top-0 bg-background z-10 border-b">
      <span
        className={cn(
          "text-xs font-medium",
          isToday ? "text-primary font-bold" : "text-muted-foreground"
        )}
      >
        {format(date, "EEE")}
      </span>
      <span
        className={cn(
          "text-xs font-medium",
          isToday ? "text-primary font-bold" : "text-foreground"
        )}
      >
        {format(date, "dd")}
      </span>
    </div>
  );
}

function TimeColumn() {
  return (
    <div
      className="sticky left-0 bg-background z-10 flex flex-col"
      style={{ width: TIME_COLUMN_WIDTH }}
    >
      <div
        className="sticky top-0 left-0 bg-background z-20 border-b"
        style={{ height: HEADER_HEIGHT }}
      />
      <div
        className="sticky left-0 bg-background z-10 flex flex-col"
        style={{ width: TIME_COLUMN_WIDTH }}
      >
        {HOURS_IN_DAY.map((hour) => (
          <div
            key={hour}
            className="relative first:mt-0 border-r border-border"
            style={{ height: HOUR_HEIGHT }}
          >
            {hour !== 0 && (
              <span className="absolute text-xs text-muted-foreground -top-2.5 left-2">
                {format(new Date().setHours(hour, 0, 0, 0), "h a")}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayColumn({ date }: { date: Date }) {
  const isToday = isSameDay(date, new Date());
  const { events } = useCalendarContext();

  const dayEvents = events.filter((event) => {
    const eventStart = event.start;
    const eventEnd = event.end;
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    return (
      isSameDay(eventStart, date) ||
      (eventStart < dayEnd && eventEnd > dayStart)
    );
  });

  return (
    <div
      tabIndex={-1}
      className={cn("flex flex-col flex-grow", isToday && "bg-primary/5")}
      style={{ minWidth: MIN_DAY_WIDTH }}
    >
      <CalendarHeader date={date} />
      <div className="flex-1 relative">
        {HOURS_IN_DAY.map((hour) => (
          <div
            key={hour}
            className="border-b border-border/50 group"
            style={{ height: HOUR_HEIGHT }}
          />
        ))}
        {dayEvents.map((event) => (
          <CalendarEvent key={event.id} event={event} currentDate={date} />
        ))}
        {isToday && <CurrentTimeline />}
      </div>
    </div>
  );
}

function CurrentTimeline() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useInterval(() => {
    setCurrentTime(new Date());
  }, 60000);

  const dayProgress =
    (currentTime.getTime() - startOfDay(currentTime).getTime()) /
    (24 * 60 * 60 * 1000);

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none transition-[top] flex items-center -translate-x-1"
      style={{
        top: `${dayProgress * 100}%`,
        height: "1px",
      }}
    >
      <CircleIcon className="h-2 w-2 text-primary/70" />
      <div className="h-full w-full -mr-1 border-t-1 border-primary/70" />
    </div>
  );
}

function CalendarBody() {
  const { date } = useCalendarContext();
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const scrollTop =
        currentHour * HOUR_HEIGHT +
        (currentMinute / 60) * HOUR_HEIGHT -
        HOUR_HEIGHT * 2; /* Show 2 hours before current time */

      const currentDay = now.getDay();
      const mondayOffset = currentDay === 0 ? 6 : currentDay - 1;
      const scrollLeft = mondayOffset * MIN_DAY_WIDTH;

      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = Math.max(0, scrollTop);
        scrollContainer.scrollLeft = Math.max(0, scrollLeft);
      }
    }
  }, []);

  return (
    <ScrollArea ref={scrollAreaRef} className="h-full">
      <div
        className="relative flex divide-x"
        style={{
          minWidth: TIME_COLUMN_WIDTH + MIN_DAY_WIDTH * 7,
          height: HOURS_IN_DAY.length * HOUR_HEIGHT + HEADER_HEIGHT,
        }}
      >
        <TimeColumn />
        {weekDays.map((day) => (
          <DayColumn key={day.toISOString()} date={day} />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
}

export function Calendar({
  events,
  setEvents,
  date,
  setDate,
  onEventClick,
  onDateClick,
  className,
}: CalendarProps) {
  return (
    <CalendarContext.Provider
      value={{
        events,
        setEvents,
        date,
        setDate,
        onEventClick,
        onDateClick,
      }}
    >
      <div className={cn("overflow-hidden", className)}>
        <CalendarBody />
      </div>
    </CalendarContext.Provider>
  );
}

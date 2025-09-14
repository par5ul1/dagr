"use client";

import { addDays, format, isSameDay, startOfDay, startOfWeek } from "date-fns";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useInterval } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "./scroll-area";

const HOURS_IN_DAY = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 100; /* Height of each hour cell in pixels */
const TIME_COLUMN_WIDTH = 48; /* Width of the time column */
const HEADER_HEIGHT = 33; /* Height of the day header */
const MIN_DAY_WIDTH = 150; /* Minimum width for each day column */

export type CalendarEvent = {
  id: string;
  title: string;
  color: string;
  start: Date;
  end: Date;
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
  events: CalendarEvent[]
): CalendarEvent[] {
  return events.filter((event) => {
    if (event.id === currentEvent.id) return false;
    return (
      currentEvent.start < event.end &&
      currentEvent.end > event.start &&
      isSameDay(currentEvent.start, event.start)
    );
  });
}

function getEventGroups(events: CalendarEvent[]): CalendarEvent[][] {
  const groups: CalendarEvent[][] = [];
  const processed = new Set<string>();

  events.forEach((event) => {
    if (processed.has(event.id)) return;

    const group = [event];
    processed.add(event.id);

    const overlapping = getOverlappingEvents(event, events);
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
  allEvents: CalendarEvent[]
): React.CSSProperties {
  const dayEvents = allEvents.filter((e) => isSameDay(e.start, event.start));

  const groups = getEventGroups(dayEvents);
  const group = groups.find((g) => g.some((e) => e.id === event.id));

  if (!group) {
    const startHour = event.start.getHours();
    const startMinutes = event.start.getMinutes();
    let endHour = event.end.getHours();
    let endMinutes = event.end.getMinutes();

    if (!isSameDay(event.start, event.end)) {
      endHour = 23;
      endMinutes = 59;
    }

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

  const startHour = event.start.getHours();
  const startMinutes = event.start.getMinutes();

  let endHour = event.end.getHours();
  let endMinutes = event.end.getMinutes();

  if (!isSameDay(event.start, event.end)) {
    endHour = 23;
    endMinutes = 59;
  }

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

function CalendarEvent({ event }: { event: CalendarEvent }) {
  const { events, onEventClick } = useCalendarContext();
  const style = calculateEventPosition(event, events);

  return (
    <div style={{ ...style }} className="px-1">
      <button
        type="button"
        className={cn(
          "w-full h-[inherit] px-2 py-1 rounded-md truncate cursor-pointer transition-all duration-200 text-left flex flex-col",
          "bg-[var(--_color)]/25 hover:bg-[var(--_color)]/20 border border-[var(--_color)] text-[var(--_color)]"
        )}
        style={
          {
            "--_color": event.color,
          } as React.CSSProperties
        }
        onClick={(e) => {
          e.stopPropagation();
          onEventClick?.(event);
        }}
      >
        <p className="font-bold truncate text-xs">{event.title}</p>
        <p className="text-xs truncate">
          {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
        </p>
      </button>
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
  const dayEvents = events.filter((event) => isSameDay(event.start, date));

  return (
    <div
      className={cn("flex flex-col flex-grow", isToday && "bg-primary/5")}
      style={{ minWidth: MIN_DAY_WIDTH }}
    >
      <CalendarHeader date={date} />
      <div className="flex-1 relative cursor-pointer">
        {HOURS_IN_DAY.map((hour) => (
          <div
            key={hour}
            className="border-b border-border/50 group"
            style={{ height: HOUR_HEIGHT }}
          />
        ))}
        {dayEvents.map((event) => (
          <CalendarEvent key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

function CurrentTimeLine() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useInterval(() => {
    setCurrentTime(new Date());
  }, 60000);

  const dayProgress =
    (currentTime.getTime() - startOfDay(currentTime).getTime()) /
    (24 * 60 * 60 * 1000);

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none transition-[top]"
      style={{
        top: `${dayProgress * 100}%`,
        height: "2px",
      }}
    >
      <div className="h-full w-full border-t-2 border-dashed [dasharray:2px] border-accent-foreground/50" />
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
      const mondayOffset = currentDay === 0 ? 6 : currentDay - 1; // Convert Sunday=0 to Monday=0
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
        <CurrentTimeLine />
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

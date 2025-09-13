"use client";

import { addWeeks, formatDate, startOfWeek, subWeeks } from "date-fns";
import { useState } from "react";
import { Calendar, type CalendarEvent } from "@/components/ui/calendar";

function generateMockEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });

  const eventTitles = [
    "Team Standup",
    "Project Review",
    "Client Meeting",
    "Design Workshop",
    "Code Review",
    "Sprint Planning",
    "Product Demo",
    "Architecture Discussion",
  ];

  const colors = [
    "blue",
    "indigo",
    "pink",
    "red",
    "orange",
    "amber",
    "emerald",
  ];

  for (let i = 0; i < 15; i++) {
    const dayOffset = Math.floor(Math.random() * 7);
    const eventDate = new Date(startOfCurrentWeek);
    eventDate.setDate(eventDate.getDate() + dayOffset);

    const startHour = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
    const startMinutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
    const duration = [30, 60, 90, 120][Math.floor(Math.random() * 4)]; // 30, 60, 90, or 120 minutes

    const startTime = new Date(eventDate);
    startTime.setHours(startHour, startMinutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);

    events.push({
      id: `event-${i + 1}`,
      title: eventTitles[Math.floor(Math.random() * eventTitles.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      start: startTime,
      end: endTime,
    });
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export default function CalendarComponent({
  today,
  setToday,
  weekStart,
}: {
  today: Date;
  setToday: (date: Date) => void;
  weekStart: Date;
}) {
  const [events, setEvents] = useState<CalendarEvent[]>(generateMockEvents());

  const handleEventClick = (event: CalendarEvent) => {
    console.log("Event clicked:", event);
    // You can add event editing/management logic here
  };

  const handleDateClick = (date: Date) => {
    console.log("Date clicked:", date);
    // You can add new event creation logic here
  };

  const handleAddEvent = () => {
    console.log("Add event clicked");
    // You can add new event creation logic here
  };

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div className="border-[1px] border-border rounded-md overflow-hidden">
      <Calendar
        events={events}
        setEvents={setEvents}
        date={today}
        setDate={setToday}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
        className="h-full"
      />
    </div>
  );
}

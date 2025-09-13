"use client";

import { formatDate, startOfWeek } from "date-fns";
import { useState } from "react";
import Calendar from "@/components/calendar";
import Sidebar from "@/components/sidebar";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function Dashboard() {
  const [today, setToday] = useState(new Date());
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  return (
    <SidebarProvider>
      <Sidebar />
      <div className="flex flex-col h-svh w-full overflow-hidden">
        <header className="flex items-center gap-2 p-4 border-b">
          <SidebarTrigger />
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">
              Week of {formatDate(weekStart, "MMMM d, yyyy")}
            </h1>
          </div>
        </header>
        <main className="flex flex-col h-full gap-4 min-h-0 p-4">
          <Calendar today={today} setToday={setToday} weekStart={weekStart} />
          <Input placeholder="Add event" />
        </main>
      </div>
    </SidebarProvider>
  );
}

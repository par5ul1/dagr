"use client";

import { formatDate, startOfWeek } from "date-fns";
import { redirect } from "next/navigation";
import { useState } from "react";
import Calendar from "@/components/app/calendar";
import Sidebar from "@/components/app/sidebar";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { authClient } from "@/lib/authClient";

export default function Dashboard() {
  const { isPending, data: session } = authClient.useSession();

  const [today, setToday] = useState(new Date());

  if (isPending) return <div>Loading FROM THE TOP...</div>;
  if (!session) redirect("/auth");

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

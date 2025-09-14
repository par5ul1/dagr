"use client";

import {
  addDays,
  addWeeks,
  differenceInDays,
  formatDate,
  isBefore,
  startOfWeek,
} from "date-fns";
import { SparkleIcon, SparklesIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { useState } from "react";
import Calendar from "@/components/app/calendar";
import Sidebar from "@/components/app/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Interstitial from "@/components/ui/interstitial";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { authClient } from "@/lib/authClient";

export default function Dashboard() {
  const { isPending, data: session } = authClient.useSession();

  const [today, setToday] = useState(new Date());

  if (isPending) return <Interstitial message="Loading..." />;
  if (!session) redirect("/auth");

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const canGenerateNextWeek =
    differenceInDays(today, addDays(weekStart, 6)) <= 1;
  const hasGeneratedNextWeek = false; /* TODO: add this back in */
  const isGeneratingNextWeek = false; /* TODO: add this back in */

  return (
    <SidebarProvider>
      <Sidebar />
      <div className="flex flex-col h-svh w-full overflow-hidden">
        <header className="flex items-center gap-2 p-4 border-b">
          <SidebarTrigger />
          <div className="flex items-center justify-between w-full">
            <h1 className="text-xl font-semibold">
              Week of {formatDate(weekStart, "MMMM d, yyyy")}
            </h1>
            <div className="flex items-center gap-2">
              <Button disabled={!canGenerateNextWeek && !hasGeneratedNextWeek}>
                {hasGeneratedNextWeek ? (
                  "See Next Week"
                ) : (
                  <>
                    <SparklesIcon className="size-4" />
                    {isGeneratingNextWeek
                      ? "Generating..."
                      : "Generate Next Week"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>
        <main className="flex flex-col h-full gap-4 min-h-0 p-4 items-center">
          <Calendar today={today} setToday={setToday} weekStart={weekStart} />
          <Input
            className="h-12 shrink-0 w-3/4 rounded-4xl"
            placeholder="Any changes?"
            rightAdornment={
              <Button className="rounded-full">
                <SparkleIcon className="size-4" />
                Send
              </Button>
            }
          />
        </main>
      </div>
    </SidebarProvider>
  );
}

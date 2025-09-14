"use client";

import {
  addDays,
  differenceInDays,
  formatDate,
  isSameDay,
  startOfWeek,
} from "date-fns";
import { SparkleIcon, SparklesIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { useState } from "react";
import type { Doc } from "@/../convex/_generated/dataModel";
import Calendar from "@/components/app/calendar";
import Sidebar from "@/components/app/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Interstitial from "@/components/ui/interstitial";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useGetUserConfig } from "@/hooks/useUserConfig";
import { authClient } from "@/lib/authClient";

export default function Dashboard() {
  const { isPending, data: session } = authClient.useSession();

  const [today, setToday] = useState(new Date());

  const { data: userConfig, isLoading: isUserConfigLoading } = useGetUserConfig(
    session?.user.id ?? "",
  );
  const hasDagrCalendar = userConfig?.dagrCalendarId !== undefined;

  const [selectedGoals, setSelectedGoals] = useState<Doc<"goals">[]>([]);

  if (isPending || isUserConfigLoading)
    return <Interstitial message="Loading..." />;
  if (!session) redirect("/auth");

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const canGenerateNextWeek =
    differenceInDays(Date.now(), addDays(weekStart, 6)) <= 1;
  const hasGeneratedNextWeek = false; /* TODO: add this back in */
  const isGeneratingNextWeek = false; /* TODO: add this back in */

  const handleSeeNextWeek = () => {
    setToday(addDays(weekStart, 7));
  };
  const handleSeePreviousWeek = () => {
    setToday(new Date());
  };

  const handleGenerateNextWeek = () => {
    console.log("Generate Next Week");
  };

  const handlePlanWeek = () => {
    console.log("Plan Week");
  };

  return (
    <SidebarProvider>
      <Sidebar
        selectedGoals={selectedGoals}
        setSelectedGoals={setSelectedGoals}
      />
      <div className="flex flex-col h-svh w-full overflow-hidden">
        <header className="flex items-center gap-2 p-4 border-b">
          <SidebarTrigger />
          <div className="flex items-center justify-between w-full">
            <h1 className="text-xl font-semibold">
              Week of {formatDate(weekStart, "MMMM d, yyyy")}
            </h1>
            <div className="flex items-center gap-2">
              {!isSameDay(today, new Date()) && (
                <Button onClick={handleSeePreviousWeek}>Today</Button>
              )}
              {hasDagrCalendar ? (
                <Button
                  disabled={
                    (!canGenerateNextWeek && !hasGeneratedNextWeek) ||
                    selectedGoals.length === 0
                  }
                  onClick={
                    hasGeneratedNextWeek
                      ? handleSeeNextWeek
                      : handleGenerateNextWeek
                  }
                >
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
              ) : null}
            </div>
          </div>
        </header>
        <main className="flex flex-col h-full gap-4 min-h-0 p-4 items-center">
          {hasDagrCalendar ? (
            <>
              <Calendar
                today={today}
                setToday={setToday}
                weekStart={weekStart}
              />
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full gap-4">
              <p className="text-muted-foreground">
                Pick some goals and let&apos;s plan your week!
              </p>
              <Button
                disabled={selectedGoals.length === 0}
                onClick={handlePlanWeek}
              >
                <SparklesIcon />
                Plan
              </Button>
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}

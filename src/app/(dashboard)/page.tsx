"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  addDays,
  differenceInDays,
  formatDate,
  isSameDay,
  startOfWeek,
} from "date-fns";
import { SparkleIcon, SparklesIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/../convex/_generated/api";
import type { Doc } from "@/../convex/_generated/dataModel";
import type { CalendarEvent } from "@/../convex/calendar";
import Calendar from "@/components/app/calendar";
import Sidebar from "@/components/app/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Interstitial from "@/components/ui/interstitial";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useTalkWithAgent } from "@/hooks/useAgents";
import { useGetAllEventsForUser } from "@/hooks/useCalendar";
import {
  useGetUserConfig,
  useSyncGoogleCalendarWithUserConfig,
} from "@/hooks/useUserConfig";
import { authClient } from "@/lib/authClient";
import generatePlannerPrompt from "@/utils/generatePlannerPrompt";
import { convex } from "../providers/ConvexClientProvider";

export default function Dashboard() {
  const { isPending, data: session } = authClient.useSession();

  const [today, setToday] = useState(new Date());

  const { data: userConfig, isLoading: isUserConfigLoading } = useGetUserConfig(
    session?.user.id ?? ""
  );
  const hasDagrCalendar = userConfig?.dagrCalendarId !== undefined;

  const [selectedGoals, setSelectedGoals] = useState<Doc<"goals">[]>([]);

  const talkWithAgent = useTalkWithAgent();
  const queryClient = useQueryClient();
  const [isMakingPlan, setIsMakingPlan] = useState(false);

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const canGenerateNextWeek =
    differenceInDays(Date.now(), addDays(weekStart, 6)) <= 1;
  const [hasGeneratedNextWeek, setHasGeneratedNextWeek] = useState(false);
  const { data: currentWeekEvents, isLoading: isLoadingCurrentWeekEvents } =
    useGetAllEventsForUser({
      userId: session?.user.id ?? "",
      calendarIds:
        userConfig?.calendars.items.map((calendar) => calendar.id) ?? [],
      timeMin: weekStart.toISOString(),
      timeMax: addDays(weekStart, 6).toISOString(),
      maxEvents: 2500,
    });
  const { data: nextWeekEvents, isLoading: isLoadingNextWeekEvents } =
    useGetAllEventsForUser({
      userId: session?.user.id ?? "",
      calendarIds:
        userConfig?.calendars.items.map((calendar) => calendar.id) ?? [],
      timeMin: addDays(weekStart, 7).toISOString(),
      timeMax: addDays(weekStart, 13).toISOString(),
      maxEvents: 2500,
    });
  const { data: nextWeekDagrEvents } = useGetAllEventsForUser({
    userId: session?.user.id ?? "",
    calendarIds: [userConfig?.dagrCalendarId ?? ""],
    timeMin: addDays(weekStart, 7).toISOString(),
    timeMax: addDays(weekStart, 13).toISOString(),
    maxEvents: 2500,
  });

  useEffect(() => {
    if (nextWeekDagrEvents?.length) {
      setHasGeneratedNextWeek(true);
    }
  }, [nextWeekDagrEvents]);

  const syncGoogleCalendarMutation = useSyncGoogleCalendarWithUserConfig();
  const handleSyncGoogleCalendar = async () => {
    if (!userConfig?._id) return;
    return syncGoogleCalendarMutation.mutateAsync({
      userId: session?.user.id ?? "",
      userConfigId: userConfig._id,
    });
  };

  const [chatMessage, setChatMessage] = useState("");

  if (isPending || isUserConfigLoading)
    return <Interstitial message="Loading..." />;
  if (!session) redirect("/auth");

  const handleSeeNextWeek = () => {
    setToday(addDays(weekStart, 7));
  };
  const handleSeePreviousWeek = () => {
    setToday(new Date());
  };

  const handleMakePlan = async (
    calendarEvents: CalendarEvent[],
    userMessage?: string
  ) => {
    await talkWithAgent.mutateAsync({
      userId: session?.user.id ?? "",
      messages: [
        generatePlannerPrompt({
          goals: selectedGoals,
          calendarEvents,
          userPersona: userConfig?.preferences.userPersona ?? "",
          motivations: userConfig?.preferences.motivations ?? "",
          userMessage,
        }),
      ],
    });
    await queryClient.invalidateQueries({
      queryKey: ["calendar", "getAllEventsForUser"],
    });
  };

  const handleGenerateNextWeek = async () => {
    if (!nextWeekEvents || isLoadingNextWeekEvents) return;
    setIsMakingPlan(true);
    try {
      setHasGeneratedNextWeek(true);
      await handleMakePlan(nextWeekEvents);
    } catch (error) {
      console.error(error);
    } finally {
      setIsMakingPlan(false);
    }
  };
  const handlePlanWeek = async () => {
    if (!currentWeekEvents || isLoadingCurrentWeekEvents) return;
    setIsMakingPlan(true);
    try {
      await handleMakePlan(currentWeekEvents);
      if (!hasDagrCalendar) {
        await handleSyncGoogleCalendar();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsMakingPlan(false);
    }
  };
  const handleSendChatMessage = async () => {
    if (!chatMessage || isMakingPlan || !currentWeekEvents) return;
    const message = chatMessage;
    setChatMessage("");
    setIsMakingPlan(true);
    try {
      await handleMakePlan(currentWeekEvents, message);
    } catch (error) {
      console.error(error);
      setChatMessage(message);
    } finally {
      setIsMakingPlan(false);
    }
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
              {hasDagrCalendar ? (
                !isSameDay(today, new Date()) ? (
                  <Button onClick={handleSeePreviousWeek}>Today</Button>
                ) : (
                  <Button
                    disabled={
                      !(canGenerateNextWeek || selectedGoals.length === 0) &&
                      !hasGeneratedNextWeek
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
                        {isMakingPlan /* TODO: Improve this loader to be unique to the button */
                          ? "Generating..."
                          : "Generate Next Week"}
                      </>
                    )}
                  </Button>
                )
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
                  <Button
                    className="rounded-full"
                    disabled={!chatMessage || isMakingPlan}
                    onClick={handleSendChatMessage}
                  >
                    <SparkleIcon className="size-4" />
                    Send
                  </Button>
                }
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendChatMessage();
                  }
                }}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full gap-4">
              <p className="text-muted-foreground">
                Pick some goals and let&apos;s plan your week!
              </p>
              <Button
                disabled={selectedGoals.length === 0 || isMakingPlan}
                onClick={handlePlanWeek}
              >
                <SparklesIcon />
                {isMakingPlan ? "Planning..." : "Plan"}
              </Button>
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}

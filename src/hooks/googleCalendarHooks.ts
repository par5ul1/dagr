"use client";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/authClient";

const GOOGLE_CALENDAR_BASE_URL = "https://www.googleapis.com/calendar/v3";

export function useGetAllCalendars() {
  return useQuery({
    queryKey: ["getAllCalendars"],
    queryFn: async () => {
      const { data } = await authClient.getAccessToken({
        providerId: "google",
      });

      if (!data?.accessToken) {
        throw new Error("No access token");
      }

      const res = await fetch(
        `${GOOGLE_CALENDAR_BASE_URL}/users/me/calendarList`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
    },
  });
}

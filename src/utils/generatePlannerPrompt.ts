import type { Doc } from "../../convex/_generated/dataModel";
import type { CalendarEvent } from "../../convex/calendar";

export default function generatePlannerPrompt({
  goals,
  calendarEvents,
  userPersona,
  motivations,
  userMessage,
}: {
  goals: Doc<"goals">[];
  calendarEvents: Pick<CalendarEvent, "title" | "summary" | "start" | "end">[];
  userPersona: string;
  motivations: string;
  userMessage?: string;
}) {
  return `
User's Relevant Goals:
${JSON.stringify(goals)}

User's Persona
${JSON.stringify(userPersona)}

User's Motivations
${JSON.stringify(motivations)}

${userMessage ? `User's Message: ${userMessage}` : ""}

User's Calendar Events
${JSON.stringify(calendarEvents)}
  `;
}

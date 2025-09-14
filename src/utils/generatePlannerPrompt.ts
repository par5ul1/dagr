export default function generatePlannerPrompt({
  goals,
  calendarEvents,
  userPersona,
  motivations,
  userMessage,
}: {
  goals: string;
  calendarEvents: string;
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

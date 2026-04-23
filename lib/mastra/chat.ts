import type { ChatMessage } from "../types/core.types";

export function convertToChatMessages(
  history: ChatMessage[],
): { role: "user" | "assistant" | "system"; content: string }[] {
  return history.map((message) => {
    const role =
      typeof message.role === "string" ? message.role.toLowerCase() : "user";
    const content =
      typeof message.content === "string" ? message.content : "";

    if (role === "assistant" || role === "ai") {
      return { role: "assistant" as const, content };
    }
    if (role === "system") {
      return { role: "system" as const, content };
    }
    return { role: "user" as const, content };
  });
}

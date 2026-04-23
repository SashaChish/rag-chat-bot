import { Agent } from "@mastra/core/agent";
import { getModelString } from "./config";
import { getSystemPrompt } from "./prompts";

export function createAgent(options: {
  id: string;
  name: string;
  instructions?: string;
  model?: string;
}) {
  return new Agent({
    id: options.id,
    name: options.name,
    instructions: options.instructions ?? getSystemPrompt(),
    model: options.model ?? getModelString(),
  });
}

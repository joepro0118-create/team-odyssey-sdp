import {
  processAssistantRequest,
  type AssistantMessage,
  type LanguageChoice,
} from "@/lib/assistant-engine";
import { apiError, json, readBody } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await readBody(request)) as {
      messages?: AssistantMessage[];
      language?: LanguageChoice;
    };
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const language = body?.language;

    const response = await processAssistantRequest(messages, language);
    return json(response, 200);
  } catch (error) {
    return apiError(error);
  }
}

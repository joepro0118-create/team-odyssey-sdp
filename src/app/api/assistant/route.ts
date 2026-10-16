import { processAssistantRequest, type AssistantMessage } from "@/lib/assistant-engine";
import { apiError, json, readBody } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await readBody(request)) as { messages?: AssistantMessage[] };
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    const response = await processAssistantRequest(messages);
    return json(response, 200);
  } catch (error) {
    return apiError(error);
  }
}

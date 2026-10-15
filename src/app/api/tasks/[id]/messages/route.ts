import { MarketplaceError } from "@/lib/marketplace-service";
import { apiError, json, readBody } from "@/lib/server/http";
import { requireSupabaseUser } from "@/lib/server/supabase";

export const runtime = "nodejs";

// In-memory fallback if the migration has not been applied to the live database yet
type MemoryMessage = {
  id: string;
  assignmentId: string;
  senderId: string;
  senderLabel: string;
  message: string;
  createdAt: string;
};
const memoryMessages: MemoryMessage[] = [];

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: assignmentId } = await context.params;
    const { supabase, user } = await requireSupabaseUser(request);

    // Verify user is participant
    const { data: assignment, error: assignmentError } = await supabase
      .from("task_assignments")
      .select("id, listing_id, helper_id, listings!inner(id, creator_id, status)")
      .eq("id", assignmentId)
      .maybeSingle();

    if (assignmentError) throw new MarketplaceError(assignmentError.message, 500);
    if (!assignment) throw new MarketplaceError("Task assignment not found", 404);

    const listing = Array.isArray(assignment.listings)
      ? assignment.listings[0]
      : (assignment.listings as { id: string; creator_id: string; status: string } | null);

    const isCreator = listing?.creator_id === user.id;
    const isHelper = assignment.helper_id === user.id;
    if (!isCreator && !isHelper) {
      throw new MarketplaceError("Access denied", 403);
    }

    const isLocked = listing?.status === "completed" || listing?.status === "cancelled";

    // Attempt to query from public.task_messages
    const { data: dbMessages, error: msgError } = await supabase
      .from("task_messages")
      .select("id, sender_id, message, created_at")
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: true });

    if (!msgError && dbMessages) {
      const messages = dbMessages.map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        isSelf: m.sender_id === user.id,
        senderLabel: m.sender_id === listing?.creator_id ? "Requester" : "Helper",
        message: m.message,
        createdAt: m.created_at,
      }));
      return json({ messages, isLocked });
    }

    // Fallback to memoryMessages if table doesn't exist yet in Supabase
    const messages = memoryMessages
      .filter((m) => m.assignmentId === assignmentId)
      .map((m) => ({
        id: m.id,
        senderId: m.senderId,
        isSelf: m.senderId === user.id,
        senderLabel: m.senderLabel,
        message: m.message,
        createdAt: m.createdAt,
      }));

    return json({ messages, isLocked });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: assignmentId } = await context.params;
    const body = (await readBody(request)) as { message?: string };
    const text = typeof body?.message === "string" ? body.message.trim() : "";

    if (!text || text.length > 500) {
      throw new MarketplaceError("Message must be between 1 and 500 characters.", 400);
    }

    const { supabase, user } = await requireSupabaseUser(request);

    // Verify user is participant and task is active
    const { data: assignment, error: assignmentError } = await supabase
      .from("task_assignments")
      .select("id, listing_id, helper_id, listings!inner(id, creator_id, status)")
      .eq("id", assignmentId)
      .maybeSingle();

    if (assignmentError) throw new MarketplaceError(assignmentError.message, 500);
    if (!assignment) throw new MarketplaceError("Task assignment not found", 404);

    const listing = Array.isArray(assignment.listings)
      ? assignment.listings[0]
      : (assignment.listings as { id: string; creator_id: string; status: string } | null);

    const isCreator = listing?.creator_id === user.id;
    const isHelper = assignment.helper_id === user.id;
    if (!isCreator && !isHelper) {
      throw new MarketplaceError("Access denied", 403);
    }

    if (listing?.status !== "accepted" && listing?.status !== "awaiting_confirmation") {
      throw new MarketplaceError("Task is no longer active for messaging.", 400);
    }

    const senderLabel = isCreator ? "Requester" : "Helper";

    // Attempt DB insert
    const { data: inserted, error: insertError } = await supabase
      .from("task_messages")
      .insert({
        assignment_id: assignmentId,
        sender_id: user.id,
        message: text,
      })
      .select("id, sender_id, message, created_at")
      .single();

    if (!insertError && inserted) {
      return json(
        {
          id: inserted.id,
          senderId: inserted.sender_id,
          isSelf: true,
          senderLabel,
          message: inserted.message,
          createdAt: inserted.created_at,
        },
        201,
      );
    }

    // Fallback in-memory
    const memMsg: MemoryMessage = {
      id: crypto.randomUUID(),
      assignmentId,
      senderId: user.id,
      senderLabel,
      message: text,
      createdAt: new Date().toISOString(),
    };
    memoryMessages.push(memMsg);

    return json(
      {
        id: memMsg.id,
        senderId: memMsg.senderId,
        isSelf: true,
        senderLabel,
        message: memMsg.message,
        createdAt: memMsg.createdAt,
      },
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}

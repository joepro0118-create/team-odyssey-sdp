import { MarketplaceError } from "@/lib/marketplace-service";
import { encryptTaskMessage, decryptTaskMessage } from "@/lib/server/chat-crypto";
import { apiError, json, readBody } from "@/lib/server/http";
import { requireSupabaseUser } from "@/lib/server/supabase";

export const runtime = "nodejs";

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

    if (msgError) {
      console.error("Could not load task messages", msgError);
      throw new MarketplaceError("Chat is unavailable. Please try again later.", 503);
    }

    const messages = (dbMessages ?? []).map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      isSelf: m.sender_id === user.id,
      senderLabel: m.sender_id === listing?.creator_id ? "Requester" : "Helper",
      message: decryptTaskMessage(m.message),
      createdAt: m.created_at,
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

    if (!text || text.length > 300) {
      throw new MarketplaceError("Message must be between 1 and 300 characters.", 400);
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
    const encryptedMessage = encryptTaskMessage(text);

    const { data: inserted, error: insertError } = await supabase
      .from("task_messages")
      .insert({
        assignment_id: assignmentId,
        sender_id: user.id,
        message: encryptedMessage,
      })
      .select("id, sender_id, message, created_at")
      .single();

    if (insertError || !inserted) {
      console.error("Could not save task message", insertError);
      throw new MarketplaceError("Message was not sent. Please try again later.", 503);
    }

    return json(
      {
        id: inserted.id,
        senderId: inserted.sender_id,
        isSelf: true,
        senderLabel,
        message: decryptTaskMessage(inserted.message),
        createdAt: inserted.created_at,
      },
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}

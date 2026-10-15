"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, Send, ShieldCheck, Lock } from "lucide-react";
import { api, errorMessage } from "@/lib/client-api";
import type { TaskChatResponse, TaskMessage } from "@/lib/types";

export function TaskChat({
  assignmentId,
  partnerName,
  listingTitle,
  isCompleted,
  onClose,
}: {
  assignmentId: string;
  partnerName: string;
  listingTitle: string;
  isCompleted: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [isLocked, setIsLocked] = useState(isCompleted);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await api<TaskChatResponse>(
        `/api/tasks/${assignmentId}/messages`,
      );
      setMessages(data.messages);
      if (data.isLocked) setIsLocked(true);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [assignmentId]);

  useEffect(() => {
    void fetchMessages();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void fetchMessages();
    }, 4000);
    return () => window.clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(messageToSend?: string) {
    const toSend = (messageToSend ?? text).trim();
    if (!toSend || busy || isLocked) return;

    setBusy(true);
    setError("");
    try {
      const created = await api<TaskMessage>(
        `/api/tasks/${assignmentId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ message: toSend }),
        },
      );
      setMessages((prev) => [...prev, created]);
      if (!messageToSend) setText("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const quickChips = [
    "I'm on my way!",
    "I've arrived at the lobby",
    "Give me 5 mins",
    "Thank you!",
  ];

  return (
    <div className="task-chat-view" role="dialog" aria-label="Task Coordination Chat">
      {/* Header */}
      <header className="chat-header">
        <button
          onClick={onClose}
          aria-label="Back to task"
          className="chat-back-btn"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="chat-header-info">
          <h2>{partnerName}</h2>
          <span className="chat-task-title">{listingTitle}</span>
        </div>
        <div className="chat-partner-avatar">
          {partnerName.slice(0, 1).toUpperCase()}
        </div>
      </header>

      {/* Safety notice banner */}
      <div className="chat-safety-banner">
        <ShieldCheck size={16} />
        <span>In-app coordination only. Handover is confirmed via QR.</span>
      </div>

      {/* Messages scroll area */}
      <div className="chat-messages-container">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <p>Coordinate your meeting point and timing here.</p>
            <span className="chat-empty-hint">
              Tap a quick reply below or type a message.
            </span>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`chat-bubble-row ${m.isSelf ? "self" : "partner"}`}
            >
              <div className="chat-bubble">
                <span className="chat-sender-label">{m.senderLabel}</span>
                <p>{m.message}</p>
                <time className="chat-timestamp">
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="chat-error-bar">{error}</div>}

      {/* Locked message if completed */}
      {isLocked ? (
        <div className="chat-locked-bar">
          <Lock size={16} />
          <span>Handover confirmed. This coordination chat is closed.</span>
        </div>
      ) : (
        <div className="chat-bottom-section">
          {/* Quick status chips */}
          <div className="chat-quick-chips">
            {quickChips.map((chip) => (
              <button
                key={chip}
                disabled={busy}
                onClick={() => void send(chip)}
                className="chat-quick-chip"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="chat-input-bar"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              disabled={busy}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={busy || !text.trim()}
              aria-label="Send message"
              className="chat-send-btn"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Bot, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { api, errorMessage } from "@/lib/client-api";
import type {
  AssistantMessage,
  AssistantResponse,
  AssistantProposal,
  LanguageChoice,
} from "@/lib/assistant-engine";
import type { Listing } from "@/lib/types";

interface TolongAssistantProps {
  onListingCreated?: (listing: Listing) => void;
}

export function TolongAssistant({ onListingCreated }: TolongAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const [selectedLang, setSelectedLang] = useState<LanguageChoice>("auto");
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content:
        "Hai! Saya Pembantu Maya Tolong 👋 Anda boleh beritahu saya apa bantuan yang anda perlukan (contohnya: belikan barang dapur, pinjam alatan, atau baiki lampu). Saya akan bantu siapkan permintaan untuk jiran anda!\n\nHi! I can help you draft neighbourhood requests or answer questions about points and safety. How can I assist you?",
    },
  ]);
  const [activeProposal, setActiveProposal] = useState<AssistantProposal | null>(null);
  const [proposalStatus, setProposalStatus] = useState<"idle" | "posting" | "posted" | "error">("idle");
  const [postedListing, setPostedListing] = useState<Listing | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLargeText, setIsLargeText] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping, activeProposal]);

  const handleLanguageChange = (lang: LanguageChoice) => {
    setSelectedLang(lang);
    if (lang === "ms") {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Bahasa Melayu dipilih 🇲🇾. Sila beritahu saya bantuan yang anda perlukan!",
        },
      ]);
    } else if (lang === "en") {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "English selected 🇬🇧. Please tell me what help you need!",
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Mod pengesanan automatik dipilih 🌐. Anda boleh taip dalam Bahasa Melayu atau English!",
        },
      ]);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text || isTyping) return;

    setInputText("");
    setErrorMsg("");
    setProposalStatus("idle");

    const newHistory: AssistantMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newHistory);
    setIsTyping(true);

    try {
      const res = await api<AssistantResponse>("/api/assistant", {
        method: "POST",
        body: JSON.stringify({ messages: newHistory, language: selectedLang }),
      });

      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      if (res.proposal) {
        setActiveProposal(res.proposal);
      }
    } catch (err) {
      setErrorMsg(errorMessage(err));
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            selectedLang === "en"
              ? "Sorry, the system encountered a technical issue. Please try again shortly."
              : "Maaf, sistem mengalami sedikit masalah teknikal. Sila cuba lagi sebentar lagi.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmPost = async () => {
    if (!activeProposal || proposalStatus === "posting") return;
    setProposalStatus("posting");
    setErrorMsg("");

    try {
      const created = await api<Listing>("/api/listings", {
        method: "POST",
        body: JSON.stringify({
          type: activeProposal.type,
          category: activeProposal.category,
          title: activeProposal.title,
          description: activeProposal.description,
          area: activeProposal.area,
          timing: activeProposal.timing,
        }),
      });

      setProposalStatus("posted");
      setPostedListing(created);
      if (onListingCreated) {
        onListingCreated(created);
      }
    } catch (err) {
      setProposalStatus("error");
      setErrorMsg(errorMessage(err));
    }
  };

  const quickPrompts =
    selectedLang === "ms"
      ? [
          { label: "🛒 Beli barang dapur", query: "Tolong belikan telur dan roti di kedai bawah petang ni" },
          { label: "🛠️ Baiki lampu rumah", query: "Boleh jiran tolong tukar mentol lampu dapur esok?" },
          { label: "🪜 Pinjam tangga", query: "Ada siapa boleh pinjamkan tangga lipat selama sejam?" },
          { label: "🪙 Cara guna mata", query: "Bagaimana sistem mata ganjaran berfungsi?" },
        ]
      : selectedLang === "en"
      ? [
          { label: "🛒 Buy groceries", query: "Need help picking up eggs and bread from the shop today" },
          { label: "🛠️ Fix lightbulb", query: "Can a neighbour help replace a kitchen lightbulb tomorrow?" },
          { label: "🪜 Borrow a ladder", query: "Can anyone lend a step ladder for an hour?" },
          { label: "🪙 How points work", query: "How do community points and rewards work?" },
        ]
      : [
          { label: "🛒 Beli dapur / Groceries", query: "Tolong belikan telur dan roti di kedai bawah" },
          { label: "🛠️ Baiki lampu / Fix light", query: "Need help changing a high lightbulb tomorrow" },
          { label: "🪜 Pinjam tangga / Ladder", query: "Ada siapa boleh pinjamkan tangga?" },
          { label: "🪙 Mata ganjaran / Points", query: "How do community points and rewards work?" },
        ];

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        type="button"
        className={`sdp-assistant-floating-btn ${isOpen ? "btn-hidden" : ""}`}
        onClick={handleOpen}
        aria-label="Tolong Assistant"
        title="Tolong Assistant"
      >
        <Bot className="w-7 h-7 text-white" strokeWidth={2.2} />
      </button>

      {/* Assistant Modal / Bottom Sheet */}
      <div
        className={`sdp-assistant-overlay ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        onClick={handleClose}
      >
        <div
          className={`sdp-assistant-card ${isLargeText ? "large-text" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
            {/* Grab handle for smooth native sheet feel */}
            <div className="sdp-sheet-grab-bar" aria-hidden="true">
              <span className="sdp-sheet-grab-pill" />
            </div>

            {/* Header */}
            <header className="sdp-assistant-header">
              <div className="sdp-assistant-title-group">
                <div className="sdp-assistant-avatar">
                  <Bot className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <h3 className="sdp-assistant-title">Tolong Assistant</h3>
                  <p className="sdp-assistant-subtitle">
                    {selectedLang === "ms"
                      ? "Pembantu Kejiranan Anda"
                      : selectedLang === "en"
                      ? "Your Community Helper"
                      : "Bilingual Senior & Community Guide"}
                  </p>
                </div>
              </div>

              <div className="sdp-assistant-header-actions">
                {/* Language Selector */}
                <div className="sdp-lang-selector" role="group" aria-label="Pilih bahasa">
                  <button
                    type="button"
                    className={`sdp-lang-btn ${selectedLang === "auto" ? "active" : ""}`}
                    onClick={() => handleLanguageChange("auto")}
                    title="Auto-detect language"
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    className={`sdp-lang-btn ${selectedLang === "ms" ? "active" : ""}`}
                    onClick={() => handleLanguageChange("ms")}
                    title="Bahasa Melayu"
                  >
                    BM
                  </button>
                  <button
                    type="button"
                    className={`sdp-lang-btn ${selectedLang === "en" ? "active" : ""}`}
                    onClick={() => handleLanguageChange("en")}
                    title="English"
                  >
                    EN
                  </button>
                </div>

                {/* Font Size Toggle for Seniors */}
                <button
                  type="button"
                  className={`sdp-font-toggle-btn ${isLargeText ? "active" : ""}`}
                  onClick={() => setIsLargeText(!isLargeText)}
                  title="Tukar saiz tulisan untuk warga emas"
                >
                  {isLargeText ? "A" : "A+"}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  className="sdp-assistant-close-btn"
                  onClick={handleClose}
                  aria-label="Tutup pembantu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Quick Suggestion Chips */}
            <div className="sdp-assistant-chips-container">
              {quickPrompts.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="sdp-assistant-chip"
                  onClick={() => handleSend(chip.query)}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Message Thread */}
            <div ref={messagesContainerRef} className="sdp-assistant-messages">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`sdp-assistant-msg-row ${m.role === "user" ? "user-row" : "assistant-row"}`}
                >
                  {m.role === "assistant" && (
                    <div className="sdp-bot-bubble-avatar">
                      <Bot className="w-4 h-4 text-emerald-700" />
                    </div>
                  )}
                  <div className={`sdp-assistant-bubble ${m.role === "user" ? "user-bubble" : "bot-bubble"}`}>
                    <p className="sdp-bubble-text">{m.content}</p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="sdp-assistant-msg-row assistant-row">
                  <div className="sdp-bot-bubble-avatar">
                    <Bot className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="sdp-assistant-bubble bot-bubble typing-bubble">
                    <span className="dot-typing" />
                  </div>
                </div>
              )}

              {/* Action Proposal Card (Shown if Assistant detected a request) */}
              {activeProposal && (
                <div className="sdp-proposal-card">
                  <div className="sdp-proposal-header">
                    <span className="sdp-proposal-badge">
                      {activeProposal.type === "request"
                        ? selectedLang === "en"
                          ? "Community Request"
                          : selectedLang === "ms"
                          ? "Permintaan Komuniti"
                          : "Permintaan / Request"
                        : selectedLang === "en"
                        ? "Community Offer"
                        : selectedLang === "ms"
                        ? "Tawaran Komuniti"
                        : "Tawaran / Offer"}
                    </span>
                    <span className="sdp-proposal-category">{activeProposal.category}</span>
                  </div>

                  <h4 className="sdp-proposal-title">{activeProposal.title}</h4>
                  <p className="sdp-proposal-desc">{activeProposal.description}</p>

                  <div className="sdp-proposal-meta">
                    <span>📍 {activeProposal.area}</span>
                    <span>⏰ {activeProposal.timing}</span>
                  </div>

                  {proposalStatus === "posted" ? (
                    <div className="sdp-proposal-success">
                      <CheckCircle className="w-5 h-5 text-emerald-700" />
                      <span>
                        {selectedLang === "en"
                          ? "Successfully posted! Your neighbors can now see your request."
                          : "Berjaya disiarkan! Permintaan anda kini boleh dilihat oleh jiran."}
                      </span>
                    </div>
                  ) : (
                    <div className="sdp-proposal-actions">
                      <button
                        type="button"
                        className="sdp-proposal-confirm-btn"
                        onClick={handleConfirmPost}
                        disabled={proposalStatus === "posting"}
                      >
                        {proposalStatus === "posting" ? (
                          selectedLang === "en" ? "Posting..." : "Menyiarkan..."
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1 inline" />
                            {selectedLang === "en"
                              ? "Confirm & Post to Community"
                              : selectedLang === "ms"
                              ? "Sahkan & Siarkan ke Komuniti"
                              : "Sahkan & Siarkan / Confirm & Post"}
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="sdp-proposal-cancel-btn"
                        onClick={() => setActiveProposal(null)}
                      >
                        {selectedLang === "en" ? "Cancel" : "Batal"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {errorMsg && (
                <div className="sdp-assistant-error">
                  <AlertTriangle className="w-4 h-4 mr-1 text-red-600 inline" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              className="sdp-assistant-input-bar"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                type="text"
                className="sdp-assistant-input"
                placeholder={
                  selectedLang === "ms"
                    ? "Taip bantuan anda di sini... (Bahasa Melayu)"
                    : selectedLang === "en"
                    ? "Type your request here... (English)"
                    : "Taip bantuan / Type your request..."
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isTyping}
              />
              <button
                type="submit"
                className="sdp-assistant-send-btn"
                disabled={isTyping || !inputText.trim()}
                aria-label={selectedLang === "en" ? "Send message" : "Hantar mesej"}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
    </>
  );
}

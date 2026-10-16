"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  Check,
} from "lucide-react";
import { api, errorMessage } from "@/lib/client-api";
import type {
  AssistantMessage,
  AssistantResponse,
  AssistantProposal,
  LanguageChoice,
} from "@/lib/assistant-engine";
import type { Listing } from "@/lib/types";

function LanguageTranslateIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a14 14 0 0 0 0 17" />
      <path d="M12 3.5a14 14 0 0 1 0 17" />
      <path d="M3.8 9.5h16.4" />
      <path d="M3.8 14.5h16.4" />
      <rect
        x="1.5"
        y="1.5"
        width="8.5"
        height="7.5"
        rx="2"
        fill="#ffffff"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <text
        x="5.75"
        y="7.2"
        fontSize="6.5"
        fontWeight="800"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        A
      </text>
      <rect
        x="14"
        y="15"
        width="8.5"
        height="7.5"
        rx="2"
        fill="#ffffff"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <text
        x="18.25"
        y="20.6"
        fontSize="6"
        fontWeight="800"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        文
      </text>
    </svg>
  );
}

const LANG_OPTIONS: { code: LanguageChoice; flag: string; label: string; subtext: string }[] = [
  {
    code: "auto",
    flag: "🌐",
    label: "Kesan Automatik",
    subtext: "Auto-detect language",
  },
  {
    code: "ms",
    flag: "🇲🇾",
    label: "Bahasa Melayu",
    subtext: "Melayu rasmi & mesra jiran",
  },
  {
    code: "en",
    flag: "🇬🇧",
    label: "English",
    subtext: "Township mutual aid guide",
  },
  {
    code: "zh",
    flag: "🇨🇳",
    label: "中文 (Mandarin)",
    subtext: "华文邻里互助指南",
  },
];

interface TolongAssistantProps {
  onListingCreated?: (listing: Listing) => void;
}

export function TolongAssistant({ onListingCreated }: TolongAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const [selectedLang, setSelectedLang] = useState<LanguageChoice>("auto");
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!isLangDropdownOpen) return;
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLangDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLangDropdownOpen]);

  const handleLanguageChange = (lang: LanguageChoice) => {
    setSelectedLang(lang);
    setIsLangDropdownOpen(false);
    if (lang === "ms") {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Bahasa Melayu dipilih 🇲🇾. Sila beritahu saya bantuan yang anda perlukan!",
        },
      ]);
    } else if (lang === "zh") {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "已选择中文 🇨🇳。请告诉我您需要什么邻里帮助！",
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
          content: "Mod pengesanan automatik dipilih 🌐. Anda boleh taip dalam Bahasa Melayu, English, atau 中文!",
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
      : selectedLang === "zh"
      ? [
          { label: "🛒 代买食材杂货", query: "请问有邻居可以帮忙在楼下杂货店买鸡蛋和面包吗？" },
          { label: "🛠️ 更换厨房灯泡", query: "明天可以请邻居协助更换厨房天花板的高处灯泡吗？" },
          { label: "🪜 借用家用梯子", query: "有谁可以借折叠梯子用一个小时吗？" },
          { label: "🪙 社区积分运作", query: "请问 Tolong 社区积分与奖赏是如何运作的？" },
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
        <span className="sdp-assistant-floating-badge" aria-hidden="true" />
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
                  <Bot className="w-5 h-5 text-[#C8102E]" />
                </div>
                <div>
                  <h3 className="sdp-assistant-title">Tolong Assistant</h3>
                  <p className="sdp-assistant-subtitle">
                    {selectedLang === "ms"
                      ? "Pembantu Kejiranan Anda"
                      : selectedLang === "zh"
                      ? "您的智能邻里小助手"
                      : selectedLang === "en"
                      ? "Your Community Helper"
                      : "Multilingual Senior & Community Guide"}
                  </p>
                </div>
              </div>

              <div className="sdp-assistant-header-actions">
                {/* Language Selector Dropdown */}
                <div className="sdp-lang-dropdown-wrapper" ref={langDropdownRef}>
                  <button
                    type="button"
                    className={`sdp-lang-trigger-btn ${isLangDropdownOpen ? "open" : ""}`}
                    onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                    title="Pilih Bahasa / Select Language"
                    aria-label="Pilih Bahasa / Select Language"
                    aria-expanded={isLangDropdownOpen}
                  >
                    <LanguageTranslateIcon className="w-4 h-4 text-current" />
                    <span className="sdp-lang-trigger-badge">
                      {selectedLang === "auto"
                        ? "Auto"
                        : selectedLang === "ms"
                        ? "BM"
                        : selectedLang === "zh"
                        ? "中文"
                        : "EN"}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 opacity-80 transition-transform ${
                        isLangDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isLangDropdownOpen && (
                    <div className="sdp-lang-menu" role="menu">
                      <div className="sdp-lang-menu-header">Pilih Bahasa / Language</div>
                      {LANG_OPTIONS.map((opt) => (
                        <button
                          key={opt.code}
                          type="button"
                          role="menuitem"
                          className={`sdp-lang-menu-item ${
                            selectedLang === opt.code ? "selected" : ""
                          }`}
                          onClick={() => handleLanguageChange(opt.code)}
                        >
                          <span className="sdp-lang-menu-flag">{opt.flag}</span>
                          <div className="sdp-lang-menu-labels">
                            <span className="sdp-lang-menu-name">{opt.label}</span>
                            <span className="sdp-lang-menu-sub">{opt.subtext}</span>
                          </div>
                          {selectedLang === opt.code && (
                            <Check className="w-4 h-4 text-[#C8102E] sdp-lang-menu-check" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
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
                  <X className="w-4 h-4" />
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
                      <Bot className="w-4 h-4 text-[#C8102E]" />
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
                    <Bot className="w-4 h-4 text-[#C8102E]" />
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
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="sdp-proposal-badge">
                        {activeProposal.type === "request"
                          ? selectedLang === "en"
                            ? "Request"
                            : selectedLang === "ms"
                            ? "Permintaan"
                            : selectedLang === "zh"
                            ? "求助"
                            : "Request"
                          : selectedLang === "en"
                          ? "Offer"
                          : selectedLang === "ms"
                          ? "Tawaran"
                          : selectedLang === "zh"
                          ? "提供"
                          : "Offer"}
                      </span>
                      <span className="sdp-proposal-category">{activeProposal.category}</span>
                    </div>
                    <span className="sdp-proposal-points">
                      {activeProposal.type === "offer" ? "Free" : "+20 pts"}
                    </span>
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
                          : selectedLang === "zh"
                          ? "已成功发布！邻居们现在可以查看您的互助请求。"
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
                          selectedLang === "en"
                            ? "Posting..."
                            : selectedLang === "zh"
                            ? "发布中..."
                            : "Menyiarkan..."
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1.5 inline" />
                            {selectedLang === "en"
                              ? "Confirm & Post to Community"
                              : selectedLang === "zh"
                              ? "确认并发布到社区"
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
                        {selectedLang === "en"
                          ? "Cancel"
                          : selectedLang === "zh"
                          ? "取消"
                          : "Batal"}
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
                    : selectedLang === "zh"
                    ? "在此输入您的求助内容... (中文)"
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
                aria-label={
                  selectedLang === "en"
                    ? "Send message"
                    : selectedLang === "zh"
                    ? "发送信息"
                    : "Hantar mesej"
                }
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
    </>
  );
}

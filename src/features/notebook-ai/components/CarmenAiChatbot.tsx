"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Star,
  X,
  Send,
  BookOpen,
  GraduationCap,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  PlusCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { ChatMessage, StudentCarmenProfile } from "../types";
import { INITIAL_CHAT_MESSAGES } from "../mock-carmen-data";

interface CarmenAiChatbotProps {
  studentProfile: StudentCarmenProfile;
  courseCode?: string;
  notebookContent?: string;
  onInsertToNotebook?: (text: string) => void;
  isOpenExternal?: boolean;
  onToggleExternal?: () => void;
}

export function CarmenAiChatbot({
  studentProfile,
  courseCode = "CSE 2221",
  notebookContent = "",
  onInsertToNotebook,
  isOpenExternal,
  onToggleExternal,
}: CarmenAiChatbotProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isOpenExternal !== undefined ? isOpenExternal : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    if (onToggleExternal) onToggleExternal();
    else setInternalIsOpen(val);
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    INITIAL_CHAT_MESSAGES(studentProfile.name, courseCode)
  );
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpen = () => {
      if (onToggleExternal) onToggleExternal();
      else setInternalIsOpen(true);
    };
    window.addEventListener("buckeye:open-carmen-ai", handleOpen);
    return () => window.removeEventListener("buckeye:open-carmen-ai", handleOpen);
  }, [onToggleExternal]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = (userQuery?: string) => {
    const textToSend = userQuery || inputText;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userQuery) setInputText("");
    setIsTyping(true);

    // Contextual AI intelligence matching Carmen Canvas & group notes
    setTimeout(() => {
      let aiReply = "";
      let carmenBadge = "Carmen Canvas API · Live Sync";
      let suggestedActionText = "";

      const lower = textToSend.toLowerCase();

      if (lower.includes("what should") || lower.includes("study next") || lower.includes("focus")) {
        aiReply = `Based on your Carmen gradebook for ${courseCode} and your group's current discussion on Thompson Floor 3:\n\n1. **High Priority (Canvas Flag):** Your Canvas Quiz 4 had trouble with *recursive base case conditions*. Make sure to test cases where input is 0 or empty.\n2. **Group Opportunity:** Your peer Jordan Lee has already mastered recursion call-tree tracing. Ask them to verify your \`reverseQueue()\` base case!\n3. **Upcoming Deadline:** Homework 6 is due tomorrow at 11:59 PM. Practice Problem 3 on NaturalNumber recursion.`;
        carmenBadge = "CarmenCanvas Course Syllabus & Quiz 4 Analytics";
        suggestedActionText = "### Carmen AI Focus Topic\n- **Target:** Base case testing for recursion\n- **Rule:** If input is 0 or null, return immediately before recursive step.";
      } else if (lower.includes("quiz") || lower.includes("test")) {
        aiReply = `Here is a Carmen exam-style practice problem for ${studentProfile.name}:\n\n**Question:** Consider the recursive method:\n\`\`\`java\nint mystery(int n) {\n  if (n <= 1) return 1;\n  return n * mystery(n - 1);\n}\n\`\`\`\nWhat happens if \`mystery(-3)\` is called? How would you fix the base case to safeguard against negative inputs?`;
        carmenBadge = "Carmen Question Bank · CSE 2221 Midterm 2";
        suggestedActionText = "### Practice Problem (Carmen Exam Bank)\nTrace `mystery(-3)`. The base case `n <= 1` immediately returns 1, avoiding infinite recursion!";
      } else if (lower.includes("error") || lower.includes("mistake") || lower.includes("check")) {
        aiReply = `I scanned your group's active notes:\n\n✅ **Good:** Your group correctly identified that omitting a base case causes a \`StackOverflowError\`.\n⚠️ **Potential Gotcha:** Make sure that when mutating a \`Queue1L\` in Java, you restore items after the recursive return, or the caller's queue will end up empty!`;
        carmenBadge = "Carmen Code Analysis & Notes Checker";
      } else if (lower.includes("deadline") || lower.includes("carmen") || lower.includes("homework")) {
        const course = studentProfile.courses[0];
        aiReply = `📅 **Upcoming Carmen Canvas Deadlines for ${studentProfile.name}:**\n\n• **${course?.courseCode}**: ${course?.nextAssignment.title} (Due: ${course?.nextAssignment.dueDate})\n• **Midterm 2**: Covers Recursion, Sequence3, and XMLTree in 4 days at Jennings Hall 001.`;
        carmenBadge = "CarmenCanvas Calendar API Sync";
      } else {
        aiReply = `I analyzed your question against ${courseCode} course competencies on CarmenCanvas. For ${studentProfile.name}, continuing to trace recursive steps with your table partners Jordan and Sam is the fastest way to prepare for Midterm 2!`;
      }

      const botMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "carmen_ai",
        text: aiReply,
        timestamp: "Just now",
        carmenSourceBadge: carmenBadge,
        suggestedAction: suggestedActionText
          ? {
              label: "Add to Group Notes",
              payloadText: suggestedActionText,
            }
          : undefined,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 750);
  };

  return (
    <>
      {/* Polished iOS Chat Drawer / Modal (No floating button) */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-stone-900/30 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Carmen AI Study Companion"
            className={`fixed inset-x-3 bottom-18 sm:inset-auto sm:bottom-20 sm:right-6 z-50 bg-white/95 backdrop-blur-xl border border-stone-300/80 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
              isExpanded
                ? "sm:w-[520px] h-[78vh] max-h-[640px]"
                : "sm:w-[410px] h-[65vh] max-h-[520px]"
            }`}
          >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#a51c30] via-red-900 to-stone-900 text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-amber-300">
                <Star size={17} className="fill-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-tight">Carmen AI Study Companion</h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-200 font-mono border border-emerald-400/30">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-stone-300 flex items-center gap-1">
                  <GraduationCap size={11} className="text-amber-300" />
                  Synced with CarmenCanvas · {studentProfile.buckeyeIdDisplay}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded text-stone-300 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label={isExpanded ? "Collapse chat" : "Expand chat"}
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-stone-300 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Carmen Canvas API Status Sub-bar */}
          <div className="bg-amber-50/80 px-3.5 py-1.5 border-b border-amber-200/50 flex items-center justify-between text-[10px] text-amber-900">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Carmen API: {studentProfile.courses[0]?.courseCode} ({studentProfile.courses[0]?.instructor})
            </span>
            <span className="text-amber-800/80 font-mono">
              Grade: {studentProfile.courses[0]?.currentGrade}
            </span>
          </div>

          {/* Chat Message Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#faf9f5]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                    msg.sender === "user"
                      ? "bg-[#a51c30] text-white rounded-br-xs"
                      : "bg-white text-stone-800 border border-stone-200/90 rounded-bl-xs"
                  }`}
                >
                  {msg.carmenSourceBadge && (
                    <div className="flex items-center gap-1 text-[9px] font-semibold text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 mb-1.5 border border-amber-200/60 w-fit">
                      <Sparkles size={10} className="text-amber-600" />
                      {msg.carmenSourceBadge}
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {msg.suggestedAction && onInsertToNotebook && (
                    <button
                      type="button"
                      onClick={() => onInsertToNotebook(msg.suggestedAction!.payloadText)}
                      className="mt-2.5 inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100/70 hover:bg-amber-200/80 text-amber-950 font-semibold text-[10px] cursor-pointer transition-colors"
                    >
                      <PlusCircle size={12} className="text-amber-700" />
                      {msg.suggestedAction.label}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 px-1 text-[9px] text-stone-400">
                  <span>{msg.timestamp}</span>
                  {msg.sender === "carmen_ai" && (
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="hover:text-stone-600 cursor-pointer flex items-center gap-0.5"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check size={10} className="text-emerald-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={10} /> Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-2 bg-white rounded-lg border border-stone-200 w-fit text-stone-500 text-xs shadow-2xs">
                <Sparkles size={13} className="text-amber-600 animate-spin" />
                <span className="text-[11px]">Carmen AI is analyzing your syllabus…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2 border-t border-stone-200 bg-white">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
              <button
                type="button"
                onClick={() => handleSendMessage("What should our group study next?")}
                className="px-2 py-1 rounded-full bg-stone-100 hover:bg-red-50 hover:text-red-800 text-stone-600 whitespace-nowrap cursor-pointer transition-colors"
              >
                ✨ What to study next?
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("Quiz me on our group notes")}
                className="px-2 py-1 rounded-full bg-stone-100 hover:bg-red-50 hover:text-red-800 text-stone-600 whitespace-nowrap cursor-pointer transition-colors"
              >
                📝 Quiz me
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("Check our notes for mistakes")}
                className="px-2 py-1 rounded-full bg-stone-100 hover:bg-red-50 hover:text-red-800 text-stone-600 whitespace-nowrap cursor-pointer transition-colors"
              >
                🔍 Check for errors
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("Pull my upcoming Carmen Canvas deadlines")}
                className="px-2 py-1 rounded-full bg-stone-100 hover:bg-red-50 hover:text-red-800 text-stone-600 whitespace-nowrap cursor-pointer transition-colors"
              >
                📅 Canvas Deadlines
              </button>
            </div>

            {/* Input form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5 mt-1.5"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about Carmen courses or group notes…"
                className="flex-1 px-3 py-2 rounded-lg bg-stone-100/80 border border-stone-300 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-red-800 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="w-8 h-8 rounded-lg bg-[#a51c30] hover:bg-red-800 text-white flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
                aria-label="Send query"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
        </>
      )}
    </>
  );
}

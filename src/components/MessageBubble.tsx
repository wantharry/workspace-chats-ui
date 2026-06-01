import { useState } from "react";
import type { ChatMessage } from "../types";
import { User, Bot, Copy, Check, ChevronDown, ChevronRight, Wrench, Terminal } from "lucide-react";

interface Props {
  message: ChatMessage;
  searchQuery?: string;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  try {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((p, i) =>
      new RegExp(escaped, "i").test(p) ? <mark key={i} className="highlight">{p}</mark> : p
    );
  } catch { return text; }
}

function formatContent(text: string, query: string): React.ReactNode {
  if (!text) return null;
  const codeBlockRe = /```(\w*)\n?([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match;
  while ((match = codeBlockRe.exec(text)) !== null) {
    const before = text.slice(last, match.index);
    if (before) parts.push(<span key={`t${last}`}>{highlightText(before, query)}</span>);
    parts.push(
      <pre key={`code${match.index}`} style={{ background: "#0a0a12", border: "1px solid #1e293b", borderRadius: 8, padding: "12px 16px", overflowX: "auto", margin: "8px 0" }}>
        <code style={{ color: "#cbd5e1", fontSize: "0.875rem", fontFamily: '"JetBrains Mono","Fira Code",monospace' }}>{match[2]}</code>
      </pre>
    );
    last = match.index + match[0].length;
  }
  const rest = text.slice(last);
  if (rest) parts.push(<span key={`t${last}`}>{highlightText(rest, query)}</span>);
  return parts;
}

function ToolCallCard({ msg }: { msg: ChatMessage }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ margin: "4px 0", background: "#0a0a12", border: "1px solid #1e293b", borderRadius: 8, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", textAlign: "left" }}
      >
        <Terminal size={13} color="#6366f1" />
        <span style={{ fontSize: 12, fontFamily: "monospace", flex: 1 }}>{msg.name || "tool"}</span>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && (
        <div style={{ padding: "0 12px 10px", borderTop: "1px solid #1e293b" }}>
          {msg.arguments && (
            <div>
              <div style={{ fontSize: 10, color: "#475569", margin: "8px 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Arguments</div>
              <pre style={{ fontSize: 11, color: "#94a3b8", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {(() => { try { return JSON.stringify(JSON.parse(msg.arguments!), null, 2); } catch { return msg.arguments; } })()}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToolResultCard({ msg }: { msg: ChatMessage }) {
  const [open, setOpen] = useState(false);
  const success = msg.success !== false;
  const hasContent = !!msg.result;
  const TRUNCATE = 4000;
  const content = msg.result || "";

  if (!hasContent) {
    return (
      <div style={{ margin: "4px 0 4px 20px", display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: success ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)", border: `1px solid ${success ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: 6 }}>
        <Wrench size={11} color={success ? "#22c55e" : "#ef4444"} />
        <span style={{ fontSize: 11, color: success ? "#22c55e" : "#ef4444" }}>{success ? "Success" : "Failed"}</span>
      </div>
    );
  }

  return (
    <div style={{ margin: "4px 0 4px 20px", background: "#050510", border: "1px solid #0f172a", borderRadius: 8, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "none", border: "none", cursor: "pointer", color: "#475569", textAlign: "left" }}
      >
        <Wrench size={12} color={success ? "#22c55e" : "#ef4444"} />
        <span style={{ fontSize: 11, flex: 1, color: success ? "#22c55e" : "#ef4444" }}>
          {success ? "Output" : "Error"} <span style={{ color: "#334155", fontWeight: 400 }}>({content.length.toLocaleString()} chars)</span>
        </span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && (
        <div style={{ padding: "0 12px 10px", borderTop: "1px solid #0f172a" }}>
          <pre style={{ fontSize: 11, color: "#94a3b8", margin: "8px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 320, overflowY: "auto", lineHeight: 1.5 }}>
            {content.length > TRUNCATE ? content.slice(0, TRUNCATE) + `\n\n… (${(content.length - TRUNCATE).toLocaleString()} more chars)` : content}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message, searchQuery = "" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (message.type === "tool_start") return <ToolCallCard msg={message} />;
  if (message.type === "tool_complete") return <ToolResultCard msg={message} />;

  const isUser = message.type === "user";
  const time = new Date(message.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="message-enter"
      style={{ display: "flex", gap: 12, padding: "6px 0", flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-start" }}
    >
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: isUser ? "linear-gradient(135deg,#1d4ed8,#2563eb)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
      }}>
        {isUser ? <User size={16} color="white" /> : <Bot size={16} color="white" />}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", gap: 4, alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: isUser ? "#60a5fa" : "#818cf8" }}>{isUser ? "You" : "Copilot"}</span>
          <span style={{ fontSize: 10, color: "#475569" }}>{time}</span>
        </div>
        <div
          style={{
            background: isUser ? "rgba(29,78,216,0.25)" : "rgba(30,30,53,0.8)",
            border: `1px solid ${isUser ? "rgba(37,99,235,0.4)" : "#1e293b"}`,
            borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
            padding: "10px 14px",
            position: "relative",
          }}
        >
          <div style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.65, wordBreak: "break-word" }}>
            {formatContent(message.content || "", searchQuery)}
          </div>

          {/* Tool requests badges */}
          {!isUser && message.toolRequests && message.toolRequests.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
              {message.toolRequests.map(tr => (
                <span key={tr.toolCallId} className="tool-badge">
                  <Wrench size={10} /> {tr.name}
                </span>
              ))}
            </div>
          )}

          {/* Copy button */}
          {message.content && (
            <button
              onClick={handleCopy}
              style={{ position: "absolute", top: 6, right: 6, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 5, padding: "3px 5px", cursor: "pointer", color: copied ? "#22c55e" : "#475569", display: "flex", alignItems: "center", opacity: 0.7, transition: "opacity 0.15s" }}
              title="Copy"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

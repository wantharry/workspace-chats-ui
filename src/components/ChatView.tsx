import { useEffect, useRef } from "react";
import type { Session } from "../types";
import MessageBubble from "./MessageBubble";
import { Loader2, MessageSquare } from "lucide-react";

interface Props {
  session: Session | null;
  loading: boolean;
  searchQuery: string;
}

export default function ChatView({ session, loading, searchQuery }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.id]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a2e", flexDirection: "column", gap: 12 }}>
        <Loader2 size={28} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ color: "#475569", fontSize: 14 }}>Loading session…</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a2e", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MessageSquare size={28} color="#6366f1" />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#94a3b8", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No session selected</div>
          <div style={{ color: "#475569", fontSize: 13 }}>Choose a session from the sidebar or use Global Search to find chats</div>
        </div>
      </div>
    );
  }

  const filtered = searchQuery.trim()
    ? session.messages.filter(m =>
        (m.content || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.name || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : session.messages;

  return (
    <div style={{ flex: 1, background: "#1a1a2e", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Session info bar */}
      <div style={{ padding: "8px 20px", borderBottom: "1px solid #1e293b", background: "rgba(99,102,241,0.05)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: "#475569" }}>
          <span style={{ color: "#6366f1" }}>{session.workspaceName}</span>
          <span style={{ margin: "0 6px" }}>·</span>
          <span>{new Date(session.startTime).toLocaleString()}</span>
          <span style={{ margin: "0 6px" }}>·</span>
          <span>{session.messages.filter(m => m.type === "user" || m.type === "assistant").length} messages</span>
          {searchQuery && <span style={{ marginLeft: 8, color: "#fbbf24" }}>· {filtered.length} matches</span>}
        </div>
        <div style={{ marginLeft: "auto", fontSize: 11, color: "#2d2d4e", fontFamily: "monospace", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {session.folder.replace(/^file:\/\//, "")}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {filtered.length === 0 && searchQuery ? (
          <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 14 }}>
            No messages match &quot;{searchQuery}&quot;
          </div>
        ) : (
          filtered.map(msg => (
            <MessageBubble key={msg.id} message={msg} searchQuery={searchQuery} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

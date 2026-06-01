import type { WorkspaceSummary, SessionMeta } from "../types";
import { FolderOpen, ChevronDown, ChevronRight, MessageSquare, Search, Loader2 } from "lucide-react";

interface Props {
  workspaces: WorkspaceSummary[];
  loading: boolean;
  selectedSession: SessionMeta | null;
  collapsed: Set<string>;
  onSelectSession: (s: SessionMeta) => void;
  onToggleWorkspace: (id: string) => void;
  searchMode: boolean;
  onEnterSearch: () => void;
}

function timeAgo(ts: string): string {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function Sidebar({ workspaces, loading, selectedSession, collapsed, onSelectSession, onToggleWorkspace, searchMode, onEnterSearch }: Props) {
  const totalSessions = workspaces.reduce((a, w) => a + w.sessionCount, 0);

  return (
    <div style={{ width: 280, background: "#13131f", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #1e293b", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageSquare size={14} color="white" />
          </div>
          <div>
            <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>Chat Archive</div>
            <div style={{ color: "#475569", fontSize: 11 }}>{workspaces.length} workspaces · {totalSessions} sessions</div>
          </div>
        </div>
        <button
          onClick={onEnterSearch}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: searchMode ? "rgba(99,102,241,0.15)" : "#0d0d14", border: `1px solid ${searchMode ? "#6366f1" : "#1e293b"}`, borderRadius: 8, color: searchMode ? "#818cf8" : "#475569", cursor: "pointer", fontSize: 13, transition: "all 0.15s" }}
        >
          <Search size={14} />
          <span>Search all chats…</span>
          <span style={{ marginLeft: "auto", fontSize: 11, background: "#1e293b", padding: "1px 6px", borderRadius: 4 }}>⌘K</span>
        </button>
      </div>

      {/* Workspace list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 16px", color: "#475569" }}>
            <Loader2 size={16} className="animate-spin" />
            <span style={{ fontSize: 13 }}>Loading chats…</span>
          </div>
        )}
        {!loading && workspaces.length === 0 && (
          <div style={{ padding: "20px 16px", color: "#475569", fontSize: 13 }}>No chat sessions found.</div>
        )}
        {workspaces.map(ws => {
          const isCollapsed = collapsed.has(ws.id);
          return (
            <div key={ws.id}>
              {/* Workspace header */}
              <button
                onClick={() => onToggleWorkspace(ws.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", textAlign: "left" }}
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                <FolderOpen size={14} color="#6366f1" />
                <span style={{ fontWeight: 600, fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: 0.3, textTransform: "uppercase" }}>{ws.name}</span>
                <span style={{ fontSize: 11, color: "#475569", background: "#1a1a2e", padding: "1px 6px", borderRadius: 10, flexShrink: 0 }}>{ws.sessionCount}</span>
              </button>

              {/* Sessions */}
              {!isCollapsed && ws.sessions.map(sess => {
                const isSelected = selectedSession?.id === sess.id;
                return (
                  <button
                    key={sess.id}
                    onClick={() => onSelectSession(sess)}
                    style={{
                      width: "100%", display: "block", textAlign: "left", padding: "8px 12px 8px 28px",
                      background: isSelected ? "rgba(99,102,241,0.15)" : "transparent",
                      border: "none", borderLeft: isSelected ? "2px solid #6366f1" : "2px solid transparent",
                      cursor: "pointer", transition: "all 0.12s",
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <MessageSquare size={11} color={isSelected ? "#818cf8" : "#475569"} />
                      <span style={{ fontSize: 12, fontWeight: isSelected ? 600 : 400, color: isSelected ? "#e2e8f0" : "#94a3b8", flex: 1 }}>
                        {new Date(sess.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span style={{ fontSize: 10, color: "#475569" }}>{timeAgo(sess.startTime)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingLeft: 17 }}>
                      {sess.preview}
                    </div>
                    <div style={{ fontSize: 10, color: "#2d2d4e", paddingLeft: 17, marginTop: 1 }}>
                      {sess.messageCount} messages
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

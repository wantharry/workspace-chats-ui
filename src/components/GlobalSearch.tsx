import type { SearchResult, WorkspaceSummary, SessionMeta } from "../types";
import { Loader2, Search, MessageSquare, User, Bot, ChevronRight, FolderOpen } from "lucide-react";

interface Props {
  results: SearchResult[];
  searching: boolean;
  error: string;
  query: string;
  isRegex: boolean;
  onOpenSession: (sm: SessionMeta) => void;
  workspaces: WorkspaceSummary[];
}

function getSnippet(content: string, matches: { start: number; end: number }[], query: string, isRegex: boolean): React.ReactNode {
  if (!matches.length || !content) return content.slice(0, 180);
  const match = matches[0];
  const pad = 80;
  const start = Math.max(0, match.start - pad);
  const end = Math.min(content.length, match.end + pad);
  const snippet = content.slice(start, end);
  const snippetMatchStart = match.start - start;
  const snippetMatchEnd = match.end - start;

  return (
    <>
      {start > 0 && <span style={{ color: "#2d2d4e" }}>…</span>}
      {snippet.slice(0, snippetMatchStart)}
      <mark className="highlight">{snippet.slice(snippetMatchStart, snippetMatchEnd)}</mark>
      {snippet.slice(snippetMatchEnd)}
      {end < content.length && <span style={{ color: "#2d2d4e" }}>…</span>}
    </>
  );
}

function groupBySession(results: SearchResult[]) {
  const map = new Map<string, SearchResult[]>();
  for (const r of results) {
    const key = `${r.workspaceId}::${r.sessionId}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return map;
}

export default function GlobalSearch({ results, searching, error, query, isRegex, onOpenSession, workspaces }: Props) {
  const grouped = groupBySession(results);
  const sessionGroups = Array.from(grouped.entries());

  return (
    <div style={{ flex: 1, background: "#1a1a2e", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Stats bar */}
      <div style={{ padding: "8px 20px", borderBottom: "1px solid #1e293b", background: "rgba(99,102,241,0.05)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, fontSize: 12, color: "#475569" }}>
        {searching ? (
          <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} color="#6366f1" /> Searching…</>
        ) : query ? (
          <>
            <Search size={13} color="#6366f1" />
            <span><span style={{ color: "#e2e8f0" }}>{results.length}</span> matches in <span style={{ color: "#e2e8f0" }}>{sessionGroups.length}</span> sessions</span>
            {isRegex && <span style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 4, padding: "1px 6px", color: "#818cf8", fontSize: 10 }}>regex</span>}
          </>
        ) : (
          <span>Enter a query above to search across all chat sessions</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ margin: 16, padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#fca5a5", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!searching && query && results.length === 0 && !error && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
          <Search size={36} color="#2d2d4e" />
          <div style={{ color: "#475569", fontSize: 14 }}>No matches found for &quot;{query}&quot;</div>
        </div>
      )}

      {/* No query */}
      {!query && !searching && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Search size={28} color="#6366f1" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#94a3b8", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Global Search</div>
            <div style={{ color: "#475569", fontSize: 13 }}>Search across all {workspaces.reduce((a, w) => a + w.sessionCount, 0)} chat sessions</div>
            <div style={{ color: "#2d2d4e", fontSize: 12, marginTop: 6 }}>Supports regex • Case-insensitive</div>
          </div>
        </div>
      )}

      {/* Results */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
        {sessionGroups.map(([key, sessionResults]) => {
          const first = sessionResults[0];
          const ws = workspaces.find(w => w.id === first.workspaceId);
          const sess = ws?.sessions.find(s => s.id === first.sessionId);
          return (
            <div key={key} style={{ marginBottom: 16 }}>
              {/* Session header */}
              <button
                onClick={() => sess && onOpenSession(sess)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px 8px 0 0", cursor: "pointer", textAlign: "left" }}
              >
                <FolderOpen size={13} color="#6366f1" />
                <span style={{ fontWeight: 600, fontSize: 13, color: "#818cf8" }}>{first.workspaceName}</span>
                <span style={{ color: "#475569", fontSize: 12 }}>·</span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{new Date(first.startTime).toLocaleString()}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#475569", background: "#1e293b", padding: "1px 8px", borderRadius: 10 }}>{sessionResults.length} match{sessionResults.length > 1 ? "es" : ""}</span>
                <ChevronRight size={14} color="#475569" />
              </button>

              {/* Match items */}
              <div style={{ border: "1px solid #1e293b", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
                {sessionResults.slice(0, 5).map((r, i) => (
                  <button
                    key={r.messageId}
                    onClick={() => sess && onOpenSession(sess)}
                    style={{ width: "100%", display: "flex", gap: 10, padding: "10px 12px", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)", border: "none", cursor: "pointer", textAlign: "left", borderTop: i > 0 ? "1px solid #0f172a" : "none" }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.06)"}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)"}
                  >
                    <div style={{ flexShrink: 0, marginTop: 2 }}>
                      {r.messageType === "user" ? <User size={13} color="#3b82f6" /> : <Bot size={13} color="#818cf8" />}
                    </div>
                    <div style={{ flex: 1, fontSize: 12, color: "#94a3b8", lineHeight: 1.6, overflow: "hidden" }}>
                      {getSnippet(r.content, r.matches, query, isRegex)}
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: "#2d2d4e", background: "#0a0a12", padding: "1px 6px", borderRadius: 4 }}>
                        {r.matches.length} hit{r.matches.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </button>
                ))}
                {sessionResults.length > 5 && (
                  <div style={{ padding: "6px 12px", fontSize: 11, color: "#475569", background: "rgba(99,102,241,0.04)", borderTop: "1px solid #0f172a" }}>
                    +{sessionResults.length - 5} more matches — open session to view all
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

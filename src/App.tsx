import { useState, useEffect, useCallback } from "react";
import type { WorkspaceSummary, SessionMeta, Session, SearchResult } from "./types";
import Sidebar from "./components/Sidebar";
import ChatView from "./components/ChatView";
import GlobalSearch from "./components/GlobalSearch";
import { Search, MessageSquare, X, Regex } from "lucide-react";

const API = "";

export default function App() {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionMeta | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [globalRegex, setGlobalRegex] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [inChatQuery, setInChatQuery] = useState("");
  const [collapsedWorkspaces, setCollapsedWorkspaces] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${API}/api/workspaces`)
      .then(r => r.json())
      .then(data => { setWorkspaces(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedSession) { setSession(null); return; }
    setSessionLoading(true);
    fetch(`${API}/api/sessions/${selectedSession.id}?workspaceId=${selectedSession.workspaceId}`)
      .then(r => r.json())
      .then(data => { setSession(data); setSessionLoading(false); })
      .catch(() => setSessionLoading(false));
  }, [selectedSession]);

  const handleSearch = useCallback(async () => {
    if (!globalQuery.trim()) { setSearchResults([]); return; }
    setSearching(true);
    setSearchError("");
    try {
      const r = await fetch(`${API}/api/search?q=${encodeURIComponent(globalQuery)}&regex=${globalRegex}`);
      if (!r.ok) { const e = await r.json(); setSearchError(e.error || "Search failed"); }
      else setSearchResults(await r.json());
    } catch { setSearchError("Connection error"); }
    setSearching(false);
  }, [globalQuery, globalRegex]);

  useEffect(() => {
    if (!searchMode) return;
    const t = setTimeout(handleSearch, 350);
    return () => clearTimeout(t);
  }, [globalQuery, globalRegex, searchMode, handleSearch]);

  const openSession = (sm: SessionMeta) => {
    setSelectedSession(sm);
    setSearchMode(false);
    setInChatQuery("");
  };

  const toggleWorkspace = (id: string) => {
    setCollapsedWorkspaces(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0d0d14", overflow: "hidden" }}>
      {/* Sidebar */}
      <Sidebar
        workspaces={workspaces}
        loading={loading}
        selectedSession={selectedSession}
        collapsed={collapsedWorkspaces}
        onSelectSession={openSession}
        onToggleWorkspace={toggleWorkspace}
        searchMode={searchMode}
        onEnterSearch={() => { setSearchMode(true); setSelectedSession(null); }}
      />

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ borderBottom: "1px solid #1e293b", background: "#13131f", padding: "0 20px", display: "flex", alignItems: "center", gap: 12, height: 56, flexShrink: 0 }}>
          {searchMode ? (
            <>
              <Search size={18} color="#6366f1" />
              <input
                autoFocus
                placeholder="Search all chats… (Enter to search)"
                value={globalQuery}
                onChange={e => setGlobalQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontSize: 15 }}
              />
              <button
                onClick={() => setGlobalRegex(r => !r)}
                title="Toggle regex"
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: `1px solid ${globalRegex ? "#6366f1" : "#1e293b"}`, background: globalRegex ? "rgba(99,102,241,0.18)" : "transparent", color: globalRegex ? "#818cf8" : "#475569", cursor: "pointer", fontSize: 12, fontWeight: 500 }}
              >
                <Regex size={14} /> Regex
              </button>
              <button onClick={() => { setSearchMode(false); setGlobalQuery(""); setSearchResults([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex" }}>
                <X size={18} />
              </button>
            </>
          ) : (
            <>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                {session && (
                  <>
                    <MessageSquare size={16} color="#6366f1" />
                    <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 14 }}>{session.workspaceName}</span>
                    <span style={{ color: "#475569", fontSize: 13 }}>·</span>
                    <span style={{ color: "#94a3b8", fontSize: 13 }}>{new Date(session.startTime).toLocaleString()}</span>
                  </>
                )}
                {!session && <span style={{ color: "#475569", fontSize: 14 }}>Select a chat session</span>}
              </div>
              {session && (
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Search size={14} color="#475569" style={{ position: "absolute", left: 8 }} />
                  <input
                    placeholder="Search in chat…"
                    value={inChatQuery}
                    onChange={e => setInChatQuery(e.target.value)}
                    style={{ paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6, background: "#0d0d14", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0", fontSize: 13, outline: "none", width: 200 }}
                  />
                </div>
              )}
              <button
                onClick={() => { setSearchMode(true); setSelectedSession(null); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid #1e293b", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}
              >
                <Search size={14} /> Global Search
              </button>
            </>
          )}
        </div>

        {/* Content */}
        {searchMode ? (
          <GlobalSearch results={searchResults} searching={searching} error={searchError} query={globalQuery} isRegex={globalRegex} onOpenSession={openSession} workspaces={workspaces} />
        ) : (
          <ChatView session={session} loading={sessionLoading} searchQuery={inChatQuery} />
        )}
      </div>
    </div>
  );
}

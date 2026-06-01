import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

function getStoragePath(): string {
  const candidates = [
    "/mnt/c/Users/openclaw/AppData/Roaming/Code/User/workspaceStorage",
    process.env.HOME + "/.config/Code/User/workspaceStorage",
    process.env.HOME + "/Library/Application Support/Code/User/workspaceStorage",
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  throw new Error("Cannot find VS Code workspace storage");
}

function getWorkspaceName(folder: string): string {
  const clean = folder.replace(/^file:\/\//, "").replace(/\/+$/, "");
  return clean.split("/").pop() || folder;
}

interface WsMeta { id: string; folder: string; name: string; sessionIds: string[]; }

function loadWorkspaces(): WsMeta[] {
  const sp = getStoragePath();
  const result: WsMeta[] = [];
  for (const d of fs.readdirSync(sp, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const tDir = path.join(sp, d.name, "GitHub.copilot-chat", "transcripts");
    if (!fs.existsSync(tDir)) continue;
    let folder = d.name;
    const wsJson = path.join(sp, d.name, "workspace.json");
    if (fs.existsSync(wsJson)) {
      try { folder = JSON.parse(fs.readFileSync(wsJson, "utf-8")).folder || folder; } catch {}
    }
    const sessions = fs.readdirSync(tDir).filter(f => f.endsWith(".jsonl")).map(f => f.slice(0, -6));
    result.push({ id: d.name, folder, name: getWorkspaceName(folder), sessionIds: sessions });
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

type Entry = { type: string; data: Record<string, unknown>; id: string; timestamp: string; parentId: string | null };

function parseSession(workspaceId: string, sessionId: string): Entry[] {
  const sp = getStoragePath();
  const fp = path.join(sp, workspaceId, "GitHub.copilot-chat", "transcripts", `${sessionId}.jsonl`);
  if (!fs.existsSync(fp)) return [];
  return fs.readFileSync(fp, "utf-8").split("\n").filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) as Entry[];
}

function sessionMeta(ws: WsMeta, sid: string) {
  const entries = parseSession(ws.id, sid);
  const start = entries.find(e => e.type === "session.start");
  const msgs = entries.filter(e => e.type === "user.message" || e.type === "assistant.message");
  const firstUser = entries.find(e => e.type === "user.message");
  const preview = ((firstUser?.data as {content?: string})?.content || "(empty)").slice(0, 140).replace(/\r?\n/g, " ");
  return { id: sid, workspaceId: ws.id, workspaceName: ws.name, startTime: start?.timestamp || entries[0]?.timestamp || "", messageCount: msgs.length, preview };
}

app.get("/api/workspaces", (_req, res) => {
  try {
    const wss = loadWorkspaces();
    res.json(wss.map(ws => ({
      id: ws.id, name: ws.name, folder: ws.folder, sessionCount: ws.sessionIds.length,
      sessions: ws.sessionIds.map(sid => sessionMeta(ws, sid)).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    })));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.get("/api/sessions/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });
    const entries = parseSession(workspaceId, sessionId);
    const start = entries.find(e => e.type === "session.start");
    const wss = loadWorkspaces();
    const ws = wss.find(w => w.id === workspaceId);
    const messages = entries
      .filter(e => ["user.message","assistant.message","tool.execution_start","tool.execution_complete"].includes(e.type))
      .map(e => {
        if (e.type === "user.message") {
          const d = e.data as { content?: string; attachments?: unknown[] };
          return { id: e.id, type: "user", content: d.content || "", timestamp: e.timestamp, attachments: d.attachments || [] };
        }
        if (e.type === "assistant.message") {
          const d = e.data as { content?: string; reasoningText?: string; toolRequests?: unknown[] };
          return { id: e.id, type: "assistant", content: d.content || "", timestamp: e.timestamp, reasoningText: d.reasoningText || "", toolRequests: d.toolRequests || [] };
        }
        if (e.type === "tool.execution_start") {
          const d = e.data as { toolCallId?: string; name?: string; arguments?: string };
          return { id: e.id, type: "tool_start", toolCallId: d.toolCallId, name: d.name, arguments: d.arguments, timestamp: e.timestamp };
        }
        const d = e.data as { toolCallId?: string; result?: unknown };
        return { id: e.id, type: "tool_complete", toolCallId: d.toolCallId, result: d.result, timestamp: e.timestamp };
      });
    res.json({ id: sessionId, workspaceId, workspaceName: ws?.name || workspaceId, folder: ws?.folder || "", startTime: start?.timestamp || "", messages });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.get("/api/search", (req, res) => {
  try {
    const q = req.query.q as string;
    const isRegex = req.query.regex === "true";
    const filterWs = req.query.workspaceId as string | undefined;
    if (!q?.trim()) return res.json([]);
    let pat: RegExp;
    try {
      pat = isRegex ? new RegExp(q, "gi") : new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    } catch { return res.status(400).json({ error: "Invalid regex pattern" }); }
    const results: unknown[] = [];
    for (const ws of loadWorkspaces()) {
      if (filterWs && ws.id !== filterWs) continue;
      for (const sid of ws.sessionIds) {
        const entries = parseSession(ws.id, sid);
        const startTime = entries.find(e => e.type === "session.start")?.timestamp || "";
        for (const e of entries.filter(e => e.type === "user.message" || e.type === "assistant.message")) {
          const content = (e.data as { content?: string }).content || "";
          const matches: { start: number; end: number }[] = [];
          let m: RegExpExecArray | null;
          pat.lastIndex = 0;
          while ((m = pat.exec(content)) !== null && matches.length < 10) {
            matches.push({ start: m.index, end: m.index + m[0].length });
          }
          if (matches.length) results.push({ sessionId: sid, workspaceId: ws.id, workspaceName: ws.name, folder: ws.folder, startTime, messageId: e.id, messageType: e.type === "user.message" ? "user" : "assistant", content, matches });
        }
      }
    }
    res.json(results);
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.listen(3001, () => console.log("\x1b[32m✓ API server http://localhost:3001\x1b[0m"));

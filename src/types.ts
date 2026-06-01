export interface WorkspaceSummary {
  id: string;
  name: string;
  folder: string;
  sessionCount: number;
  sessions: SessionMeta[];
}

export interface SessionMeta {
  id: string;
  workspaceId: string;
  workspaceName: string;
  startTime: string;
  messageCount: number;
  preview: string;
}

export interface ToolRequest {
  toolCallId: string;
  name: string;
  arguments: string;
  type: string;
}

export interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "tool_start" | "tool_complete";
  content?: string;
  timestamp: string;
  attachments?: unknown[];
  reasoningText?: string;
  toolRequests?: ToolRequest[];
  toolCallId?: string;
  name?: string;
  arguments?: string;
  result?: unknown;
}

export interface Session {
  id: string;
  workspaceId: string;
  workspaceName: string;
  folder: string;
  startTime: string;
  messages: ChatMessage[];
}

export interface MatchRange {
  start: number;
  end: number;
}

export interface SearchResult {
  sessionId: string;
  workspaceId: string;
  workspaceName: string;
  folder: string;
  startTime: string;
  messageId: string;
  messageType: "user" | "assistant";
  content: string;
  matches: MatchRange[];
}

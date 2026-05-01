export interface MobileApproval {
  id: string;
  title: string;
  description: string;
  recommendation: string;
  tags: string[];
}

export interface MobileJob {
  id: string;
  name: string;
  status: 'waiting' | 'running' | 'failed';
  statusText: string;
  recommendation: string;
  errorText: string | null;
  conversationId: string | null;
}

export interface MobileConversation {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
}

export interface MobileProject {
  id: string;
  title: string;
}

export interface MobileBundle {
  id: string;
  name: string;
  summary: string | null;
  pinned: boolean;
}

export interface MobileMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export type ActiveTab = 'command' | 'jobs' | 'context';

export type ActiveSheet =
  | null
  | { kind: 'chat'; conversationId: string; title: string }
  | {
      kind: 'failed-job';
      runId: string;
      conversationId: string | null;
      name: string;
      errorText: string;
      recommendation: string;
    }
  | { kind: 'project-switcher' };

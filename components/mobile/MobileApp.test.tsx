/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BottomSheet } from './BottomSheet';
import { CommandInput } from './CommandInput';
import { MobileApp } from './MobileApp';
import { ChatSheet } from './sheets/ChatSheet';

const now = '2026-05-01T12:00:00.000Z';

const projects = [
  { id: 'proj-1', title: 'Project One' },
  { id: 'proj-2', title: 'Project Two' },
];

const conversations = [
  {
    id: 'conv-2',
    title: 'Project Two conversation',
    summary: 'Keep going',
    projectId: 'proj-2',
    status: 'active',
    updatedAt: now,
  },
];

function mockJsonResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  } as Response;
}

function projectDetail(id: string, title: string) {
  return {
    project: {
      id,
      title,
      summary: `${title} summary`,
      activeGoal: `${title} goal`,
      currentFocus: `${title} focus`,
      linkedRepos: [],
    },
    workspace: null,
    git: null,
    playbook: null,
    workItems: [],
    reviewItems: [],
    learningSuggestions: [],
    summary: {
      projectId: id,
      title,
      activeGoal: `${title} goal`,
      currentFocus: `${title} focus`,
      workCount: 0,
      reviewCount: 0,
      openAttentionCount: 0,
      workspaceStatus: 'unbound',
      workspaceMode: null,
      workspacePath: null,
      suggestedPrompt: `Ask about ${title}.`,
    },
  };
}

function detailedProjectDetail() {
  return {
    ...projectDetail('proj-2', 'Project Two'),
    workspace: {
      id: 'workspace-2',
      projectId: 'proj-2',
      mode: 'existing',
      workspacePath: '/Users/jdfetterly/Products/project-two',
      repoName: 'project-two',
      repoUrl: null,
      defaultBranch: 'main',
      status: 'ready',
      createdAt: now,
      updatedAt: now,
    },
    git: {
      isGitRepo: true,
      currentBranch: 'codex/mobile-context',
      lastCommitShort: 'abc1234',
      lastCommitMessage: 'Tighten mobile context',
      lastCommitAt: now,
      remoteUrl: 'https://github.com/jdfetterly/project-two.git',
      modifiedCount: 3,
      untrackedCount: 2,
    },
    playbook: {
      projectId: 'proj-2',
      goals: ['Keep project context tight'],
      preferredAgents: [],
      workingStyle: null,
      reviewPreferences: null,
      schedulePatterns: null,
      repoContext: null,
      recentDecisions: [],
      updatedAt: now,
    },
    workItems: [
      {
        workItemId: 'work-1',
        title: 'Duplicate work row',
        scope: 'project',
        priority: 'normal',
        projectId: 'proj-2',
        delegatedAgentId: null,
        reviewState: 'not_ready',
        baseStatus: 'todo',
        displayStatus: 'todo',
        sourceConversationId: null,
        latestRunId: null,
        latestRunStatus: null,
        latestEventType: null,
        latestEventAt: null,
        badges: [],
        createdAt: now,
        updatedAt: now,
      },
    ],
    reviewItems: [
      {
        id: 'review-1',
        projectId: 'proj-2',
        workItemId: 'work-1',
        summary: 'Duplicate review row',
        reviewReason: 'completed_work',
        status: 'open',
        createdAt: now,
        updatedAt: now,
        reviewedAt: null,
      },
    ],
    learningSuggestions: [
      {
        id: 'learning-1',
        projectId: 'proj-2',
        suggestionType: 'preference',
        title: 'Duplicate learning row',
        detail: 'Avoid duplicate rows',
        payload: null,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    ],
    summary: {
      projectId: 'proj-2',
      title: 'Project Two',
      activeGoal: 'Project Two goal',
      currentFocus: 'Project Two focus',
      workCount: 1,
      reviewCount: 1,
      openAttentionCount: 0,
      workspaceStatus: 'ready',
      workspaceMode: 'existing',
      workspacePath: '/Users/jdfetterly/Products/project-two',
      suggestedPrompt: 'Ask about Project Two.',
    },
  };
}

function installLocalStorageMock() {
  const store = new Map<string, string>();
  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: localStorageMock,
  });

  return localStorageMock;
}

function buildFetchMock() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.endsWith('/api/product-state/projects') && init?.method === 'POST') {
      return mockJsonResponse(
        {
          project: {
            id: 'proj-3',
            title: JSON.parse(String(init.body ?? '{}')).title,
            summary: null,
            activeGoal: null,
            currentFocus: null,
          },
        },
        true,
      );
    }

    if (url.endsWith('/api/product-state/projects')) {
      return mockJsonResponse({ projects });
    }

    if (url.endsWith('/api/product-state/projects/proj-1')) {
      return mockJsonResponse(projectDetail('proj-1', 'Project One'));
    }

    if (url.endsWith('/api/product-state/projects/proj-2')) {
      return mockJsonResponse(detailedProjectDetail());
    }

    if (url.endsWith('/api/product-state/projects/proj-3')) {
      return mockJsonResponse(projectDetail('proj-3', 'Mobile Reliability'));
    }

    if (url.endsWith('/api/product-state/approvals')) {
      return mockJsonResponse({ approvals: [] });
    }

    if (url.endsWith('/api/product-state/run-summaries')) {
      return mockJsonResponse({ runSummaries: [] });
    }

    if (url.endsWith('/api/product-state/conversations')) {
      return mockJsonResponse({ conversations });
    }

    if (url.endsWith('/api/product-state/work-items')) {
      return mockJsonResponse({ workItems: [] });
    }

    if (url.endsWith('/api/product-state/memory/entries') && init?.method === 'POST') {
      return mockJsonResponse({
        memoryEntry: {
          id: 'mem-created',
          title: JSON.parse(String(init.body ?? '{}')).title,
          summary: JSON.parse(String(init.body ?? '{}')).summary,
          status: 'active',
        },
      });
    }

    if (url.endsWith('/api/product-state/memory/entries')) {
      return mockJsonResponse({
        memoryEntries: [
          { id: 'mem-1', title: 'Existing bundle', summary: 'Already there', status: 'active' },
          { id: 'mem-global', title: 'Global memory', summary: 'Should not render here', status: 'active' },
        ],
        memorySources: [
          { memoryEntryId: 'mem-1', sourceRef: 'proj-2' },
          { memoryEntryId: 'mem-global', sourceRef: 'other-project' },
        ],
      });
    }

    throw new Error(`Unexpected fetch: ${url}`);
  });
}

describe('mobile click contract', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('disables empty command sends and enables them after text is entered', () => {
    render(<CommandInput onSend={vi.fn()} placeholder="Send a command…" />);

    const input = screen.getByPlaceholderText('Send a command…');
    const sendButton = screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement;

    expect(sendButton.disabled).toBe(true);

    fireEvent.change(input, { target: { value: 'Ship the click contract' } });

    expect(sendButton.disabled).toBe(false);
  });

  it('creates and selects a new project from the switcher sheet', async () => {
    const localStorageMock = installLocalStorageMock();
    localStorageMock.setItem('meeseeks-mobile.project-selection', JSON.stringify({ id: 'proj-2', title: 'Project Two' }));
    const fetchMock = buildFetchMock();
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    render(<MobileApp />);

    await screen.findByPlaceholderText(/ask about project two/i);

    fireEvent.click(screen.getByRole('button', { name: /switch project/i }));
    fireEvent.click(await screen.findByRole('button', { name: /\+ new project/i }));
    fireEvent.change(screen.getByPlaceholderText('Project title'), {
      target: { value: 'Mobile Reliability' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'create' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/product-state/projects',
        expect.objectContaining({ method: 'POST' }),
      ),
    );

    expect(JSON.parse(localStorageMock.getItem('meeseeks-mobile.project-selection') ?? '{}')).toMatchObject({
      id: 'proj-3',
      title: 'Mobile Reliability',
    });
    expect(await screen.findByPlaceholderText(/ask about mobile reliability/i)).toBeTruthy();
  });

  it('creates a context bundle through the memory entries API', async () => {
    const localStorageMock = installLocalStorageMock();
    localStorageMock.setItem('meeseeks-mobile.project-selection', JSON.stringify({ id: 'proj-2', title: 'Project Two' }));
    const fetchMock = buildFetchMock();
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    render(<MobileApp />);

    await screen.findByPlaceholderText(/ask about project two/i);
    fireEvent.click(screen.getByRole('button', { name: /context/i }));
    fireEvent.click(await screen.findByRole('button', { name: /\+ add bundle/i }));
    fireEvent.change(screen.getByPlaceholderText('Bundle title'), {
      target: { value: 'Release checklist' },
    });
    fireEvent.change(screen.getByPlaceholderText('Optional summary'), {
      target: { value: 'Verify mobile clicks before release.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'add bundle' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/product-state/memory/entries',
        expect.objectContaining({ method: 'POST' }),
      ),
    );

    const memoryCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url) === '/api/product-state/memory/entries' && init?.method === 'POST',
    );
    const body = JSON.parse(String(memoryCall?.[1]?.body ?? '{}')) as Record<string, unknown>;

    expect(body).toMatchObject({
      scope: 'ops',
      contentType: 'markdown',
      title: 'Release checklist',
      sourceKind: 'mobile_context_bundle',
      sourceRef: 'proj-2',
    });
    expect(String(body.relativePath)).toMatch(/^mobile-bundles\/release-checklist-/);
    expect(await screen.findByText('Added Release checklist.')).toBeTruthy();
  });

  it('keeps context bundles distinct from work, review, and workspace screens', async () => {
    const localStorageMock = installLocalStorageMock();
    localStorageMock.setItem('meeseeks-mobile.project-selection', JSON.stringify({ id: 'proj-2', title: 'Project Two' }));
    vi.stubGlobal('fetch', buildFetchMock() as unknown as typeof fetch);

    render(<MobileApp />);

    await screen.findByPlaceholderText(/ask about project two/i);
    fireEvent.click(screen.getByRole('button', { name: /context/i }));

    await waitFor(() => expect(screen.getAllByText('Project Brief').length).toBeGreaterThanOrEqual(2));
    expect(screen.getByText('Repo & Scope')).toBeTruthy();
    fireEvent.click(screen.getByText('Repo & Scope'));
    expect(await screen.findByText(/Git: managed · ready/i)).toBeTruthy();
    expect(screen.getByText(/GitHub: github\.com\/jdfetterly\/project-two/i)).toBeTruthy();
    expect(screen.getByText(/Branch: codex\/mobile-context/i)).toBeTruthy();
    expect(screen.getByText(/Last commit: abc1234 · Tighten mobile context/i)).toBeTruthy();
    expect(screen.getByText(/Working tree: 3 changed · 2 untracked/i)).toBeTruthy();
    expect(screen.getByText(/Mobile view: shows top scope roots only, not full file\/folder lists\./i)).toBeTruthy();
    expect(screen.getByText('Playbook')).toBeTruthy();
    expect(screen.getAllByText('Existing bundle').length).toBeGreaterThanOrEqual(2);

    expect(screen.queryByText(/^Workspace$/)).toBeNull();
    expect(screen.queryByText(/Work items/i)).toBeNull();
    expect(screen.queryByText(/Review queue/i)).toBeNull();
    expect(screen.queryByText(/Learning/i)).toBeNull();
    expect(screen.queryByText('Global memory')).toBeNull();
  });

  it('renders camelCase and snake_case chat message payloads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        mockJsonResponse({
          messages: [
            {
              id: 'msg-camel',
              role: 'user',
              contentText: 'Camel case message',
              createdAt: now,
            },
            {
              id: 'msg-snake',
              role: 'assistant',
              content_text: 'Snake case message',
              created_at: now,
            },
          ],
        }),
      ) as unknown as typeof fetch,
    );

    render(<ChatSheet open onClose={vi.fn()} conversationId="conv-1" title="Chat" />);

    expect(await screen.findByText('Camel case message')).toBeTruthy();
    expect(await screen.findByText('Snake case message')).toBeTruthy();
    expect(screen.queryByText('…')).toBeNull();
  });

  it('hides closed bottom-sheet controls from accessible queries', () => {
    render(
      <BottomSheet open={false} onClose={vi.fn()}>
        <button type="button">Hidden action</button>
      </BottomSheet>,
    );

    expect(screen.queryByRole('button', { name: 'Hidden action' })).toBeNull();
    expect(screen.getByRole('dialog', { hidden: true }).getAttribute('aria-hidden')).toBe('true');
  });
});

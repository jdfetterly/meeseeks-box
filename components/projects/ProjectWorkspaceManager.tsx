'use client';

import { useState, type CSSProperties } from 'react';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import { Button } from '@/components/ui/button';
import type { ProjectWorkspaceRecord } from '@/lib/product-state/entities';

type WorkspaceAction = 'bind_existing' | 'bootstrap';

export function ProjectWorkspaceManager({
  projectId,
  projectTitle,
  linkedRepos,
  workspace,
  suggestedPath,
}: {
  projectId: string;
  projectTitle: string;
  linkedRepos: string[];
  workspace: ProjectWorkspaceRecord | null;
  suggestedPath: string;
}) {
  const [action, setAction] = useState<WorkspaceAction>('bootstrap');
  const [workspacePath, setWorkspacePath] = useState(workspace?.workspacePath ?? suggestedPath);
  const [repoName, setRepoName] = useState(workspace?.repoName ?? linkedRepos[0] ?? '');
  const [repoUrl, setRepoUrl] = useState(workspace?.repoUrl ?? '');
  const [defaultBranch, setDefaultBranch] = useState(workspace?.defaultBranch ?? 'main');
  const [statusText, setStatusText] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const workspaceReady = workspace?.status === 'ready';

  return (
    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <div
        style={{
          border: '1px solid var(--separator)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-3)',
          background: 'var(--material-thin)',
          display: 'grid',
          gap: 'var(--space-2)',
        }}
      >
        <strong>{workspaceReady ? 'Workspace ready' : 'Planning only'}</strong>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          {workspaceReady
            ? `Execution is grounded in ${workspace?.workspacePath}.`
            : 'This project has not been bound to a real execution workspace yet.'}
        </p>
        {workspace ? (
          <div style={{ display: 'grid', gap: '4px', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
            <span>Mode: {workspace.mode}</span>
            <span>Path: {workspace.workspacePath}</span>
            {workspace.repoName ? <span>Repo: {workspace.repoName}</span> : null}
            {workspace.defaultBranch ? <span>Branch: {workspace.defaultBranch}</span> : null}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <OpenChatPanelButton
          label="Bind in copilot"
          intent="project_planning"
          context={{
            entityType: 'project',
            entityId: projectId,
            projectId,
            page: 'project',
            suggestedPrompt: 'Bind an existing repo workspace to this project.',
            draftPrompt: `Bind an existing workspace to ${projectTitle}.

Workspace path: ${workspace?.workspacePath ?? suggestedPath}
Repo name: ${workspace?.repoName ?? linkedRepos[0] ?? ''}
Default branch: ${workspace?.defaultBranch ?? 'main'}

Ask only for missing details, then propose the workspace binding.`,
            starterRepoList: linkedRepos,
            workspaceAction: 'bind_existing',
            starterWorkspacePath: workspace?.workspacePath ?? suggestedPath,
          }}
          variant="outline"
        />
        <OpenChatPanelButton
          label="Bootstrap in copilot"
          intent="project_planning"
          context={{
            entityType: 'project',
            entityId: projectId,
            projectId,
            page: 'project',
            suggestedPrompt: 'Bootstrap a new build workspace for this project.',
            draftPrompt: `Bootstrap a build workspace for ${projectTitle}.

Workspace path: ${workspace?.workspacePath ?? suggestedPath}
Repo name: ${workspace?.repoName ?? linkedRepos[0] ?? projectTitle}
Default branch: ${workspace?.defaultBranch ?? 'main'}

Ask only for missing details, then propose the workspace bootstrap.`,
            starterRepoList: linkedRepos,
            workspaceAction: 'bootstrap',
            starterWorkspacePath: workspace?.workspacePath ?? suggestedPath,
          }}
          variant="outline"
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <Button
          type="button"
          variant={action === 'bootstrap' ? 'secondary' : 'ghost'}
          onClick={() => setAction('bootstrap')}
        >
          Bootstrap build workspace
        </Button>
        <Button
          type="button"
          variant={action === 'bind_existing' ? 'secondary' : 'ghost'}
          onClick={() => setAction('bind_existing')}
        >
          Bind existing workspace
        </Button>
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setIsSaving(true);
          setStatusText(null);

          try {
            const response = await fetch(`/api/product-state/projects/${projectId}/workspace`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                action,
                workspacePath,
                repoName,
                repoUrl,
                defaultBranch,
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to save project workspace');
            }

            setStatusText(
              action === 'bootstrap'
                ? 'Workspace bootstrapped and attached to the project.'
                : 'Existing workspace bound to the project.',
            );
            window.location.reload();
          } catch (error) {
            setStatusText(error instanceof Error ? error.message : 'Failed to save project workspace');
          } finally {
            setIsSaving(false);
          }
        }}
        style={{ display: 'grid', gap: 'var(--space-3)' }}
      >
        <input
          value={workspacePath}
          onChange={(event) => setWorkspacePath(event.target.value)}
          placeholder="Workspace path"
          style={inputStyle}
        />
        <input
          value={repoName}
          onChange={(event) => setRepoName(event.target.value)}
          placeholder="Repo name"
          style={inputStyle}
        />
        <input
          value={repoUrl}
          onChange={(event) => setRepoUrl(event.target.value)}
          placeholder="Repo URL (optional)"
          style={inputStyle}
        />
        <input
          value={defaultBranch}
          onChange={(event) => setDefaultBranch(event.target.value)}
          placeholder="Default branch"
          style={inputStyle}
        />
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button type="submit" disabled={isSaving}>
            {isSaving
              ? 'Saving...'
              : action === 'bootstrap'
                ? 'Bootstrap workspace'
                : 'Bind workspace'}
          </Button>
          {statusText ? (
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>{statusText}</span>
          ) : null}
        </div>
      </form>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--separator)',
  background: 'rgba(0,0,0,0.12)',
  color: 'var(--text-primary)',
  padding: '0 var(--space-3)',
};

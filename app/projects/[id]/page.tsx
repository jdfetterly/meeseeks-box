import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import { ProjectPlaybookForm } from '@/components/projects/ProjectPlaybookForm';
import { ProjectProfileForm } from '@/components/projects/ProjectProfileForm';
import { ProjectSuggestionActions } from '@/components/projects/ProjectSuggestionActions';
import { ProjectWorkspaceManager } from '@/components/projects/ProjectWorkspaceManager';
import { ProjectSpecsManager } from '@/components/projects/ProjectSpecsManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatConversationStatus, listConversationOverviews } from '@/lib/conversations/service';
import { deriveDefaultWorkspacePath, getProjectDetail } from '@/lib/projects/service';
import { listOpenLoops } from '@/lib/product-state/repositories';
import { listProjectSpecDetails } from '@/lib/specs/service';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = getProjectDetail(id);

  if (!workspace) {
    notFound();
  }

  const suggestedWorkspacePath = workspace.workspace?.workspacePath ?? deriveDefaultWorkspacePath(workspace.project);
  const specs = listProjectSpecDetails(workspace.project.id);
  const openLoops = listOpenLoops({ projectId: workspace.project.id, status: 'open' });
  const projectConversations = listConversationOverviews().filter(
    (overview) => overview.conversation.projectId === workspace.project.id,
  ).slice(0, 4);
  const recommendedNextMove =
    openLoops[0]?.recommendedAction ??
    projectConversations[0]?.conversation.recommendedNextAction ??
    workspace.summary.suggestedPrompt;

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: 'var(--space-6) var(--space-4) var(--space-12)',
        }}
      >
        <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'grid', gap: '8px' }}>
              <h1 style={headlineStyle}>{workspace.project.title}</h1>
              <p style={ledeStyle}>
                {workspace.project.summary ?? workspace.project.currentFocus ?? 'No project summary yet.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <OpenChatPanelButton
                label="Ask / Plan"
                intent="project_planning"
                context={{
                  entityType: 'project',
                  entityId: workspace.project.id,
                  projectId: workspace.project.id,
                  page: 'project',
                  suggestedPrompt: workspace.summary.suggestedPrompt,
                }}
              />
              <Link href={`/work?projectId=${workspace.project.id}`} style={linkChipStyle}>
                Open board
              </Link>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Current plan</CardTitle>
              <CardDescription>One plan in focus. Refine it here, then derive work from it.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectSpecsManager
                projectId={workspace.project.id}
                projectTitle={workspace.project.title}
                linkedRepos={workspace.project.linkedRepos}
                workspacePath={workspace.workspace?.workspacePath ?? null}
                specs={specs}
              />
            </CardContent>
          </Card>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recommended next move</CardTitle>
                <CardDescription>Start here.</CardDescription>
              </CardHeader>
              <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  {recommendedNextMove}
                </p>
                <OpenChatPanelButton
                  label="Work this through Assistant"
                  intent="general_chat"
                  context={{
                    entityType: 'project',
                    entityId: workspace.project.id,
                    projectId: workspace.project.id,
                    page: 'project',
                    suggestedPrompt: recommendedNextMove,
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Open loops</CardTitle>
                <CardDescription>What is still unresolved.</CardDescription>
              </CardHeader>
              <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
                {openLoops.length === 0 ? (
                  <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                    No blocking open loops are active right now.
                  </p>
                ) : (
                  openLoops.map((loop) => (
                    <div key={loop.id} style={listRowStyle}>
                      <strong>{loop.title}</strong>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                        {loop.priority} priority • waiting on {loop.waitingOn}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Continue conversations</CardTitle>
                <CardDescription>Saved context that still matters.</CardDescription>
              </CardHeader>
              <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
                {projectConversations.length === 0 ? (
                  <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                    No saved conversation context yet.
                  </p>
                ) : (
                  projectConversations.map((overview) => (
                    <Link key={overview.conversation.id} href={`/chat/${overview.conversation.id}`} style={listRowStyle}>
                      <strong>{overview.conversation.title ?? 'Untitled conversation'}</strong>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                        {formatConversationStatus(overview.conversation.status)}
                      </span>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <details
            style={{
              border: '1px solid var(--separator)',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--material-ultra-thin)',
              padding: 'var(--space-4)',
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                fontWeight: 700,
                color: 'var(--text-secondary)',
              }}
            >
              Project context and advanced controls
            </summary>
            <div style={{ display: 'grid', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.1fr 0.9fr',
                  gap: 'var(--space-4)',
                }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Project profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProjectProfileForm project={workspace.project} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Workspace</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProjectWorkspaceManager
                      projectId={workspace.project.id}
                      projectTitle={workspace.project.title}
                      linkedRepos={workspace.project.linkedRepos}
                      workspace={workspace.workspace}
                      suggestedPath={suggestedWorkspacePath}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Signals</CardTitle>
                </CardHeader>
                <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
                  <p style={metricStyle}>Priority: {workspace.project.priority}</p>
                  <p style={metricStyle}>Status: {workspace.project.status}</p>
                  <p style={metricStyle}>Workspace: {workspace.summary.workspaceStatus.replaceAll('_', ' ')}</p>
                  <p style={metricStyle}>Work cards: {workspace.summary.workCount}</p>
                  <p style={metricStyle}>Review ready: {workspace.summary.reviewCount}</p>
                  <p style={metricStyle}>Needs attention: {workspace.summary.openAttentionCount}</p>
                </CardContent>
              </Card>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.1fr 0.9fr',
                  gap: 'var(--space-4)',
                }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Project playbook</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProjectPlaybookForm projectId={workspace.project.id} playbook={workspace.playbook} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Learning suggestions</CardTitle>
                  </CardHeader>
                  <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
                    {workspace.learningSuggestions.length === 0 ? (
                      <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                        No project learning suggestions yet.
                      </p>
                    ) : (
                      workspace.learningSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          style={{
                            border: '1px solid var(--separator)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-3)',
                            background: 'var(--material-thin)',
                            display: 'grid',
                            gap: 'var(--space-2)',
                          }}
                        >
                          <strong>{suggestion.title}</strong>
                          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{suggestion.detail}</p>
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                            {suggestion.status}
                          </span>
                          {suggestion.status === 'open' ? (
                            <ProjectSuggestionActions
                              projectId={workspace.project.id}
                              suggestionId={suggestion.id}
                            />
                          ) : null}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </details>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Active work</CardTitle>
                <CardDescription>{workspace.workItems.length} project cards.</CardDescription>
              </CardHeader>
              <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
                {workspace.workItems.slice(0, 6).map((item) => (
                  <Link key={item.workItemId} href={`/work/${item.workItemId}`} style={listRowStyle}>
                    <strong>{item.title}</strong>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                      {item.displayStatus.replaceAll('_', ' ')}
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review ready</CardTitle>
                <CardDescription>{workspace.reviewItems.length} outputs waiting on judgment.</CardDescription>
              </CardHeader>
              <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
                {workspace.reviewItems.length === 0 ? (
                  <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                    Nothing in review right now.
                  </p>
                ) : (
                  workspace.reviewItems.map((item) => (
                    <Link key={item.id} href="/review" style={listRowStyle}>
                      <strong>{item.summary}</strong>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                        {item.status}
                      </span>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

const eyebrowStyle = {
  margin: 0,
  color: 'var(--text-tertiary)',
  fontSize: 'var(--text-caption1)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  fontWeight: 'var(--weight-semibold)',
};

const headlineStyle = {
  margin: 0,
  fontSize: 'clamp(2rem, 4vw, 3.2rem)',
  lineHeight: 0.98,
  letterSpacing: '-0.05em',
};

const ledeStyle = {
  margin: 0,
  maxWidth: 760,
  color: 'var(--text-secondary)',
};

const metricStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
};

const linkChipStyle = {
  minHeight: 40,
  padding: '0 14px',
  borderRadius: '999px',
  border: '1px solid var(--separator)',
  background: 'var(--material-thin)',
  color: 'var(--text-primary)',
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
};

const listRowStyle = {
  border: '1px solid var(--separator)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-3)',
  background: 'var(--material-thin)',
  textDecoration: 'none',
  color: 'inherit',
  display: 'grid',
  gap: '4px',
};

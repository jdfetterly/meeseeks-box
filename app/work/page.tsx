import Link from 'next/link';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import { ActiveWorkPane } from '@/components/experiments/ActiveWorkPane';
import { AssistantWorkspacePanel } from '@/components/experiments/AssistantWorkspacePanel';
import { MemoryContextRail } from '@/components/experiments/MemoryContextRail';
import { ReviewPreviewPanel } from '@/components/experiments/ReviewPreviewPanel';
import { StandingWorkPreviewPanel } from '@/components/experiments/StandingWorkPreviewPanel';
import { DraftActions } from '@/components/work/DraftActions';
import { LaunchComposer } from '@/components/work/LaunchComposer';
import { RecommendedJobsPanel } from '@/components/work/RecommendedJobsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProjectShellModel } from '@/lib/experiments/project-shell';
import { listCanonicalLaunchDrafts } from '@/lib/launch/service';
import { listProjectContextSummaries } from '@/lib/projects/service';
import { listConversations, listSavedLaunchPresets } from '@/lib/product-state/repositories';
import { listRecommendedJobInstallations } from '@/lib/recommended-jobs';
import { formatScheduleTime } from '@/lib/schedules/presentation';
import { getBoardProjectLabel, getBoardProjectOptions, listBoardLanes } from '@/lib/work-board/service';

export const dynamic = 'force-dynamic';

const TAB_VALUES = new Set(['board', 'drafts', 'jobs']);
const MODE_VALUES = new Set(['project', 'status']);

function formatQuery(params: Array<[string, string | null | undefined]>) {
  const search = new URLSearchParams();

  for (const [key, value] of params) {
    if (value) {
      search.set(key, value);
    }
  }

  const query = search.toString();
  return query ? `/work?${query}` : '/work';
}

function tabLabel(value: 'board' | 'drafts' | 'jobs') {
  if (value === 'jobs') {
    return 'Automation';
  }

  return value[0].toUpperCase() + value.slice(1);
}

export default async function WorkPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; mode?: string; projectId?: string; card?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const activeTab = TAB_VALUES.has(params.tab ?? '') ? (params.tab as 'board' | 'drafts' | 'jobs') : 'board';
  const activeMode = MODE_VALUES.has(params.mode ?? '') ? (params.mode as 'project' | 'status') : 'project';
  const projectId = typeof params.projectId === 'string' ? params.projectId : null;
  const activeCardId = typeof params.card === 'string' ? params.card : null;

  const lanes = listBoardLanes({ mode: activeMode, projectId });
  const projectShell = projectId
    ? getProjectShellModel(projectId, {
        view: activeMode === 'status' ? 'status' : 'plan',
        cardId: activeCardId,
      })
    : null;
  const drafts = listCanonicalLaunchDrafts();
  const recommendedJobs = listRecommendedJobInstallations();
  const savedPresets = listSavedLaunchPresets();
  const projects = listProjectContextSummaries();
  const projectOptions = getBoardProjectOptions();
  const conversationsById = new Map(listConversations().map((conversation) => [conversation.id, conversation]));

  const cardCount = lanes.reduce((sum, lane) => sum + lane.cards.length, 0);
  const inReviewCount = lanes.find((lane) => lane.lane === 'in_review')?.cards.length ?? 0;
  const activeProjectTitle = projectShell?.projectDetail.project.title ?? (projectId ? getBoardProjectLabel(projectId) : 'All projects');
  const projectShellTodoCount = projectShell?.lanes.find((lane) => lane.lane === 'todo')?.cards.length ?? 0;
  const projectShellRecommendedMove = projectShellTodoCount > 0
    ? 'Select the next reviewable card from To Do and steer it from the same route.'
    : projectShell?.projectDetail.summary.suggestedPrompt ?? 'Use Assistant to define the next reviewable slice.';
  const projectBoardLink = formatQuery([
    ['projectId', projectId],
    ['mode', activeMode === 'project' ? null : activeMode],
  ]);

  function boardCardHref(cardId: string) {
    return formatQuery([
      ['projectId', projectId],
      ['mode', activeMode === 'project' ? null : activeMode],
      ['card', cardId],
    ]);
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'transparent' }}>
      <div
        style={{
          maxWidth: 1260,
          margin: '0 auto',
          padding: 'var(--space-5) var(--space-4) var(--space-12)',
        }}
      >
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'grid', gap: '6px' }}>
                <h1 style={titleStyle}>Board</h1>
                <p style={subtitleStyle}>Plan-derived execution. Step in only when work needs your judgment.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <StatPill label="Visible cards" value={String(cardCount)} />
                <StatPill label="In review" value={String(inReviewCount)} />
                <StatPill label="Focus" value={activeProjectTitle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(['board', 'drafts', 'jobs'] as const).map((tab) => (
                  <Link
                    key={tab}
                    href={formatQuery([
                      ['tab', tab === 'board' ? null : tab],
                      ['mode', activeMode === 'project' ? null : activeMode],
                      ['projectId', projectId],
                    ])}
                    style={toolbarLinkStyle(activeTab === tab)}
                  >
                    {tabLabel(tab)}
                  </Link>
                ))}
              </div>
              <OpenChatPanelButton
                label="Ask / Delegate"
                intent="create_work"
                context={{
                  entityType: projectId ? 'project' : 'home',
                  entityId: projectId,
                  projectId,
                  page: 'board',
                  suggestedPrompt: projectId
                    ? `Move ${activeProjectTitle} forward. Propose the next useful step.`
                    : 'Look across active work and propose the next move worth delegating.',
                }}
              />
            </div>
          </header>

          {activeTab === 'board' ? (
            <>
              <Card className="border-white/8 bg-white/[0.035] py-4">
                <CardContent
                  style={{
                    display: 'grid',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {(['project', 'status'] as const).map((mode) => (
                        <Link
                          key={mode}
                          href={formatQuery([
                            ['mode', mode === 'project' ? null : mode],
                            ['projectId', projectId],
                          ])}
                          style={toolbarLinkStyle(activeMode === mode)}
                        >
                          {mode === 'project' ? 'Project flow' : 'By status'}
                        </Link>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <OpenChatPanelButton
                        label="Plan next work"
                        intent="create_work"
                        context={{
                          entityType: projectId ? 'project' : 'home',
                          entityId: projectId,
                          projectId,
                          page: 'board',
                          suggestedPrompt: projectId
                            ? `Break the next piece of ${activeProjectTitle} into plan-derived work.`
                            : 'Propose the next plan-derived work item and attach it to the right project.',
                        }}
                      />
                      <OpenChatPanelButton
                        label="Create schedule"
                        intent="create_schedule"
                        context={{
                          entityType: projectId ? 'project' : 'home',
                          entityId: projectId,
                          projectId,
                          page: 'board',
                          suggestedPrompt: 'Create a recurring outcome and keep setup conversational.',
                        }}
                        variant="outline"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link
                      href={formatQuery([['mode', activeMode === 'project' ? null : activeMode]])}
                      style={filterChipStyle(projectId === null)}
                    >
                      All projects
                    </Link>
                    {projectOptions.map((project) => (
                      <Link
                        key={project.id}
                        href={formatQuery([
                          ['mode', activeMode === 'project' ? null : activeMode],
                          ['projectId', project.id],
                        ])}
                        style={filterChipStyle(projectId === project.id)}
                      >
                        {project.title}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {projectShell ? (
                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  <Card className="border-white/8 bg-white/[0.035] py-4">
                    <CardContent style={{ display: 'grid', gap: '16px' }}>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={projectShellTagStyle}>Project-context shell</span>
                          <StatPill label="Workspace" value={projectShell.projectDetail.summary.workspaceStatus.replaceAll('_', ' ')} />
                          <StatPill label="Review" value={String(projectShell.projectDetail.summary.reviewCount)} />
                          <StatPill label="Attention" value={String(projectShell.projectDetail.summary.openAttentionCount)} />
                        </div>
                        <div style={{ display: 'grid', gap: '4px' }}>
                          <h2 style={projectShellTitleStyle}>
                            {projectShell.currentPlan?.spec.title ?? `Move ${activeProjectTitle} forward`}
                          </h2>
                          <p style={subtitleStyle}>
                            {projectShell.currentPlan?.spec.outcome ??
                              projectShell.projectDetail.project.currentFocus ??
                              projectShell.projectDetail.project.summary}
                          </p>
                        </div>
                      </div>

                      <div style={projectCalloutStyle}>
                        <strong style={{ color: 'var(--text-primary)' }}>Recommended next move</strong>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{projectShellRecommendedMove}</p>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <OpenChatPanelButton
                          label="Plan with Assistant"
                          intent="project_planning"
                          context={{
                            entityType: 'project',
                            entityId: projectShell.projectDetail.project.id,
                            projectId: projectShell.projectDetail.project.id,
                            page: 'board',
                            suggestedPrompt: projectShell.projectDetail.summary.suggestedPrompt,
                          }}
                        />
                        <OpenChatPanelButton
                          label={projectShell.currentPlan ? 'Turn plan into cards' : 'Draft current plan'}
                          intent={projectShell.currentPlan ? 'spec_decomposition' : 'spec_planning'}
                          context={{
                            entityType: 'project',
                            entityId: projectShell.projectDetail.project.id,
                            projectId: projectShell.projectDetail.project.id,
                            page: 'board',
                            suggestedPrompt: projectShell.currentPlan
                              ? `Turn the current plan for ${activeProjectTitle} into small reviewable cards.`
                              : `Draft the current plan for ${activeProjectTitle}.`,
                            starterSpecId: projectShell.currentPlan?.spec.id ?? null,
                            starterSpecTitle: projectShell.currentPlan?.spec.title ?? null,
                            starterWorkspacePath: projectShell.projectDetail.workspace?.workspacePath ?? null,
                            starterRepoList: projectShell.projectDetail.project.linkedRepos,
                          }}
                          variant="outline"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div style={projectShellGridStyle}>
                    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                          gap: 'var(--space-3)',
                        }}
                      >
                        {projectShell.lanes.map(({ lane, title, cards }) => (
                          <section key={lane} style={laneStyle}>
                            <div style={laneHeaderStyle}>
                              <div>
                                <h2 style={laneTitleStyle}>{title}</h2>
                                <p style={laneMetaStyle}>{cards.length} active</p>
                              </div>
                            </div>
                            <div style={{ display: 'grid', gap: '10px' }}>
                              {cards.length === 0 ? (
                                <div style={emptyLaneStyle}>Nothing waiting here.</div>
                              ) : (
                                cards.map((card) => (
                                  <Link key={card.workItemId} href={boardCardHref(card.workItemId)} style={boardCardStyle}>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                      <div style={{ display: 'grid', gap: '4px' }}>
                                        <strong style={{ fontSize: '0.98rem', lineHeight: 1.25 }}>{card.title}</strong>
                                        <span style={mutedMetaStyle}>
                                          {card.projectTitle ?? 'Unassigned project'}
                                          {card.parentSpecTitle ? ` • Plan: ${card.parentSpecTitle}` : ''}
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={detailPillStyle}>
                                          {card.delegatedAgentId ?? card.scope}
                                        </span>
                                        {card.scheduleTime ? (
                                          <span style={detailPillStyle}>next {formatScheduleTime(card.scheduleTime)}</span>
                                        ) : null}
                                        {card.latestEventType ? (
                                          <span style={detailPillStyle}>{card.latestEventType.replaceAll('_', ' ')}</span>
                                        ) : null}
                                      </div>

                                      {card.sourceConversationId ? (
                                        <span style={conversationMetaStyle}>
                                          {conversationsById.get(card.sourceConversationId)?.title ?? 'Linked conversation'}
                                        </span>
                                      ) : null}

                                      {card.operationalBadges.length > 0 ? (
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                          {card.operationalBadges.map((badge) => (
                                            <span key={badge} style={warningPillStyle}>
                                              {badge.replaceAll('_', ' ')}
                                            </span>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  </Link>
                                ))
                              )}
                            </div>
                          </section>
                        ))}
                      </div>

                      <details style={manualDetailsStyle}>
                        <summary style={manualSummaryStyle}>Manual launch fallback</summary>
                        <div style={{ marginTop: '12px' }}>
                          <LaunchComposer presets={savedPresets} />
                        </div>
                      </details>
                    </div>

                    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                      <ActiveWorkPane activeWork={projectShell.activeWork} />
                      <AssistantWorkspacePanel detail={projectShell.projectDetail} currentPlan={projectShell.currentPlan} compact />
                      <MemoryContextRail detail={projectShell.projectDetail} compact />
                      <StandingWorkPreviewPanel lanes={projectShell.lanes} projectId={projectShell.projectDetail.project.id} />
                      <ReviewPreviewPanel reviewEntries={projectShell.reviewEntries} projectId={projectShell.projectDetail.project.id} />
                      <Link href={`/projects/${projectShell.projectDetail.project.id}`} style={projectShellLinkCardStyle}>
                        <strong>Open project detail</strong>
                        <span style={mutedMetaStyle}>Return to project context without losing the board as the main execution surface.</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: 'var(--space-3)',
                    }}
                  >
                    {lanes.map(({ lane, title, cards }) => (
                      <section key={lane} style={laneStyle}>
                        <div style={laneHeaderStyle}>
                          <div>
                            <h2 style={laneTitleStyle}>{title}</h2>
                            <p style={laneMetaStyle}>{cards.length} active</p>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {cards.length === 0 ? (
                            <div style={emptyLaneStyle}>Nothing waiting here.</div>
                          ) : (
                            cards.map((card) => (
                              <Link key={card.workItemId} href={`/work/${card.workItemId}`} style={boardCardStyle}>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                  <div style={{ display: 'grid', gap: '4px' }}>
                                    <strong style={{ fontSize: '0.98rem', lineHeight: 1.25 }}>{card.title}</strong>
                                    <span style={mutedMetaStyle}>
                                      {card.projectTitle ?? 'Unassigned project'}
                                      {card.parentSpecTitle ? ` • Plan: ${card.parentSpecTitle}` : ''}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={detailPillStyle}>
                                      {card.delegatedAgentId ?? card.scope}
                                    </span>
                                    {card.scheduleTime ? (
                                      <span style={detailPillStyle}>next {formatScheduleTime(card.scheduleTime)}</span>
                                    ) : null}
                                    {card.latestEventType ? (
                                      <span style={detailPillStyle}>{card.latestEventType.replaceAll('_', ' ')}</span>
                                    ) : null}
                                  </div>

                                  {card.sourceConversationId ? (
                                    <span style={conversationMetaStyle}>
                                      {conversationsById.get(card.sourceConversationId)?.title ?? 'Linked conversation'}
                                    </span>
                                  ) : null}

                                  {card.operationalBadges.length > 0 ? (
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                      {card.operationalBadges.map((badge) => (
                                        <span key={badge} style={warningPillStyle}>
                                          {badge.replaceAll('_', ' ')}
                                        </span>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              </Link>
                            ))
                          )}
                        </div>
                      </section>
                    ))}
                  </div>

                  <details style={manualDetailsStyle}>
                    <summary style={manualSummaryStyle}>Manual launch fallback</summary>
                    <div style={{ marginTop: '12px' }}>
                      <LaunchComposer presets={savedPresets} />
                    </div>
                  </details>
                </>
              )}
            </>
          ) : null}

          {activeTab === 'drafts' ? (
            <Card className="border-white/8 bg-white/[0.035] py-4">
              <CardHeader>
                <CardTitle>Drafts waiting for a decision</CardTitle>
              </CardHeader>
              <CardContent style={{ display: 'grid', gap: '12px' }}>
                {drafts.length === 0 ? (
                  <div style={emptyStateStyle}>No drafts waiting right now.</div>
                ) : (
                  drafts.map((draft) => (
                    <div key={draft.id} style={draftCardStyle}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'grid', gap: '4px' }}>
                          <strong>{draft.title}</strong>
                          <span style={mutedMetaStyle}>
                            {draft.scope} • {draft.agentId ?? 'unassigned'}
                          </span>
                        </div>
                        <DraftActions draftId={draft.id} />
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                        {draft.prompt}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}

          {activeTab === 'jobs' ? (
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <Card className="border-white/8 bg-white/[0.035] py-4">
                <CardContent
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'grid', gap: '4px' }}>
                    <strong style={{ fontSize: '1rem' }}>Recurring work belongs to outcomes, not cron trivia.</strong>
                    <span style={mutedMetaStyle}>Set it up with the assistant first. Adjust it here only when needed.</span>
                  </div>
                  <OpenChatPanelButton
                    label="Create recurring work"
                    intent="create_schedule"
                    context={{
                      entityType: 'home',
                      page: 'automation',
                      suggestedPrompt: 'Set up recurring work with the minimum amount of setup.',
                    }}
                  />
                </CardContent>
              </Card>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.1fr) minmax(280px, 0.9fr)',
                  gap: 'var(--space-3)',
                }}
              >
                <Card className="border-white/8 bg-white/[0.035] py-4">
                  <CardHeader>
                    <CardTitle>Recommended templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RecommendedJobsPanel jobs={recommendedJobs} />
                  </CardContent>
                </Card>

                <Card className="border-white/8 bg-white/[0.035] py-4">
                  <CardHeader>
                    <CardTitle>Projects in motion</CardTitle>
                  </CardHeader>
                  <CardContent style={{ display: 'grid', gap: '10px' }}>
                    {projects.slice(0, 5).map((project) => (
                      <Link key={project.projectId} href={`/projects/${project.projectId}`} style={compactLinkStyle}>
                        <strong>{project.title}</strong>
                        <span style={mutedMetaStyle}>
                          {project.currentFocus ?? project.activeGoal ?? 'No current focus'}
                        </span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span style={statPillStyle}>
      <strong style={{ color: 'var(--text-primary)' }}>{value}</strong>
      <span>{label}</span>
    </span>
  );
}

const titleStyle = {
  margin: 0,
  fontSize: '2.1rem',
  lineHeight: 0.96,
  letterSpacing: '-0.05em',
};

const subtitleStyle = {
  margin: 0,
  maxWidth: 720,
  color: 'var(--text-secondary)',
};

const statPillStyle = {
  minHeight: '32px',
  padding: '0 12px',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.07)',
  background: 'rgba(255,255,255,0.03)',
  color: 'var(--text-tertiary)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.84rem',
};

const projectShellTagStyle = {
  minHeight: '32px',
  padding: '0 12px',
  borderRadius: '999px',
  border: '1px solid rgba(255,122,89,0.28)',
  background: 'rgba(255,122,89,0.14)',
  color: 'var(--text-primary)',
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '0.82rem',
  fontWeight: 700,
};

const projectShellTitleStyle = {
  margin: 0,
  fontSize: '1.35rem',
  lineHeight: 1.08,
  letterSpacing: '-0.03em',
  color: 'var(--text-primary)',
};

const projectCalloutStyle = {
  display: 'grid',
  gap: '6px',
  borderRadius: '18px',
  border: '1px solid rgba(255,122,89,0.2)',
  background: 'rgba(255,122,89,0.08)',
  padding: '16px',
};

const projectShellGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, 0.84fr)',
  gap: 'var(--space-3)',
  alignItems: 'start',
};

const projectShellLinkCardStyle = {
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '18px',
  padding: '16px',
  background: 'rgba(255,255,255,0.025)',
  textDecoration: 'none',
  color: 'inherit',
  display: 'grid',
  gap: '6px',
};

function toolbarLinkStyle(active: boolean) {
  return {
    minHeight: '34px',
    padding: '0 12px',
    borderRadius: '999px',
    border: active ? '1px solid rgba(255,122,89,0.4)' : '1px solid var(--separator)',
    background: active ? 'var(--accent-fill)' : 'rgba(255,255,255,0.02)',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'none',
    fontSize: '0.84rem',
    fontWeight: 600,
  };
}

function filterChipStyle(active: boolean) {
  return {
    minHeight: '30px',
    padding: '0 11px',
    borderRadius: '999px',
    border: active ? '1px solid rgba(255,122,89,0.4)' : '1px solid rgba(255,255,255,0.07)',
    background: active ? 'var(--accent-fill)' : 'rgba(255,255,255,0.02)',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'none',
    fontSize: '0.8rem',
    fontWeight: 500,
  };
}

const laneStyle = {
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '18px',
  background: 'rgba(255,255,255,0.025)',
  boxShadow: 'var(--shadow-card)',
  padding: '14px',
  display: 'grid',
  gap: '12px',
  alignContent: 'start',
};

const laneHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const laneTitleStyle = {
  margin: 0,
  fontSize: '1rem',
};

const laneMetaStyle = {
  margin: '2px 0 0',
  color: 'var(--text-tertiary)',
  fontSize: '0.8rem',
};

const emptyLaneStyle = {
  borderRadius: '14px',
  border: '1px dashed rgba(255,255,255,0.08)',
  padding: '16px 14px',
  color: 'var(--text-tertiary)',
  fontSize: '0.9rem',
};

const boardCardStyle = {
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '16px',
  padding: '14px',
  background: 'rgba(13,17,23,0.55)',
  textDecoration: 'none',
  color: 'inherit',
  boxShadow: '0 10px 24px rgba(0,0,0,0.14)',
};

const detailPillStyle = {
  padding: '4px 8px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--text-secondary)',
  fontSize: '0.78rem',
};

const warningPillStyle = {
  padding: '4px 8px',
  borderRadius: '999px',
  background: 'rgba(255,122,89,0.1)',
  color: 'var(--accent)',
  fontSize: '0.76rem',
  fontWeight: 600,
};

const mutedMetaStyle = {
  color: 'var(--text-tertiary)',
  fontSize: '0.84rem',
};

const conversationMetaStyle = {
  color: 'var(--text-secondary)',
  fontSize: '0.8rem',
};

const manualDetailsStyle = {
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.025)',
  padding: '14px',
};

const manualSummaryStyle = {
  cursor: 'pointer',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const draftCardStyle = {
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.025)',
  padding: '14px',
  display: 'grid',
  gap: '12px',
};

const compactLinkStyle = {
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '14px',
  textDecoration: 'none',
  color: 'inherit',
  display: 'grid',
  gap: '4px',
  padding: '12px',
  background: 'rgba(255,255,255,0.02)',
};

const emptyStateStyle = {
  border: '1px dashed rgba(255,255,255,0.08)',
  borderRadius: '16px',
  color: 'var(--text-tertiary)',
  padding: '18px 16px',
};

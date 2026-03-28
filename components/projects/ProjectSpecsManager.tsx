'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import type { SpecRecord } from '@/lib/product-state/entities';

interface SpecLinkView {
  link: {
    id: string;
    workItemId: string;
    decompositionReason: string;
    acceptanceCriteria: string[];
    expectedOutput: string | null;
  };
  workItem: {
    id: string;
    title: string;
    status: string;
  } | null;
}

interface ProjectSpecView {
  spec: SpecRecord;
  readiness: {
    isReady: boolean;
    reasons: string[];
    workspaceStatus: 'ready' | 'missing' | 'not_required';
  };
  links: SpecLinkView[];
}

function formatMode(value: SpecRecord['executionMode']) {
  switch (value) {
    case 'workspace_required':
      return 'workspace-backed';
    case 'non_code':
      return 'non-code';
    case 'planning_only':
    default:
      return 'planning-only';
  }
}

export function ProjectSpecsManager({
  projectId,
  projectTitle,
  linkedRepos,
  workspacePath,
  specs,
}: {
  projectId: string;
  projectTitle: string;
  linkedRepos: string[];
  workspacePath: string | null;
  specs: ProjectSpecView[];
}) {
  const currentPlan = specs[0] ?? null;
  const previousPlanCount = Math.max(0, specs.length - 1);

  if (!currentPlan) {
    return (
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <div style={emptyStateStyle}>
          <strong style={{ fontSize: '1rem' }}>No current plan yet</strong>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Start in copilot. Describe what you want built, what matters most right now, and the agent should draft the
            current plan for this project.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <OpenChatPanelButton
            label="Draft plan in copilot"
            intent="spec_planning"
            context={{
              entityType: 'project',
              entityId: projectId,
              projectId,
              page: 'project',
              suggestedPrompt: `Help me shape the current plan for ${projectTitle}. Keep it lightweight and only ask if something important is missing.`,
              draftPrompt: `Help me define the current plan for ${projectTitle}.

What I want built:
What matters most right now:
Anything already known about repos or workspace:
What "done" should look like:

Draft the plan and get it ready to turn into cards.`,
              starterRepoList: linkedRepos,
              starterWorkspacePath: workspacePath,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <div style={planCardStyle}>
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '1rem' }}>{currentPlan.spec.title}</strong>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
              current plan • {formatMode(currentPlan.spec.executionMode)}
            </span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{currentPlan.spec.outcome}</p>
          <span
            style={{
              color: currentPlan.readiness.isReady ? 'var(--system-green)' : 'var(--system-orange)',
              fontSize: '0.9rem',
            }}
          >
            {currentPlan.readiness.isReady
              ? 'Ready to turn into cards'
              : currentPlan.readiness.reasons.join(' ')}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <OpenChatPanelButton
            label="Refine plan in copilot"
            intent="spec_planning"
            context={{
              entityType: 'project',
              entityId: projectId,
              projectId,
              page: 'project',
              suggestedPrompt: `Refine the current plan for ${projectTitle}. Keep it sharp and lightweight.`,
              draftPrompt: `Refine the current plan for ${projectTitle}.

Plan title: ${currentPlan.spec.title}
Intent:
${currentPlan.spec.intent}

Outcome:
${currentPlan.spec.outcome}

In scope:
${currentPlan.spec.inScope.join('\n')}`,
              starterRepoList: linkedRepos,
              starterWorkspacePath: workspacePath,
              starterSpecId: currentPlan.spec.id,
              starterSpecTitle: currentPlan.spec.title,
            }}
            variant="outline"
          />
          <OpenChatPanelButton
            label="Turn plan into cards"
            intent="spec_decomposition"
            context={{
              entityType: 'project',
              entityId: projectId,
              projectId,
              page: 'project',
              suggestedPrompt: `Turn the current plan for ${projectTitle} into small reviewable cards.`,
              draftPrompt: `Turn the current plan for ${projectTitle} into the smallest useful set of cards I can review cleanly.`,
              starterRepoList: linkedRepos,
              starterWorkspacePath: workspacePath,
              starterSpecId: currentPlan.spec.id,
              starterSpecTitle: currentPlan.spec.title,
            }}
            variant="outline"
          />
        </div>

        <div style={detailGridStyle}>
          <section style={detailBlockStyle}>
            <strong>Intent</strong>
            <p style={bodyTextStyle}>{currentPlan.spec.intent}</p>
          </section>
          <section style={detailBlockStyle}>
            <strong>In scope</strong>
            <ul style={listStyle}>
              {currentPlan.spec.inScope.length > 0 ? (
                currentPlan.spec.inScope.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>Scope still needs to be clarified in copilot.</li>
              )}
            </ul>
          </section>
          <section style={detailBlockStyle}>
            <strong>Acceptance</strong>
            <ul style={listStyle}>
              {currentPlan.spec.acceptanceCriteria.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section style={detailBlockStyle}>
            <strong>Review output</strong>
            <p style={bodyTextStyle}>
              {currentPlan.spec.reviewExpectations ?? 'Summarize what changed and leave the output ready for review.'}
            </p>
          </section>
        </div>

        {currentPlan.links.length > 0 ? (
          <div style={{ display: 'grid', gap: '8px' }}>
            <strong style={{ fontSize: '0.95rem' }}>Cards created from this plan</strong>
            {currentPlan.links.map(({ link, workItem }) => (
              <Link key={link.id} href={`/work/${link.workItemId}`} style={linkedCardStyle}>
                <strong>{workItem?.title ?? 'Unknown work item'}</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {link.decompositionReason}
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {previousPlanCount > 0 ? (
        <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
          {previousPlanCount} older {previousPlanCount === 1 ? 'plan is' : 'plans are'} stored behind the scenes.
          The assistant should work from the current one unless you deliberately replace it.
        </p>
      ) : null}
    </div>
  );
}

const emptyStateStyle: CSSProperties = {
  border: '1px solid var(--separator)',
  borderRadius: 'var(--radius-xl)',
  padding: 'var(--space-4)',
  background: 'var(--material-thin)',
  display: 'grid',
  gap: 'var(--space-2)',
};

const planCardStyle: CSSProperties = {
  border: '1px solid var(--separator)',
  borderRadius: 'var(--radius-xl)',
  padding: 'var(--space-4)',
  background: 'var(--material-thin)',
  display: 'grid',
  gap: 'var(--space-4)',
};

const detailGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 'var(--space-3)',
};

const detailBlockStyle: CSSProperties = {
  display: 'grid',
  gap: '8px',
  alignContent: 'start',
};

const bodyTextStyle: CSSProperties = {
  margin: 0,
  color: 'var(--text-secondary)',
  whiteSpace: 'pre-wrap',
};

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: '1.1rem',
  color: 'var(--text-secondary)',
};

const linkedCardStyle: CSSProperties = {
  border: '1px solid var(--separator)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-3)',
  textDecoration: 'none',
  color: 'inherit',
  display: 'grid',
  gap: '4px',
};

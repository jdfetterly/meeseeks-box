import Link from 'next/link';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import { listProjectContextSummaries } from '@/lib/projects/service';

export const dynamic = 'force-dynamic';

const PROJECT_SETUP_EXAMPLES = [
  {
    title: 'Meeseek Box redesign',
    prompt:
      'Set up a project for redesigning Meeseek Box. Outcome: make the product feel AI-first. Repos: meeseeks-box, openclaw. Current focus: simplify the shell and control plane.',
  },
  {
    title: 'Family ops',
    prompt:
      'Set up a project for family ops. Outcome: keep childcare planning low friction. Repos: family-systems. Current focus: recurring briefs, handoff notes, weekly planning.',
  },
] as const;

export default function ProjectsPage() {
  const projects = listProjectContextSummaries();

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div style={pageStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <h1 style={titleStyle}>Projects</h1>
            <p style={subtitleStyle}>Each project keeps durable context, one current plan, and the work derived from it.</p>
          </div>
          <OpenChatPanelButton
            label="New project"
            intent="project_planning"
            context={{
              entityType: 'home',
              page: 'projects',
              suggestedPrompt: 'Set up a new project. Ask only for what is missing.',
            }}
          />
        </div>

        <div style={gridStyle}>
          <section style={setupPanelStyle}>
            <div style={{ display: 'grid', gap: '6px' }}>
              <span style={sectionLabelStyle}>Start Here</span>
              <h2 style={panelTitleStyle}>Tell the assistant the outcome and repo context.</h2>
            </div>
            <div style={promptListStyle}>
              <span style={promptChipStyle}>Outcome you want</span>
              <span style={promptChipStyle}>Repos involved</span>
              <span style={promptChipStyle}>What matters now</span>
              <span style={promptChipStyle}>How review should work</span>
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {PROJECT_SETUP_EXAMPLES.map((example) => (
                <OpenChatPanelButton
                  key={example.title}
                  label={example.title}
                  intent="project_planning"
                  context={{
                    entityType: 'home',
                    page: 'projects',
                    suggestedPrompt: example.prompt,
                    draftPrompt: example.prompt,
                    starterProjectTitle: example.title,
                  }}
                  variant="outline"
                />
              ))}
            </div>
          </section>

          <section style={listPanelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <span style={sectionLabelStyle}>Current Work</span>
                <h2 style={panelTitleStyle}>Active projects</h2>
              </div>
              <span style={countStyle}>{projects.length}</span>
            </div>
            <div style={listStyle}>
              {projects.length === 0 ? (
                <p style={emptyStyle}>No projects yet.</p>
              ) : (
                projects.map((project) => (
                  <div key={project.projectId} style={projectRowStyle}>
                    <div style={{ display: 'grid', gap: '6px', minWidth: 0, flex: 1 }}>
                      <Link href={`/projects/${project.projectId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <strong style={{ fontSize: '1rem' }}>{project.title}</strong>
                        <p style={projectSummaryStyle}>
                          {project.activeGoal ?? project.currentFocus ?? 'No current focus set yet.'}
                        </p>
                      </Link>
                      <div style={metaRowStyle}>
                        <span>{project.workCount} cards</span>
                        <span>{project.reviewCount} in review</span>
                        <span>{project.openAttentionCount} attention</span>
                        <span>{project.workspaceStatus === 'ready' ? 'workspace ready' : 'planning only'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Link href={`/lab/project/${project.projectId}/cockpit`} style={{ ...rowArrowStyle, textDecoration: 'none', color: 'var(--text-primary)', background: 'var(--material-thin)', padding: '6px 12px', borderRadius: '999px', border: '1px solid var(--separator)' }}>
                        Lab
                      </Link>
                      <Link href={`/projects/${project.projectId}`} style={{ ...rowArrowStyle, textDecoration: 'none', padding: '6px 12px' }}>
                        Open →
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  maxWidth: 1120,
  margin: '0 auto',
  padding: '32px 28px 56px',
  display: 'grid',
  gap: '22px',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '18px',
  alignItems: 'flex-start',
  flexWrap: 'wrap' as const,
};

const titleStyle = {
  margin: 0,
  fontSize: 'clamp(2rem, 3vw, 2.7rem)',
  lineHeight: 0.96,
  letterSpacing: '-0.05em',
};

const subtitleStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '18px',
};

const setupPanelStyle = {
  display: 'grid',
  gap: '18px',
  padding: '22px',
  borderRadius: '24px',
  background: 'var(--material-ultra-thin)',
  border: '1px solid var(--separator)',
};

const listPanelStyle = {
  display: 'grid',
  gap: '16px',
  padding: '22px',
  borderRadius: '24px',
  background: 'var(--material-ultra-thin)',
  border: '1px solid var(--separator)',
};

const sectionLabelStyle = {
  fontSize: '0.72rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-quaternary)',
  fontWeight: 700,
};

const panelTitleStyle = {
  margin: '2px 0 0',
  fontSize: '1.12rem',
  lineHeight: 1.12,
};

const promptListStyle = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap' as const,
};

const promptChipStyle = {
  padding: '8px 12px',
  borderRadius: '999px',
  background: 'var(--material-thin)',
  border: '1px solid var(--separator)',
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
};

const panelHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'center',
};

const countStyle = {
  fontSize: '0.85rem',
  color: 'var(--text-tertiary)',
  fontWeight: 700,
};

const listStyle = {
  display: 'grid',
  gap: '10px',
};

const projectRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  alignItems: 'flex-start',
  padding: '16px 18px',
  borderRadius: '18px',
  background: 'var(--material-thin)',
  border: '1px solid var(--separator)',
  textDecoration: 'none',
  color: 'inherit',
};

const projectSummaryStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
  fontSize: '0.94rem',
};

const metaRowStyle = {
  display: 'flex',
  gap: '8px 10px',
  flexWrap: 'wrap' as const,
  color: 'var(--text-tertiary)',
  fontSize: '0.82rem',
};

const rowArrowStyle = {
  color: 'var(--text-quaternary)',
  fontSize: '0.88rem',
  fontWeight: 700,
  whiteSpace: 'nowrap' as const,
};

const emptyStyle = {
  margin: 0,
  color: 'var(--text-tertiary)',
};

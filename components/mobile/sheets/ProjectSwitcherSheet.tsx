'use client';

import { BottomSheet } from '../BottomSheet';
import type { MobileProject } from '../types';
import { MB } from '../tokens';

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7l3.5 3.5 5.5-6" stroke={MB.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface ProjectSwitcherSheetProps {
  open: boolean;
  onClose: () => void;
  projects: MobileProject[];
  activeProjectId: string | null;
  onSwitch: (id: string) => void;
}

export function ProjectSwitcherSheet({
  open,
  onClose,
  projects,
  activeProjectId,
  onSwitch,
}: ProjectSwitcherSheetProps) {
  function handleSwitch(id: string) {
    onSwitch(id);
    setTimeout(onClose, 180);
  }

  return (
    <BottomSheet open={open} onClose={onClose} heightPercent={58}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Section label */}
        <span
          style={{
            fontSize: '10px',
            fontWeight: 400,
            color: MB.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: MB.font,
          }}
        >
          switch project
        </span>

        {/* Project list */}
        <div style={{ display: 'grid', gap: '6px' }}>
          {projects.length === 0 && (
            <div
              style={{
                fontSize: '11px',
                color: MB.textMuted,
                fontFamily: MB.font,
                padding: '12px',
                textAlign: 'center',
              }}
            >
              no projects
            </div>
          )}
          {projects.map((project) => {
            const isActive = project.id === activeProjectId;
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => handleSwitch(project.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '10px 12px',
                  background: isActive ? MB.greenBg : MB.bgCard,
                  border: `1px solid ${isActive ? MB.greenBorder : MB.border}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? MB.green : MB.text,
                    fontFamily: MB.font,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {project.title}
                </span>
                {isActive && <CheckIcon />}
              </button>
            );
          })}
        </div>

        {/* New project */}
        <button
          type="button"
          style={{
            width: '100%',
            padding: '10px',
            background: 'transparent',
            border: `1px dashed ${MB.border}`,
            borderRadius: '10px',
            color: MB.textMuted,
            fontSize: '11px',
            fontFamily: MB.font,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '13px' }}>+</span> new project
        </button>
      </div>
    </BottomSheet>
  );
}

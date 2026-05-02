'use client';

import { useEffect, useRef, useState } from 'react';
import { BottomSheet } from '../BottomSheet';
import type { MobileProject } from '../types';
import { MB } from '../tokens';

const PROJECT_SELECTION_STORAGE_KEY = 'meeseeks-mobile.project-selection';
const PROJECT_SELECTION_EVENT = 'meeseeks-mobile-project-selection';

interface PersistedProjectSelection {
  id: string;
  title: string;
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7l3.5 3.5 5.5-6" stroke={MB.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function readPersistedProjectSelection(): PersistedProjectSelection | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(PROJECT_SELECTION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedProjectSelection> | null;
    if (typeof parsed?.id !== 'string' || !parsed.id.trim()) {
      return null;
    }

    return {
      id: parsed.id.trim(),
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'Project',
    };
  } catch {
    return null;
  }
}

function persistProjectSelection(selection: PersistedProjectSelection) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(PROJECT_SELECTION_STORAGE_KEY, JSON.stringify(selection));
    window.dispatchEvent(new CustomEvent(PROJECT_SELECTION_EVENT, { detail: selection }));
  } catch {
    // Device-local persistence is best effort.
  }
}

interface ProjectSwitcherSheetProps {
  open: boolean;
  onClose: () => void;
  projects: MobileProject[];
  activeProjectId: string | null;
  onSwitch: (id: string) => void;
  onCreateProject: (title: string) => Promise<void>;
  creatingProject?: boolean;
  createProjectError?: string | null;
}

export function ProjectSwitcherSheet({
  open,
  onClose,
  projects,
  activeProjectId,
  onSwitch,
  onCreateProject,
  creatingProject = false,
  createProjectError = null,
}: ProjectSwitcherSheetProps) {
  const [persistedSelection, setPersistedSelection] = useState<PersistedProjectSelection | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    setPersistedSelection(readPersistedProjectSelection());
  }, []);

  useEffect(() => {
    if (restoredRef.current || projects.length === 0) {
      return;
    }

    restoredRef.current = true;
    const storedSelection = readPersistedProjectSelection();

    if (storedSelection) {
      const storedProject = projects.find((project) => project.id === storedSelection.id) ?? null;
      if (storedProject) {
        const selection = { id: storedProject.id, title: storedProject.title };
        persistProjectSelection(selection);
        setPersistedSelection(selection);
        if (selection.id !== activeProjectId) {
          onSwitch(selection.id);
        }
        return;
      }

      const currentProject = projects.find((project) => project.id === activeProjectId) ?? null;
      if (currentProject) {
        const selection = { id: currentProject.id, title: currentProject.title };
        persistProjectSelection(selection);
        setPersistedSelection(selection);
      }
      return;
    }

    const currentProject = projects.find((project) => project.id === activeProjectId) ?? null;
    if (currentProject) {
      const selection = { id: currentProject.id, title: currentProject.title };
      persistProjectSelection(selection);
      setPersistedSelection(selection);
    }
  }, [activeProjectId, onSwitch, projects]);

  function handleSwitch(id: string) {
    const project = projects.find((item) => item.id === id) ?? null;
    if (project) {
      const selection = { id: project.id, title: project.title };
      persistProjectSelection(selection);
      setPersistedSelection(selection);
    }
    onSwitch(id);
    setTimeout(onClose, 180);
  }

  async function handleCreateProject() {
    const title = newProjectTitle.trim();
    if (!title || creatingProject) {
      return;
    }

    setLocalError(null);
    try {
      await onCreateProject(title);
      setNewProjectTitle('');
      setIsCreating(false);
      setTimeout(onClose, 180);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Failed to create project');
    }
  }

  const selectedProjectId = persistedSelection?.id ?? activeProjectId;
  const canCreate = Boolean(newProjectTitle.trim()) && !creatingProject;

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
            const isActive = project.id === selectedProjectId;
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
        {isCreating ? (
          <div
            style={{
              display: 'grid',
              gap: '8px',
              padding: '10px',
              background: MB.bgCard,
              border: `1px dashed ${MB.border}`,
              borderRadius: '10px',
            }}
          >
            <input
              value={newProjectTitle}
              onChange={(event) => setNewProjectTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleCreateProject();
                }
                if (event.key === 'Escape') {
                  setIsCreating(false);
                  setLocalError(null);
                }
              }}
              autoFocus
              placeholder="Project title"
              disabled={creatingProject}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: `1px solid ${MB.borderStrong}`,
                borderRadius: '999px',
                background: MB.bg,
                color: MB.text,
                fontSize: MB.formControlFontSize,
                fontFamily: MB.font,
                outline: 'none',
                padding: '10px 12px',
              }}
            />
            {(localError || createProjectError) && (
              <p style={{ margin: 0, color: MB.red, fontSize: '11px', fontFamily: MB.font }}>
                {localError ?? createProjectError}
              </p>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setLocalError(null);
                }}
                disabled={creatingProject}
                style={{
                  flex: 1,
                  height: '36px',
                  borderRadius: '999px',
                  border: `1px solid ${MB.borderStrong}`,
                  background: 'transparent',
                  color: MB.textSecondary,
                  fontSize: '11px',
                  fontFamily: MB.font,
                  cursor: creatingProject ? 'default' : 'pointer',
                }}
              >
                cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCreateProject()}
                disabled={!canCreate}
                style={{
                  flex: 1,
                  height: '36px',
                  borderRadius: '999px',
                  border: 'none',
                  background: canCreate ? MB.green : MB.bg,
                  color: canCreate ? MB.bgDeep : MB.textMuted,
                  fontSize: '11px',
                  fontFamily: MB.font,
                  cursor: canCreate ? 'pointer' : 'default',
                  opacity: canCreate ? 1 : 0.7,
                }}
              >
                {creatingProject ? 'creating…' : 'create'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
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
        )}
      </div>
    </BottomSheet>
  );
}

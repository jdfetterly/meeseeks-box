'use client';

import { useCallback } from 'react';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import { NavLinks } from '@/components/NavLinks';
import { MobileSidebar } from '@/components/MobileSidebar';
import { GlobalSearch } from '@/components/GlobalSearch';
import { useSettings } from '@/app/settings-provider';

/**
 * Sidebar -- client wrapper that coordinates desktop sidebar, mobile sidebar,
 * and the Cmd+K search palette. Rendered inside layout.tsx.
 */
export function Sidebar({
  isDesktop,
}: {
  isDesktop: boolean;
}) {
  const { settings } = useSettings();
  const openSearch = useCallback(() => {
    // We trigger the search modal by simulating Cmd+K.
    // Instead, we expose a controlled open state via a custom event.
    // The GlobalSearch component listens for this.
    window.dispatchEvent(new CustomEvent('clawport:open-search'));
  }, []);

  return (
    <>
      {isDesktop ? (
        <aside
          style={{
            width: '176px',
            height: '100vh',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--sidebar-bg)',
            backdropFilter: 'blur(28px) saturate(160%)',
            WebkitBackdropFilter: 'blur(28px) saturate(160%)',
            borderRight: '1px solid var(--separator)',
          }}
        >
          <div className="px-3 pt-4 pb-2">
            <div className="flex items-center gap-3">
              {settings.portalIcon ? (
                <img
                  src={settings.portalIcon}
                  alt=""
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '11px',
                    objectFit: 'cover',
                    boxShadow: 'var(--shadow-subtle)',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  aria-hidden="true"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '11px',
                    background:
                      'linear-gradient(135deg, rgba(255,126,92,0.92), rgba(110,144,255,0.82))',
                    boxShadow: 'var(--shadow-subtle)',
                    flexShrink: 0,
                  }}
                />
              )}
              <div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 650,
                    letterSpacing: '-0.04em',
                    color: 'var(--text-primary)',
                  }}
                >
                  {(!settings.portalName || settings.portalName === 'ClawPort')
                    ? <>Meeseek <span style={{ color: 'var(--system-orange)' }}>Box</span></>
                    : settings.portalName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  Intent to outcome
                </div>
              </div>
            </div>
          </div>

          <div className="px-3 pb-2">
            <OpenChatPanelButton
              label="Ask / Delegate"
              intent="general_chat"
              context={{
                entityType: 'home',
                page: 'shell',
                suggestedPrompt: 'Help me decide the next move and turn it into action.',
              }}
              fullWidth
            />
          </div>

          <NavLinks onOpenSearch={openSearch} />
        </aside>
      ) : (
        <MobileSidebar onOpenSearch={openSearch} />
      )}

      {/* Global search modal (Cmd+K) */}
      <GlobalSearch />
    </>
  );
}

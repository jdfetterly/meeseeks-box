'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChatPanelProvider } from '@/components/chat-panel/ChatPanelProvider';
import { Sidebar } from '@/components/Sidebar';

export function ShellLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener('change', sync);

    return () => {
      mediaQuery.removeEventListener('change', sync);
    };
  }, []);

  if (pathname.startsWith('/mobile')) {
    return <>{children}</>;
  }

  return (
    <ChatPanelProvider>
      <div
        className="flex h-screen overflow-hidden"
        style={{
          background: isDesktop
            ? 'radial-gradient(circle at top left, rgba(255,154,61,0.11), transparent 22%), radial-gradient(circle at top right, rgba(106,216,255,0.12), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.02), transparent 24%), var(--bg)'
            : 'var(--bg)',
        }}
      >
        <Sidebar isDesktop={isDesktop} />
        <main className="relative flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden">
          {isDesktop ? (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background:
                  'radial-gradient(circle at 18% 0%, rgba(255,154,61,0.07), transparent 26%), radial-gradient(circle at 82% 14%, rgba(106,216,255,0.08), transparent 24%)',
              }}
            />
          ) : null}
          {!isDesktop ? (
            <div style={{ height: '56px', flexShrink: 0 }} />
          ) : null}
          <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden">{children}</div>
          {!isDesktop ? (
            <div style={{ height: '84px', flexShrink: 0 }} />
          ) : null}
        </main>
      </div>
    </ChatPanelProvider>
  );
}

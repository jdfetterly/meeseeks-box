'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, Search, X } from 'lucide-react';
import { useSettings } from '@/app/settings-provider';
import { MORE_NAV_ITEMS, PRIMARY_NAV_ITEMS } from '@/lib/navigation';

interface ScheduleBadgeRecord {
  status: string;
}

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function resolveMobileTitle(pathname: string) {
  const item = [...PRIMARY_NAV_ITEMS, ...MORE_NAV_ITEMS].find((entry) => isActive(pathname, entry.href));
  return item?.label ?? 'Meeseek Box';
}

const MOBILE_PRIMARY_NAV_ITEMS = PRIMARY_NAV_ITEMS.filter((item) =>
  ['/', '/projects', '/work', '/inbox'].includes(item.href),
);

const MOBILE_MORE_NAV_ITEMS = [
  ...PRIMARY_NAV_ITEMS.filter((item) => ['/review', '/chat'].includes(item.href)),
  ...MORE_NAV_ITEMS,
];

export function MobileSidebar({
  onOpenSearch,
}: {
  onOpenSearch?: () => void;
}) {
  const pathname = usePathname();
  const { settings } = useSettings();
  const [moreOpen, setMoreOpen] = useState(false);
  const [scheduleIssueCount, setScheduleIssueCount] = useState<number | null>(null);

  const title = useMemo(() => resolveMobileTitle(pathname), [pathname]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch('/api/product-state/schedules')
      .then((response) => (response.ok ? response.json() : { schedules: [] }))
      .then((data: unknown) => {
        const schedules = Array.isArray(data)
          ? (data as ScheduleBadgeRecord[])
          : ((data as { schedules?: ScheduleBadgeRecord[] })?.schedules ?? []);
        setScheduleIssueCount(
          schedules.filter((schedule) =>
            ['failed', 'missed', 'sync_failed'].includes(schedule.status),
          ).length,
        );
      })
      .catch(() => setScheduleIssueCount(null));
  }, []);

  useEffect(() => {
    document.body.style.overflow = moreOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [moreOpen]);

  return (
    <>
      <header
        className="items-center"
        style={{
          display: 'flex',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          height: '56px',
          padding: '0 14px',
          gap: '12px',
          background: 'var(--sidebar-bg)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderBottom: '1px solid var(--separator)',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Meeseek Box
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenSearch?.()}
          aria-label="Open search"
          style={iconButtonStyle}
        >
          <Search size={18} />
        </button>

        <button
          type="button"
          onClick={() => setMoreOpen((value) => !value)}
          aria-label={moreOpen ? 'Close more menu' : 'Open more menu'}
          style={iconButtonStyle}
        >
          {moreOpen ? <X size={18} /> : <MoreHorizontal size={18} />}
        </button>
      </header>

      <nav
        aria-label="Primary"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 60,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: '6px',
          padding: '10px 10px calc(env(safe-area-inset-bottom, 0px) + 10px)',
          background: 'var(--sidebar-bg)',
          borderTop: '1px solid var(--separator)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        }}
      >
        {MOBILE_PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                minHeight: '52px',
                borderRadius: '12px',
                display: 'grid',
                placeItems: 'center',
                textDecoration: 'none',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                background: active ? 'var(--accent-fill)' : 'transparent',
                position: 'relative',
                gap: '2px',
              }}
            >
              <Icon size={18} />
              <span style={{ fontSize: '11px', fontWeight: active ? 700 : 600 }}>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          style={{
            minHeight: '52px',
            borderRadius: '12px',
            display: 'grid',
            placeItems: 'center',
            color: moreOpen ? 'var(--accent)' : 'var(--text-secondary)',
            background: moreOpen ? 'var(--accent-fill)' : 'transparent',
            border: 'none',
            gap: '2px',
            position: 'relative',
          }}
        >
          <MoreHorizontal size={18} />
          <span style={{ fontSize: '11px', fontWeight: 600 }}>More</span>
          {scheduleIssueCount && scheduleIssueCount > 0 ? (
            <span style={{ ...badgeStyle, background: 'rgba(255,69,58,0.12)', color: 'var(--system-red)' }}>
              {scheduleIssueCount}
            </span>
          ) : null}
        </button>
      </nav>

      <div
        aria-hidden="true"
        onClick={() => setMoreOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 55,
          background: 'rgba(0,0,0,0.35)',
          opacity: moreOpen ? 1 : 0,
          pointerEvents: moreOpen ? 'auto' : 'none',
          transition: 'opacity 180ms ease',
        }}
      />

      <aside
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 56,
          transform: moreOpen ? 'translateY(0)' : 'translateY(105%)',
          transition: 'transform 220ms cubic-bezier(0.32, 0.72, 0, 1)',
          background: 'var(--sidebar-bg)',
          borderTopLeftRadius: '18px',
          borderTopRightRadius: '18px',
          borderTop: '1px solid var(--separator)',
          padding: '14px 14px calc(env(safe-area-inset-bottom, 0px) + 18px)',
          boxShadow: 'var(--shadow-overlay)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '4px',
            borderRadius: '999px',
            background: 'var(--fill-quaternary)',
            margin: '0 auto 14px',
          }}
        />
        <div style={{ display: 'grid', gap: '8px' }}>
          {MOBILE_MORE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  minHeight: '52px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0 14px',
                  textDecoration: 'none',
                  color: active ? 'var(--accent)' : 'var(--text-primary)',
                  background: active ? 'var(--accent-fill)' : 'var(--material-thin)',
                }}
              >
                <Icon size={18} />
                <span style={{ flex: 1, fontWeight: 600 }}>{item.label}</span>
                {item.badge === 'errors' && scheduleIssueCount !== null ? (
                  <span style={badgeStyle}>{scheduleIssueCount}</span>
                ) : null}
              </Link>
            );
          })}
          <div
            style={{
              marginTop: '8px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'var(--material-thin)',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
            }}
          >
            {(!settings.portalName || settings.portalName === 'ClawPort')
              ? 'Meeseek Box'
              : settings.portalName}{' '}
            {settings.portalSubtitle ?? 'Intent to outcome'}
          </div>
        </div>
      </aside>
    </>
  );
}

const iconButtonStyle: CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  border: '1px solid var(--separator)',
  background: 'var(--material-thin)',
  color: 'var(--text-primary)',
  display: 'grid',
  placeItems: 'center',
};

const badgeStyle: CSSProperties = {
  position: 'absolute',
  top: '6px',
  right: '8px',
  minWidth: '18px',
  height: '18px',
  borderRadius: '999px',
  padding: '0 6px',
  display: 'grid',
  placeItems: 'center',
  fontSize: '10px',
  fontWeight: 700,
  background: 'var(--fill-quaternary)',
  color: 'var(--text-tertiary)',
};

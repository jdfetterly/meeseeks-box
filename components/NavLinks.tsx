'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { MORE_NAV_ITEMS, PRIMARY_NAV_ITEMS, type NavItemDefinition } from '@/lib/navigation';

interface ScheduleBadgeRecord {
  id: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Nav item definition
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// NavLinks component
// ---------------------------------------------------------------------------

export function NavLinks({
  onOpenSearch,
}: {
  onOpenSearch?: () => void;
}) {
  const pathname = usePathname();
  const [agentCount, setAgentCount] = useState<number | null>(null);
  const [scheduleCount, setScheduleCount] = useState<number | null>(null);
  const [scheduleIssueCount, setScheduleIssueCount] = useState<number | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  // Fetch agent count
  useEffect(() => {
    fetch('/api/agents')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setAgentCount(data.length);
        }
      })
      .catch(() => {
        setAgentCount(null);
      });
  }, []);

  // Fetch canonical schedule issue count
  useEffect(() => {
    fetch('/api/product-state/schedules')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: unknown) => {
        const schedules = Array.isArray(data)
          ? (data as ScheduleBadgeRecord[])
          : ((data as { schedules?: ScheduleBadgeRecord[] })?.schedules ?? []);
        const visibleSchedules = schedules.filter((schedule) => schedule.status !== 'deleted');
        setScheduleCount(visibleSchedules.length);
        setScheduleIssueCount(
          visibleSchedules.filter((schedule) =>
            schedule.status === 'failed' ||
            schedule.status === 'missed' ||
            schedule.status === 'sync_failed',
          ).length,
        );
      })
      .catch(() => {
        setScheduleCount(null);
        setScheduleIssueCount(null);
      });
  }, []);

  // Resolve badge content per nav item
  function getBadge(item: NavItemDefinition): ReactNode {
    if (item.badge === 'agents' && agentCount !== null) {
      return (
        <span
          className="nav-badge"
          style={{
            marginLeft: 'auto',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            padding: '1px 6px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--fill-quaternary)',
            color: 'var(--text-tertiary)',
            lineHeight: '16px',
          }}
        >
          {agentCount}
        </span>
      );
    }
    if (item.badge === 'errors' && scheduleCount !== null) {
      const hasErrors = scheduleIssueCount !== null && scheduleIssueCount > 0;
      return (
        <span
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            className="nav-badge"
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-sm)',
              background: hasErrors ? 'rgba(255,69,58,0.1)' : 'var(--fill-quaternary)',
              color: hasErrors ? 'var(--system-red)' : 'var(--text-tertiary)',
              lineHeight: '16px',
              fontWeight: hasErrors ? 600 : undefined,
            }}
          >
            {hasErrors ? `${scheduleIssueCount} err` : scheduleCount}
          </span>
          {hasErrors && (
            <span
              aria-label={`${scheduleIssueCount} schedule issue${scheduleIssueCount > 1 ? 's' : ''}`}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--system-red)',
                flexShrink: 0,
                animation: 'pulse-red 1.5s ease-in-out infinite',
              }}
            />
          )}
        </span>
      );
    }
    return null;
  }

  return (
    <nav className="flex-1 flex flex-col min-h-0" aria-label="Main navigation">
      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="focus-ring"
          style={{
            width: '100%',
            minHeight: '34px',
            borderRadius: '10px',
            border: '1px solid var(--separator)',
            background: 'var(--material-ultra-thin)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            fontSize: '12px',
            marginBottom: '10px',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Search size={14} />
            Search
          </span>
          <span style={{ color: 'var(--text-quaternary)', fontFamily: 'var(--font-mono)' }}>⌘K</span>
        </button>
        <div className="flex flex-col gap-1.5">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item focus-ring ${isActive ? 'nav-item-active' : ''}`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  minHeight: '38px',
                  padding: '0 9px 0 10px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  background: isActive ? 'color-mix(in srgb, var(--accent-fill) 75%, transparent)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 100ms var(--ease-smooth)',
                }}
              >
                <Icon
                  size={16}
                  style={{
                    flexShrink: 0,
                    color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                    transition: 'color 100ms var(--ease-smooth)',
                  }}
                />
                <span style={{ flex: 1 }}>{item.label}</span>
                {getBadge(item)}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1" />

      <div
        style={{
          borderTop: '1px solid var(--separator)',
          padding: '10px 12px 14px',
          display: 'grid',
          gap: '10px',
        }}
      >
        <Link
          href="/schedules"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textDecoration: 'none',
            color: pathname.startsWith('/schedules') ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: '12px',
            fontWeight: pathname.startsWith('/schedules') ? 600 : 500,
            minHeight: '26px',
          }}
        >
          <span>Schedules</span>
          {getBadge({ href: '/schedules', label: 'Schedules', icon: MORE_NAV_ITEMS[0].icon, badge: 'errors' })}
        </Link>
        <details
          open={moreOpen}
          onToggle={(event) => setMoreOpen((event.currentTarget as HTMLDetailsElement).open)}
          style={{
            border: '1px solid var(--separator)',
            borderRadius: '10px',
            background: 'var(--material-ultra-thin)',
          }}
        >
          <summary
            style={{
              listStyle: 'none',
              cursor: 'pointer',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            More tools
            <ChevronDown
              size={14}
              style={{
                transform: moreOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 120ms var(--ease-smooth)',
              }}
            />
          </summary>
          <div
            style={{
              display: 'grid',
              gap: '8px',
              padding: '0 10px 10px',
            }}
          >
            {MORE_NAV_ITEMS.filter((item) => item.href !== '/schedules').map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontSize: '12px',
                    textDecoration: 'none',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </details>
      </div>
    </nav>
  );
}

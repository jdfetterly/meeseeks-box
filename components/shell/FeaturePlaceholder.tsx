'use client';

import Link from 'next/link';

interface ActionLink {
  href: string;
  label: string;
}

export function FeaturePlaceholder({
  eyebrow,
  title,
  description,
  actions = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ActionLink[];
}) {
  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: 'var(--space-8) var(--space-5) var(--space-12)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '6px 10px',
            borderRadius: 999,
            border: '1px solid var(--separator)',
            background: 'var(--material-regular)',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-caption1)',
            fontWeight: 'var(--weight-semibold)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </div>

        <div
          style={{
            marginTop: 'var(--space-6)',
            background:
              'linear-gradient(135deg, rgba(196, 124, 72, 0.12), rgba(58, 113, 192, 0.08))',
            border: '1px solid var(--separator)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(2rem, 5vw, 3.4rem)',
              lineHeight: 1,
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: 'var(--space-4) 0 0',
              maxWidth: 720,
              fontSize: 'var(--text-body)',
              lineHeight: 'var(--leading-relaxed)',
              color: 'var(--text-secondary)',
            }}
          >
            {description}
          </p>

          {actions.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                marginTop: 'var(--space-6)',
              }}
            >
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="focus-ring"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 42,
                    padding: '0 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--material-thick)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--separator)',
                    textDecoration: 'none',
                    fontSize: 'var(--text-footnote)',
                    fontWeight: 'var(--weight-semibold)',
                  }}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

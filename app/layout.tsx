import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from './providers';
import { SettingsProvider } from './settings-provider';
import { DynamicFavicon } from '@/components/DynamicFavicon';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { LiveStreamWidget } from '@/components/LiveStreamWidget';
import { featureFlags } from '@/lib/feature-flags';
import { ShellLayoutClient } from '@/components/ShellLayoutClient';

export const metadata: Metadata = {
  title: 'Meeseek Box',
  description: 'Operator command center for a Tailnet-only OpenClaw runtime.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SettingsProvider>
            <DynamicFavicon />
            {featureFlags.enableLegacyOnboarding ? <OnboardingWizard /> : null}
            <LiveStreamWidget />
            <ShellLayoutClient>{children}</ShellLayoutClient>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

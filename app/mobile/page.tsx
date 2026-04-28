import type { Metadata } from 'next';
import { MobileApp } from '@/components/mobile/MobileApp';

export const metadata: Metadata = {
  title: 'Meeseeks Box',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
};

export default function MobilePage() {
  return <MobileApp />;
}

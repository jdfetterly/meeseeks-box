import type { Metadata, Viewport } from 'next';
import { MobileApp } from '@/components/mobile/MobileApp';

export const metadata: Metadata = {
  title: 'Meeseeks Box',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function MobilePage() {
  return <MobileApp />;
}

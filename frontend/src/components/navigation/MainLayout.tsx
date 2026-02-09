import { ReactNode } from 'react';
import { BottomTabNav } from './BottomTabNav';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * Main layout wrapper for pages that include bottom tab navigation.
 * Does NOT include ProfileIcon - that should be added in individual pages.
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      <BottomTabNav />
    </div>
  );
}

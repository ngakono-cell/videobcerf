/**
 * DesktopLayout – Wrapper qui ajoute automatiquement la WebSidebar sur desktop.
 *
 * Usage :
 *   import DesktopLayout from '@/components/DesktopLayout';
 *
 *   export default function MonEcran() {
 *     return (
 *       <DesktopLayout>
 *         <MonContenu />
 *       </DesktopLayout>
 *     );
 *   }
 *
 * Sur mobile (width < 768) → affiche uniquement les enfants.
 * Sur desktop (width >= 768) → sidebar gauche + contenu à droite.
 */
import React from 'react';
import { View } from 'react-native';
import WebSidebar from '@/components/WebSidebar';
import { useDesktop } from '@/hooks/useDesktop';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  const isDesktop = useDesktop();

  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <WebSidebar />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

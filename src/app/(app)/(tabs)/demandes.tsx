import { useSession } from '@/ctx';
import DemandesAppelScreen from '@/components/screens/DemandesAppelScreen';
import DesktopLayout from '@/components/DesktopLayout';

export default function DemandesTab() {
  const { role } = useSession();
  if (role === 'type1') return null;

  return (
    <DesktopLayout>
      <DemandesAppelScreen />
    </DesktopLayout>
  );
}

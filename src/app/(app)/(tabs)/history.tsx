import { useSession } from '@/ctx';
import CallHistoryScreen from '@/components/screens/CallHistoryScreen';
import DesktopLayout from '@/components/DesktopLayout';

export default function HistoryTab() {
  const { role } = useSession();
  if (role !== 'type2') return null;

  return (
    <DesktopLayout>
      <CallHistoryScreen />
    </DesktopLayout>
  );
}

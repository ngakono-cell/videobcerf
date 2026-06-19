import { useSession } from '@/ctx';
import MessagesScreen from '@/components/screens/MessagesScreen';
import DesktopLayout from '@/components/DesktopLayout';

export default function MessagesTab() {
  const { role } = useSession();
  if (role !== 'type1') return null;

  return (
    <DesktopLayout>
      <MessagesScreen />
    </DesktopLayout>
  );
}

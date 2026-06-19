import { useSession } from '@/ctx';
import AdminUsers from '@/components/screens/AdminUsers';
import DesktopLayout from '@/components/DesktopLayout';

export default function UsersTab() {
  const { role } = useSession();
  if (role !== 'admin') return null;

  return (
    <DesktopLayout>
      <AdminUsers />
    </DesktopLayout>
  );
}

/** Main tab home – renders role-appropriate home screen */
import { useSession } from '@/ctx';
import AdminDashboard from '@/components/screens/AdminDashboard';
import Type2SearchScreen from '@/components/screens/Type2Search';
import Type1Home from '@/components/screens/Type1Home';
import DesktopLayout from '@/components/DesktopLayout';

export default function TabIndex() {
  const { role } = useSession();

  const content =
    role === 'admin' ? <AdminDashboard /> :
    role === 'type2' ? <Type2SearchScreen /> :
    <Type1Home />;

  return <DesktopLayout>{content}</DesktopLayout>;
}

import { useSession } from '@/ctx';
import AdminCallLogs from '@/components/screens/AdminCallLogs';
import AgentCallJournal from '@/components/screens/AgentCallJournal';
import DesktopLayout from '@/components/DesktopLayout';

export default function CallLogsTab() {
  const { role } = useSession();

  if (role === 'type1' || role === 'type2') {
    return <DesktopLayout><AgentCallJournal /></DesktopLayout>;
  }

  if (role === 'admin') {
    return <DesktopLayout><AdminCallLogs /></DesktopLayout>;
  }

  return null;
}

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import EmployeeShell from '@/components/EmployeeShell';

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'EMPLOYEE') redirect('/login');

  return <EmployeeShell nome={session.nome}>{children}</EmployeeShell>;
}

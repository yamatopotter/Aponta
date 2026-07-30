import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function Home() {
  const session = await getSession();
  if (session?.role === 'ADMIN') redirect('/admin/justificativas');
  if (session?.role === 'EMPLOYEE') redirect('/ponto');
  redirect('/login');
}


import AppPage from '@/components/AppPage';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/firebase';


export default function Home() {
  if (!auth.currentUser) {
    redirect('/login')
  }
  return <AppPage />;
}

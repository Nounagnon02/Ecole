import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import Header from './Header';
import Breadcrumb from '@/shared/components/ui/Breadcrumb';
import { LoadingSpinner } from '@/shared/components/ui/Skeleton';
import useUIStore from '@/shared/stores/ui-store';
import useAuthStore from '@/shared/stores/auth-store';
import useRealtimeStore from '@/shared/stores/realtime-store';
import { startOfflineSync } from '@/shared/lib/offline-queue';
import { useTranslation } from '@/shared/i18n';

/** Socle C commun à toutes les pages : navigation, réseau et zone de travail fluide. */
export default function AppShell({ children }) {
  const { t } = useTranslation();
  const globalLoading = useUIStore(s => s.globalLoading);
  const user = useAuthStore(s => s.user);
  const { connect, listenForNotifications, listenForMessages } = useRealtimeStore();
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    if (!user?.id) return;
    connect(); listenForNotifications(user.id); listenForMessages(user.id);
  }, [user?.id, connect, listenForNotifications, listenForMessages]);
  useEffect(() => startOfflineSync(), []);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--text-primary)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[9999] focus:rounded-md focus:bg-[var(--action)] focus:px-4 focus:py-3 focus:text-white">{t('app_shell.aller_au_contenu_principal')}</a>
      <Header />
      {!online && <div role="status" className="ecole-network"><WifiOff size={18} aria-hidden="true" /><span>{t('c.offline')}</span></div>}
      <main id="main-content" tabIndex={-1} className="ecole-main">
        <Breadcrumb />
        {globalLoading ? <LoadingSpinner /> : children || <Outlet />}
      </main>
    </div>
  );
}

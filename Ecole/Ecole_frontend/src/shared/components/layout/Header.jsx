import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, Bell, LogOut, Settings, ChevronDown, Moon, Sun, MoreHorizontal } from 'lucide-react';
import useAuthStore from '@/shared/stores/auth-store';
import useUIStore from '@/shared/stores/ui-store';
import useRealtimeStore from '@/shared/stores/realtime-store';
import { ROLE_LABELS } from '@/shared/types/roles';
import { ROLE_REDIRECT_MAP } from '@/features/roles/route-config';
import { getRoleNavigation } from '@/features/roles/navigation-config';
import { useTranslation } from '@/shared/i18n';
import Brand from '@/shared/components/ui/Brand';
import LanguageSwitcher from './LanguageSwitcher';

/** Navigation C : les modules supplémentaires restent accessibles dans « Plus ». */
export default function Header() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, toggleCommandPalette } = useUIStore();
  const notifications = useRealtimeStore(s => s.notifications);
  const { t, locale } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const ref = useRef(null);
  const menuButton = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const items = useMemo(() => getRoleNavigation(user?.role), [user?.role]);
  const visible = items.slice(0, 6);
  const overflow = items.slice(6);
  const moreActive = overflow.some(item => location.pathname === item.path);
  const name = user?.name || [user?.prenom, user?.nom].filter(Boolean).join(' ') || t('common.user');
  const school = user?.ecole?.nom || user?.ecole?.name || user?.ecole?.nom_ecole;
  const unread = notifications.filter(n => !n.read_at).length;
  const isDark = theme === 'dark' || (theme === 'system' && document.documentElement.classList.contains('dark'));

  useEffect(() => {
    setMobileOpen(false);
    ref.current?.querySelectorAll('details[open]').forEach(details => { details.open = false; });
  }, [location.pathname]);
  useEffect(() => {
    const dismiss = event => {
      ref.current?.querySelectorAll('details[open]').forEach(details => {
        if (event.type === 'keydown' || !details.contains(event.target)) {
          details.open = false;
          if (event.type === 'keydown') details.querySelector('summary')?.focus();
        }
      });
      if (event.type === 'keydown') {
        setMobileOpen(false);
        if (mobileOpen) menuButton.current?.focus();
      } else if (!ref.current?.contains(event.target)) setMobileOpen(false);
    };
    const keydown = event => { if (event.key === 'Escape') dismiss(event); };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', keydown); };
  }, [mobileOpen]);

  const links = list => list.map(({ path, label, icon: Icon }) => (
    <NavLink key={path} to={path} end className="ecole-nav-link">
      <Icon size={17} aria-hidden="true" /><span>{t(label)}</span>
    </NavLink>
  ));

  return (
    <header className="ecole-header" ref={ref}>
      <div className="ecole-header-top">
        {/* Nom accessible = texte visible (« École ») suivi de la destination :
            un aria-label « Tableau de bord » masquait le texte lu à l'écran. */}
        <Link to={ROLE_REDIRECT_MAP[user?.role] || '/'}><Brand /><span className="sr-only"> — {t('nav.dashboard')}</span></Link>
        <div className="ecole-school"><p>{school || t('c.school_space')}</p><p>{ROLE_LABELS[user?.role] || user?.role}</p></div>
        <div className="ecole-header-actions">
          <button type="button" className="ecole-header-button" onClick={toggleCommandPalette} aria-label={t('header.search')}>
            <Search size={19} aria-hidden="true" /><span className="ecole-header-search-label text-sm">{t('common.search')}</span>
          </button>
          <div className="ecole-header-language"><LanguageSwitcher className="!text-inherit min-h-11" /></div>
          <button type="button" className="ecole-header-button" onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label={t('header.toggle_theme')}>
            {isDark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
          </button>
          <details className="relative">
            <summary className="ecole-header-button list-none relative" aria-label={t('header.notifications')}>
              <Bell size={19} aria-hidden="true" />
              {unread > 0 && <span className="absolute top-0 end-0 rounded bg-[var(--highlight)] text-[#17302e] px-1 text-xs font-bold">{unread}</span>}
            </summary>
            <div className="ecole-popover" aria-label={t('header.notifications')}>
              <p className="px-3 py-2 font-semibold">{t('header.notifications')}</p>
              {notifications.length === 0 ? <p className="px-3 py-4 text-sm text-[var(--text-secondary)]">{t('c.no_notifications')}</p> : notifications.map((n,i) => (
                <article key={n.id || i} className="border-t border-[var(--border-light)] p-3">
                  <p className="text-sm">{n.title || n.message}</p>
                  {n.created_at && !Number.isNaN(Date.parse(n.created_at)) && <time className="text-xs text-[var(--text-secondary)]" dateTime={n.created_at}>{new Intl.DateTimeFormat(locale, { dateStyle:'short', timeStyle:'short' }).format(new Date(n.created_at))}</time>}
                </article>
              ))}
            </div>
          </details>
          <details className="relative">
            <summary className="ecole-header-button list-none" aria-label={t('c.account')}>
              <span className="flex size-8 items-center justify-center rounded bg-white/15 font-semibold" aria-hidden="true">{name[0]?.toUpperCase()}</span>
              <span className="ecole-header-user-label max-w-36 truncate text-sm">{name}</span><ChevronDown size={14} aria-hidden="true" />
            </summary>
            <div className="ecole-popover">
              <p className="px-3 py-2 font-semibold break-words">{name}</p>
              <p className="px-3 pb-3 text-sm text-[var(--text-secondary)]">{ROLE_LABELS[user?.role] || user?.role}</p>
              <Link to="/parametres"><Settings size={17} aria-hidden="true" />{t('header.parametres')}</Link>
              <button type="button" disabled={loggingOut} className="text-[var(--red)]" onClick={async () => { setLoggingOut(true); try { await logout(); navigate('/connexion'); } finally { setLoggingOut(false); } }}><LogOut size={17} aria-hidden="true" />{t('auth.logout')}</button>
            </div>
          </details>
          <button ref={menuButton} type="button" className="ecole-header-button ecole-mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-controls="mobile-navigation" aria-label={mobileOpen ? t('common.close') : t('header.toggle_menu')}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <nav className="ecole-navigation" aria-label={t('sidebar.navigation_principale')}>
        <div className="ecole-navigation-inner">
          {links(visible)}
          {overflow.length > 0 && <details className="relative">
            <summary className={'ecole-nav-link list-none cursor-pointer ' + (moreActive ? 'is-active' : '')}><MoreHorizontal size={18} aria-hidden="true" />{t('c.more')}<ChevronDown size={14} aria-hidden="true" /></summary>
            <div className="ecole-popover">{links(overflow)}</div>
          </details>}
        </div>
      </nav>
      {mobileOpen && <nav id="mobile-navigation" className="ecole-mobile-navigation lg:hidden" aria-label={t('sidebar.navigation_principale')}>
        {links(items)}<LanguageSwitcher />
      </nav>}
    </header>
  );
}

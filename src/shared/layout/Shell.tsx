import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SideSheet } from '../ui/Overlay';
import Header from './Header';
import SidebarContent from './Sidebar';
import GlobalSearch from './GlobalSearch';
import NotificationDrawer from './NotificationDrawer';

/** The frame of every screen: skip link, menu, header, and the page area. */
export default function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const main = useRef<HTMLElement>(null);
  const location = useLocation();
  const first = useRef(true);

  // After moving to another page, put keyboard and screen reader focus at the start of the page.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    main.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen bg-app lg:flex">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <aside aria-label="Sidebar" className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-warm-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      <SideSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" size="sm" closeOnBackdrop>
        <div className="-mx-4 -my-4 sm:-mx-6">
          <SidebarContent onNavigate={() => setMenuOpen(false)} />
        </div>
      </SideSheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setMenuOpen(true)} onSearch={() => setSearchOpen(true)} onNotifications={() => setNotificationsOpen(true)} />
        <main id="main" ref={main} tabIndex={-1} className="flex-1 outline-none">
          <Outlet />
        </main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationDrawer open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
}

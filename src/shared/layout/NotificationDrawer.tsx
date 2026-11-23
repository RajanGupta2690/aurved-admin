import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { inboxActions, inboxStore, pendingCount } from '../../core/api/inboxStore';
import { useStore } from '../../core/api/persistedStore';
import { usePortal } from '../../core/context/portalContext';
import Button from '../ui/Button';
import { EmptyState } from '../ui/Feedback';
import { Drawer } from '../ui/Overlay';
import { cn } from '../ui/cn';
import { useCoveredInstitutionIds } from './hooks';

/** Notifications for the institution (or all institutions of an organization). Opening one marks it read. */
export default function NotificationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { path, institutions } = usePortal();
  const inbox = useStore(inboxStore);
  const ids = useCoveredInstitutionIds();
  const items = inbox.filter((item) => ids.includes(item.instId) && item.kind === 'notification').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = items.filter((item) => item.status === 'unread').length;
  const waiting = ids.reduce((sum, id) => sum + pendingCount(inbox, id), 0);
  const nameOf = (instId: string) => institutions.find((candidate) => candidate.id === instId)?.shortName ?? instId;

  return (
    <Drawer open={open} onClose={onClose} title="Notifications" description={unread > 0 ? `${unread} unread` : 'You are up to date'} size="sm" closeOnBackdrop>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link to={path('inbox')} onClick={onClose} className="text-sm font-medium text-primary-700 hover:underline">
            Tasks and approvals ({waiting} waiting)
          </Link>
          <Button size="sm" disabled={unread === 0} onClick={() => ids.forEach((id) => inboxActions.markAllRead(id))}>
            Mark all as read
          </Button>
        </div>
        {items.length === 0 ? (
          <EmptyState icon={<Bell size={32} />} title="No notifications" description="New alerts for this place will appear here." />
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => inboxActions.markRead(item.id)} className={cn('w-full rounded-xl border p-3 text-left', item.status === 'unread' ? 'border-primary-200 bg-primary-50' : 'border-warm-200 bg-white')}>
                  <span className="flex items-start gap-2">
                    {item.status === 'unread' && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-700" aria-label="Unread" />}
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-charcoal-900">{item.title}</span>
                      <span className="block text-sm text-charcoal-700">{item.detail}</span>
                      <span className="mt-1 block text-xs text-charcoal-500">
                        {item.createdAt}
                        {ids.length > 1 ? ` · ${nameOf(item.instId)}` : ''}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  );
}

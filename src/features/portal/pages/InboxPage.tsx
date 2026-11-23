import { useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import { inboxActions, inboxStore } from '../../../core/api/inboxStore';
import type { InboxItem } from '../../../core/api/inboxStore';
import { useStore } from '../../../core/api/persistedStore';
import { usePortal } from '../../../core/context/portalContext';
import { useCoveredInstitutionIds } from '../../../shared/layout/hooks';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge, StatusBadge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import { EmptyState } from '../../../shared/ui/Feedback';
import { PageHeader, TabPanel, Tabs } from '../../../shared/ui/Layout';
import { useToast } from '../../../shared/ui/toastContext';

type TabId = 'approvals' | 'tasks' | 'notifications' | 'history';

export default function InboxPage() {
  const { can, persona, institutions } = usePortal();
  const toast = useToast();
  const inbox = useStore(inboxStore);
  const ids = useCoveredInstitutionIds();
  const [tab, setTab] = useState<TabId>('approvals');
  const [rejecting, setRejecting] = useState<InboxItem | null>(null);

  const mine = inbox.filter((item) => ids.includes(item.instId));
  const approvals = mine.filter((item) => item.kind === 'approval' && item.status === 'pending');
  const tasks = mine.filter((item) => item.kind === 'task' && item.status === 'pending');
  const notifications = mine.filter((item) => item.kind === 'notification').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const history = mine.filter((item) => ['approved', 'rejected', 'done'].includes(item.status)).sort((a, b) => (b.decidedAt ?? '').localeCompare(a.decidedAt ?? ''));

  const mayApprove = can('inbox.tasks.approve').allowed;
  const mayReject = can('inbox.tasks.reject').allowed;
  const mayEdit = can('inbox.tasks.edit').allowed;
  const nameOf = (instId: string) => institutions.find((candidate) => candidate.id === instId)?.shortName ?? instId;
  const multi = ids.length > 1;

  const Meta = ({ item }: { item: InboxItem }) => (
    <p className="mt-1 text-xs text-charcoal-600">
      {item.from ? `From ${item.from} · ` : ''}
      Received {item.createdAt}
      {item.due ? ` · Due ${item.due}` : ''}
      {multi ? ` · ${nameOf(item.instId)}` : ''}
    </p>
  );

  return (
    <PageContainer>
      <PageHeader title="Tasks and approvals" description="Things that wait for you. Decisions are recorded with your name and the time." eyebrow="SH-05" />

      <Tabs
        label="Inbox sections"
        value={tab}
        onChange={(id) => setTab(id as TabId)}
        items={[
          { id: 'approvals', label: 'Approvals', badge: approvals.length },
          { id: 'tasks', label: 'Tasks', badge: tasks.length },
          { id: 'notifications', label: 'Notifications', badge: notifications.filter((item) => item.status === 'unread').length },
          { id: 'history', label: 'History', badge: history.length },
        ]}
      />

      <TabPanel id="approvals" value={tab}>
        {approvals.length === 0 ? (
          <EmptyState title="No approvals waiting" description="Requests that need a decision appear here." />
        ) : (
          <ul className="space-y-3">
            {approvals.map((item) => (
              <li key={item.id} className="card !p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-charcoal-950">{item.title}</p>
                    <p className="mt-1 text-sm text-charcoal-700">{item.detail}</p>
                    <Meta item={item} />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Check size={16} aria-hidden="true" />}
                      disabled={!mayApprove}
                      title={mayApprove ? undefined : 'Your role can view this request but not approve it.'}
                      onClick={() => {
                        inboxActions.decide(item.id, 'approved', persona.name);
                        toast.success(`Approved: ${item.title}`);
                      }}
                    >
                      Approve
                    </Button>
                    <Button size="sm" icon={<X size={16} aria-hidden="true" />} disabled={!mayReject} title={mayReject ? undefined : 'Your role cannot reject requests.'} onClick={() => setRejecting(item)}>
                      Reject
                    </Button>
                  </div>
                </div>
                {!mayApprove && <p className="mt-3 text-xs text-charcoal-600">You can read this request. Your role does not include the decision.</p>}
              </li>
            ))}
          </ul>
        )}
      </TabPanel>

      <TabPanel id="tasks" value={tab}>
        {tasks.length === 0 ? (
          <EmptyState title="No open tasks" description="Work assigned to this place appears here." />
        ) : (
          <ul className="space-y-3">
            {tasks.map((item) => (
              <li key={item.id} className="card !p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-charcoal-950">{item.title}</p>
                    <p className="mt-1 text-sm text-charcoal-700">{item.detail}</p>
                    <Meta item={item} />
                  </div>
                  <Button
                    size="sm"
                    icon={<Check size={16} aria-hidden="true" />}
                    disabled={!mayEdit}
                    onClick={() => {
                      inboxActions.complete(item.id, persona.name);
                      toast.success(`Marked done: ${item.title}`);
                    }}
                  >
                    Mark done
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </TabPanel>

      <TabPanel id="notifications" value={tab}>
        {notifications.length === 0 ? (
          <EmptyState title="No notifications" />
        ) : (
          <ul className="space-y-3">
            {notifications.map((item) => (
              <li key={item.id} className="card !p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold text-charcoal-950">
                      {item.title}
                      {item.status === 'unread' && <Badge tone="brand">New</Badge>}
                    </p>
                    <p className="mt-1 text-sm text-charcoal-700">{item.detail}</p>
                    <Meta item={item} />
                  </div>
                  {item.status === 'unread' && (
                    <Button size="sm" onClick={() => inboxActions.markRead(item.id)}>
                      Mark as read
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </TabPanel>

      <TabPanel id="history" value={tab}>
        {history.length === 0 ? (
          <EmptyState title="No decisions yet" description="Approved, rejected and finished items are listed here, newest first." />
        ) : (
          <ul className="space-y-3">
            {history.map((item) => (
              <li key={item.id} className="card !p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-charcoal-950">
                      {item.title}
                      <StatusBadge status={item.status} />
                    </p>
                    <p className="mt-1 text-sm text-charcoal-700">{item.detail}</p>
                    <p className="mt-1 text-xs text-charcoal-600">
                      {item.status === 'done' ? 'Finished' : 'Decided'} by {item.decidedBy ?? 'unknown'} on {item.decidedAt?.slice(0, 16).replace('T', ' ')}
                      {multi ? ` · ${nameOf(item.instId)}` : ''}
                    </p>
                    {item.reason && <p className="mt-1 text-sm text-charcoal-800">Reason: {item.reason}</p>}
                  </div>
                  <Button size="sm" icon={<RotateCcw size={16} aria-hidden="true" />} disabled={!mayApprove} title={mayApprove ? undefined : 'Only someone who can approve may reopen an item.'} onClick={() => { inboxActions.reopen(item.id); toast.info(`Reopened: ${item.title}`); }}>
                    Reopen
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </TabPanel>

      <ConfirmDialog
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        title="Reject this request"
        message="The requester will see the reason."
        itemName={rejecting?.title}
        confirmLabel="Reject"
        requireReason
        reasonLabel="Reason for rejecting"
        onConfirm={(reason) => {
          if (!rejecting) return;
          inboxActions.decide(rejecting.id, 'rejected', persona.name, reason);
          toast.warning(`Rejected: ${rejecting.title}`);
        }}
      />
    </PageContainer>
  );
}

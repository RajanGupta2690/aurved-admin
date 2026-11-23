import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { inboxActions } from '../../../core/api/inboxStore';
import { usePortal } from '../../../core/context/portalContext';
import { LINK_STATUS_LABEL, OPEN_LINK_STATUSES } from '../../../core/org/model';
import { approveLink, consentLink, rejectLink, setChecklist, withdrawLink } from '../../../core/org/ops';
import { RELATIONSHIP_HELP, formatDate } from '../../../core/org/rules';
import { PROFILE_LABEL, RELATIONSHIP_LABEL } from '../../../core/org/types';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import { CheckboxField } from '../../../shared/ui/Field';
import { Alert, EmptyState } from '../../../shared/ui/Feedback';
import { Card, DescriptionList, PageHeader, Stepper, Timeline } from '../../../shared/ui/Layout';
import type { TimelineItem } from '../../../shared/ui/Layout';
import { useApply, useOrgData, useWorld } from '../hooks';
import { LINK_TONE, notifyOrganization } from '../linkUi';

type Pending = 'accept' | 'decline' | 'approve' | 'reject' | 'withdraw';

/** ORG-09 detail. A full page, because the flow has several steps, people and documents. */
export default function LinkRequestPage() {
  const { id } = useParams();
  const { scope, org, inst, can, canIn, path } = usePortal();
  const { organizations, institutions } = useOrgData();
  const world = useWorld();
  const apply = useApply();
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState('');

  const link = world.links.find((item) => item.id === id);
  const visible = link && (scope === 'org' ? link.parentOrgId === org.id : link.childInstId === inst?.id);
  const back = path('link-requests');

  if (!link || !visible) {
    return (
      <PageContainer>
        <EmptyState title="Request not found" description="It does not exist, or it belongs to another organization." action={<Link to={back} className="btn-secondary">Back to linking requests</Link>} />
      </PageContainer>
    );
  }

  const child = institutions.find((item) => item.id === link.childInstId);
  const parent = organizations.find((item) => item.id === link.parentOrgId);
  const childName = child?.name ?? link.childInstId;
  const parentName = parent?.name ?? link.parentOrgId;
  const open = OPEN_LINK_STATUSES.includes(link.status);

  // The organization side verifies and decides. The institution side accepts and can withdraw its own application.
  const orgSideVerifies = scope === 'org' && can('org.relationships.edit').allowed;
  const orgSideDecides = scope === 'org' && can('org.relationships.approve').allowed;
  const childMayAnswer = canIn('institution.links.approve', link.childInstId).allowed && scope === 'inst';
  const mayWithdraw = link.direction === 'invite' ? scope === 'org' && can('org.relationships.create').allowed : scope === 'inst' && canIn('institution.links.create', link.childInstId).allowed;

  const steps = link.direction === 'invite' ? ['Invited', 'Accepted', 'Documents verified', 'Approved'] : ['Applied', 'Documents verified', 'Approved'];
  const stepIndex = (() => {
    const base = link.direction === 'invite' ? 1 : 0;
    switch (link.status) {
      case 'awaiting_consent':
        return 1;
      case 'in_verification':
        return base + 1;
      case 'awaiting_approval':
        return base + 2;
      case 'approved':
        return steps.length;
      default:
        return Math.max(0, link.events.length > 1 ? base + 1 : base);
    }
  })();

  const doneCount = link.checklist.filter((item) => item.done).length;
  const timeline: TimelineItem[] = [...link.events].reverse().map((event) => ({
    id: event.id,
    title: event.action,
    meta: `${event.byName} · ${formatDate(event.at)}`,
    description: event.note,
    tone: /Rejected|Declined|Withdrew/.test(event.action) ? 'danger' : /Approved|Accepted/.test(event.action) ? 'success' : 'neutral',
  }));

  const run = (reason: string) => {
    if (!pending) return;
    const finishedText: Record<Pending, string> = {
      accept: 'Invitation accepted.',
      decline: 'Invitation declined.',
      approve: `${child?.shortName} is now linked to ${parentName}.`,
      reject: 'Request rejected.',
      withdraw: 'Request withdrawn.',
    };
    const result = apply((snap, now, actor) => {
      switch (pending) {
        case 'accept':
          return consentLink(snap, link.id, true, actor, now);
        case 'decline':
          return consentLink(snap, link.id, false, actor, now, reason);
        case 'approve':
          return approveLink(snap, link.id, actor, now);
        case 'reject':
          return rejectLink(snap, link.id, actor, now, reason);
        default:
          return withdrawLink(snap, link.id, actor, now, reason);
      }
    }, finishedText[pending]);
    setError(result.ok ? '' : result.error);
    if (result.ok) {
      // The other side hears about it.
      const toChild = scope === 'org';
      const verb = { accept: 'accepted the invitation', decline: 'declined the invitation', approve: 'approved the link', reject: 'rejected the request', withdraw: 'withdrew the request' }[pending];
      if (toChild && child) inboxActions.notify(child.id, `${parentName} ${verb}`, `Request ${link.id}.`);
      else notifyOrganization(institutions, link.parentOrgId, `${childName} ${verb}`, `Request ${link.id}.`);
    }
  };

  const toggle = (itemId: string, done: boolean) => {
    const result = apply((snap, now, actor) => setChecklist(snap, link.id, itemId, done, actor, now));
    setError(result.ok ? '' : result.error);
  };

  const dialogCopy: Record<Pending, { title: string; message: string; label: string; tone: 'danger' | 'primary'; reason: boolean }> = {
    accept: { title: 'Accept the invitation', message: `${childName} agrees to be linked to ${parentName} as ${RELATIONSHIP_LABEL[link.relationship].toLowerCase()}. ${parentName} will then verify the documents.`, label: 'Accept', tone: 'primary', reason: false },
    decline: { title: 'Decline the invitation', message: 'The request is closed. Nothing changes for the institution.', label: 'Decline', tone: 'danger', reason: true },
    approve: { title: 'Approve and link', message: `${childName} moves into ${parentName} as ${RELATIONSHIP_LABEL[link.relationship].toLowerCase()}. Its records stay with it. ${RELATIONSHIP_HELP[link.relationship].sees}`, label: 'Approve and link', tone: 'primary', reason: false },
    reject: { title: 'Reject the request', message: 'The request is closed and the institution is told.', label: 'Reject', tone: 'danger', reason: true },
    withdraw: { title: 'Withdraw the request', message: 'The request is closed. Nobody else is asked anything.', label: 'Withdraw', tone: 'danger', reason: true },
  };
  const copy = pending ? dialogCopy[pending] : null;

  return (
    <PageContainer>
      <PageHeader
        title={`Request ${link.id}`}
        eyebrow="ORG-09"
        description={`${childName} and ${parentName}, as ${RELATIONSHIP_LABEL[link.relationship].toLowerCase()}.`}
        breadcrumbs={[{ label: inst?.shortName ?? org.name, to: path() }, { label: 'Linking requests', to: back }, { label: link.id }]}
        actions={<Badge tone={LINK_TONE[link.status]}>{LINK_STATUS_LABEL[link.status]}</Badge>}
      />
      <div className="mb-6 overflow-x-auto">
        <Stepper steps={steps} current={stepIndex} />
      </div>
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {link.status === 'approved' && (
        <Alert tone="success" title="Linked" className="mb-4">
          {childName} now belongs to {parentName}.{' '}
          {scope === 'org' && (
            <Link to={path('relationships')} className="font-medium underline">
              See relationships
            </Link>
          )}
        </Alert>
      )}
      {link.status === 'awaiting_consent' && (
        <Alert tone="warning" title="Waiting for the institution" className="mb-4">
          {childName} must accept the invitation before documents are checked.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Documents to verify" description={`${doneCount} of ${link.checklist.length} verified. Every document is needed before approval.`}>
            <ul className="space-y-3">
              {link.checklist.map((item) => (
                <li key={item.id}>
                  <CheckboxField
                    label={item.label}
                    checked={item.done}
                    onChange={(checked) => toggle(item.id, checked)}
                    disabled={!orgSideVerifies || !(link.status === 'in_verification' || link.status === 'awaiting_approval')}
                    hint={item.done && item.doneBy ? `Verified by ${item.doneBy}${item.doneAt ? `, ${formatDate(item.doneAt)}` : ''}` : undefined}
                  />
                </li>
              ))}
            </ul>
            {!orgSideVerifies && open && link.status !== 'awaiting_consent' && <p className="mt-4 text-sm text-charcoal-600">Only {parentName} verifies documents.</p>}
          </Card>

          <Card title="What happens">
            <ul className="list-disc space-y-1 pl-5 text-sm text-charcoal-700">
              <li>{RELATIONSHIP_HELP[link.relationship].summary}</li>
              <li>{RELATIONSHIP_HELP[link.relationship].sees}</li>
              <li>The institution moves into the organization. Its students, staff and records stay with it.</li>
              <li>Everything is written to the change history.</li>
            </ul>
          </Card>

          <Card title="Activity">
            <Timeline items={timeline} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Decision">
            {!open ? (
              <p className="text-sm text-charcoal-700">This request is finished: {LINK_STATUS_LABEL[link.status].toLowerCase()}.</p>
            ) : (
              <div className="space-y-3">
                {link.status === 'awaiting_consent' && (
                  <>
                    <Button variant="primary" className="w-full" onClick={() => { setError(''); setPending('accept'); }} disabled={!childMayAnswer}>
                      Accept invitation
                    </Button>
                    <Button className="w-full" onClick={() => { setError(''); setPending('decline'); }} disabled={!childMayAnswer}>
                      Decline
                    </Button>
                    {!childMayAnswer && <p className="text-sm text-charcoal-600">Only an administrator of {childName} can answer.</p>}
                  </>
                )}
                {(link.status === 'in_verification' || link.status === 'awaiting_approval') && (
                  <>
                    <Button variant="primary" className="w-full" onClick={() => { setError(''); setPending('approve'); }} disabled={!orgSideDecides || link.status !== 'awaiting_approval'}>
                      Approve and link
                    </Button>
                    <Button className="w-full" onClick={() => { setError(''); setPending('reject'); }} disabled={!orgSideDecides}>
                      Reject
                    </Button>
                    {link.status === 'in_verification' && <p className="text-sm text-charcoal-600">Verify every document to unlock approval.</p>}
                    {!orgSideDecides && <p className="text-sm text-charcoal-600">Only {parentName} approves or rejects.</p>}
                  </>
                )}
                <Button variant="ghost" className="w-full" onClick={() => { setError(''); setPending('withdraw'); }} disabled={!mayWithdraw}>
                  Withdraw request
                </Button>
              </div>
            )}
          </Card>
          <Card title="Details">
            <DescriptionList
              columns={1}
              items={[
                { label: 'Institution', value: `${childName}${child ? ` (${PROFILE_LABEL[child.profile]}, ${child.city})` : ''}` },
                { label: 'Organization', value: parentName },
                { label: 'Relationship', value: RELATIONSHIP_LABEL[link.relationship] },
                { label: 'Started as', value: link.direction === 'invite' ? 'Invitation by the organization' : 'Application by the institution' },
                { label: 'Started by', value: `${link.createdByName}, ${formatDate(link.createdAt)}` },
                { label: 'Note', value: link.note },
              ]}
            />
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={run}
        title={copy?.title ?? ''}
        message={copy?.message ?? ''}
        confirmLabel={copy?.label}
        tone={copy?.tone}
        requireReason={copy?.reason}
      />
    </PageContainer>
  );
}

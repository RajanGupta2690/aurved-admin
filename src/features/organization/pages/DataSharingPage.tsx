import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortal } from '../../../core/context/portalContext';
import { SHARE_DOMAINS, SHARE_LEVEL_LABEL, SHARE_LEVEL_RANK } from '../../../core/org/model';
import type { ShareLevel } from '../../../core/org/model';
import { answerAgreementRequest, requestAgreement, setAgreementLevel } from '../../../core/org/ops';
import { agreementOf, formatDate, isExternal, shareLevelFor } from '../../../core/org/rules';
import { RELATIONSHIP_LABEL } from '../../../core/org/types';
import type { Institution } from '../../../core/org/types';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField } from '../../../shared/ui/Field';
import { Alert, EmptyState } from '../../../shared/ui/Feedback';
import { Card, PageHeader } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { inboxActions } from '../../../core/api/inboxStore';
import { useApply, useOrgData, useWorld } from '../hooks';

const LEVELS: ShareLevel[] = ['none', 'summary', 'full'];
const TONE = { none: 'neutral', summary: 'info', full: 'success' } as const;

/**
 * ORG-11. An institution that runs independently decides what its parent organization sees.
 * Nothing is shared until the institution agrees. The parent can ask for more.
 */
export default function DataSharingPage() {
  const { scope } = usePortal();
  return scope === 'org' ? <OrganizationView /> : <InstitutionView />;
}

function OrganizationView() {
  const { org, can, path } = usePortal();
  const { institutions } = useOrgData();
  const world = useWorld();
  const apply = useApply();
  const [asking, setAsking] = useState<Institution | null>(null);
  const [wanted, setWanted] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const externals = institutions.filter((inst) => inst.orgId === org.id && isExternal(inst));
  const governedCount = institutions.filter((inst) => inst.orgId === org.id && !isExternal(inst)).length;
  const canAsk = can('institution.sharing.create').allowed;

  const submit = () => {
    if (!asking) return;
    const requests = SHARE_DOMAINS.filter((domain) => wanted[domain.key]).map((domain) => ({ domain: domain.key, level: wanted[domain.key] as ShareLevel }));
    const result = apply((snap, now, actor) => requestAgreement(snap, asking.id, requests, actor, now), 'Request sent.');
    if (!result.ok) return setError(result.error);
    inboxActions.notify(asking.id, `${org.name} asks for more data access`, 'Open Data sharing to accept or decline each request.');
    setAsking(null);
    setWanted({});
  };

  const columns: Column<Institution>[] = [
    { key: 'name', header: 'Institution', sortable: true, accessor: (row) => row.shortName, cell: (row) => <span className="font-medium text-charcoal-900">{row.shortName}</span> },
    { key: 'relationship', header: 'Relationship', sortable: true, accessor: (row) => RELATIONSHIP_LABEL[row.relationship?.type ?? 'member'] },
    ...SHARE_DOMAINS.map(
      (domain): Column<Institution> => ({
        key: domain.key,
        header: domain.label,
        accessor: (row) => SHARE_LEVEL_LABEL[shareLevelFor(world, row, domain.key)],
        cell: (row) => {
          const level = shareLevelFor(world, row, domain.key);
          const asked = agreementOf(world.agreements, row.id, domain.key)?.requested;
          return (
            <span className="flex flex-col items-start gap-1">
              <Badge tone={TONE[level]}>{SHARE_LEVEL_LABEL[level]}</Badge>
              {asked && <span className="text-xs text-charcoal-600">Asked for: {SHARE_LEVEL_LABEL[asked].toLowerCase()}</span>}
            </span>
          );
        },
      }),
    ),
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Data sharing"
        eyebrow="ORG-11"
        description={`What the institutions that run independently share with ${org.name}. They decide. You can ask for more.`}
        breadcrumbs={[{ label: org.name, to: path() }, { label: 'Data sharing' }]}
      />
      <Alert tone="info" className="mb-6">
        {governedCount} {governedCount === 1 ? 'institution is' : 'institutions are'} run by {org.name}, so the organization sees all of their data. They are not listed.
      </Alert>
      {externals.length === 0 ? (
        <EmptyState title="No independent institutions" description="Affiliated, autonomous and partner institutions appear here." />
      ) : (
        <div className="card !p-0 overflow-hidden">
          <DataTable
            caption="Data shared by independent institutions"
            rows={externals}
            columns={columns}
            rowKey={(row) => row.id}
            searchText={(row) => row.name}
            searchPlaceholder="Search institutions"
            initialSort={{ key: 'name', direction: 'asc' }}
            rowActions={(row) => (
              <Button size="sm" disabled={!canAsk} onClick={() => { setError(''); setWanted({}); setAsking(row); }} aria-label={`Ask ${row.shortName} for more access`}>
                Ask for more
              </Button>
            )}
          />
        </div>
      )}

      <Dialog
        open={asking !== null}
        onClose={() => setAsking(null)}
        title={`Ask ${asking?.shortName ?? ''} for more access`}
        description="Choose the areas where you want more than is shared now. The institution decides on each one."
        size="md"
        footer={
          <>
            <Button onClick={() => setAsking(null)}>Cancel</Button>
            <Button variant="primary" onClick={submit}>
              Send request
            </Button>
          </>
        }
      >
        {asking && (
          <form onSubmit={(event) => { event.preventDefault(); submit(); }} noValidate className="space-y-3">
            {error && <Alert tone="danger">{error}</Alert>}
            {SHARE_DOMAINS.map((domain) => {
              const current = shareLevelFor(world, asking, domain.key);
              const options = LEVELS.filter((level) => SHARE_LEVEL_RANK[level] > SHARE_LEVEL_RANK[current]).map((level) => ({ value: level, label: SHARE_LEVEL_LABEL[level] }));
              return (
                <div key={domain.key} className="grid grid-cols-1 items-end gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-charcoal-900">{domain.label}</p>
                    <p className="text-xs text-charcoal-600">
                      Now: {SHARE_LEVEL_LABEL[current].toLowerCase()}. {domain.description}
                    </p>
                  </div>
                  <SelectField label={`Level for ${domain.label}`} hideLabel placeholder={options.length === 0 ? 'Already full access' : 'No change'} options={options} value={wanted[domain.key] ?? ''} onChange={(value) => setWanted({ ...wanted, [domain.key]: value })} disabled={options.length === 0} />
                </div>
              );
            })}
          </form>
        )}
      </Dialog>
    </PageContainer>
  );
}

function InstitutionView() {
  const { inst, org, canIn, path } = usePortal();
  const world = useWorld();
  const apply = useApply();
  const [error, setError] = useState('');
  if (!inst) return null;
  const canEdit = canIn('institution.sharing.edit', inst.id).allowed;

  if (!isExternal(inst)) {
    return (
      <PageContainer>
        <PageHeader title="Data sharing" eyebrow="ORG-11" breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Data sharing' }]} />
        <EmptyState
          title="Nothing to agree here"
          description={org.implicit ? `${inst.shortName} is independent and has no parent organization, so it shares nothing with anyone.` : `${inst.shortName} is run by ${org.name}. The organization sees its data through its structure, not through an agreement.`}
          action={org.implicit ? <Link to={path('link-requests')} className="btn-secondary">Linking requests</Link> : undefined}
        />
      </PageContainer>
    );
  }

  const change = (domain: string, level: ShareLevel) => {
    const result = apply((snap, now, actor) => setAgreementLevel(snap, inst.id, domain, level, actor, now), 'Sharing level saved.');
    setError(result.ok ? '' : result.error);
  };
  const answer = (domain: string, accept: boolean) => {
    const result = apply((snap, now, actor) => answerAgreementRequest(snap, inst.id, domain, accept, actor, now), accept ? 'Request accepted.' : 'Request declined.');
    setError(result.ok ? '' : result.error);
  };

  const requests = SHARE_DOMAINS.filter((domain) => agreementOf(world.agreements, inst.id, domain.key)?.requested);

  return (
    <PageContainer>
      <PageHeader
        title="Data sharing"
        eyebrow="ORG-11"
        description={`${inst.shortName} runs independently. ${org.name} sees only what you allow here. You can change a level at any time.`}
        breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Data sharing' }]}
      />
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}
      {requests.length > 0 && (
        <Alert tone="warning" title={`${org.name} asks for more access`} className="mb-6">
          Answer each request below. Declining keeps today&apos;s level.
        </Alert>
      )}
      <Card padded={false}>
        <ul className="divide-y divide-warm-200">
          {SHARE_DOMAINS.map((domain) => {
            const agreement = agreementOf(world.agreements, inst.id, domain.key);
            const level = agreement?.level ?? 'none';
            return (
              <li key={domain.key} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_16rem] md:items-center md:px-6">
                <div>
                  <p className="font-medium text-charcoal-900">{domain.label}</p>
                  <p className="text-sm text-charcoal-600">{domain.description}</p>
                  {agreement && <p className="mt-1 text-xs text-charcoal-500">Last changed by {agreement.updatedByName}, {formatDate(agreement.updatedAt)}</p>}
                  {agreement?.requested && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-800">
                      <span>
                        {agreement.requestedByName} asks for: <strong>{SHARE_LEVEL_LABEL[agreement.requested].toLowerCase()}</strong>
                      </span>
                      <Button size="sm" variant="primary" disabled={!canEdit} onClick={() => answer(domain.key, true)} aria-label={`Accept the request for ${domain.label}`}>
                        Accept
                      </Button>
                      <Button size="sm" disabled={!canEdit} onClick={() => answer(domain.key, false)} aria-label={`Decline the request for ${domain.label}`}>
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
                <SelectField
                  label={`Level for ${domain.label}`}
                  hideLabel
                  options={LEVELS.map((value) => ({ value, label: SHARE_LEVEL_LABEL[value] }))}
                  value={level}
                  onChange={(value) => change(domain.key, value as ShareLevel)}
                  disabled={!canEdit}
                />
              </li>
            );
          })}
        </ul>
      </Card>
    </PageContainer>
  );
}

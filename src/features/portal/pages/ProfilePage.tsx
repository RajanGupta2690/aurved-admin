import { prefsStore } from '../../../core/api/stores';
import { useStore } from '../../../core/api/persistedStore';
import { usePortal } from '../../../core/context/portalContext';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import { Switch } from '../../../shared/ui/Field';
import { Card, DescriptionList, PageHeader } from '../../../shared/ui/Layout';

export default function ProfilePage() {
  const { persona, roles, organizations, institutions } = usePortal();
  const prefs = useStore(prefsStore);

  const placeName = (type: 'org' | 'inst', id: string) =>
    type === 'org' ? organizations.find((org) => org.id === id)?.name ?? id : institutions.find((inst) => inst.id === id)?.name ?? id;

  return (
    <PageContainer>
      <PageHeader title="Profile and preferences" description="Who you are in this demo, what your roles allow, and how the page looks to you." eyebrow="SH-08" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Account">
          <DescriptionList columns={1} items={[{ label: 'Name', value: persona.name }, { label: 'Title', value: persona.title }, { label: 'Email', value: persona.email }]} />
          <p className="mt-4 text-xs text-charcoal-600">Demo mode: you act as this person. Change it from the account menu in the header.</p>
        </Card>

        <Card title="Display">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-charcoal-800">Text size</legend>
            <div className="flex gap-4">
              {(['normal', 'large'] as const).map((size) => (
                <label key={size} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="radio" name="text-size" checked={prefs.textSize === size} onChange={() => prefsStore.set((previous) => ({ ...previous, textSize: size }))} className="accent-primary-700" />
                  {size === 'normal' ? 'Normal' : 'Large'}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-5">
            <Switch label="Reduce motion" checked={prefs.reduceMotion} onChange={(checked) => prefsStore.set((previous) => ({ ...previous, reduceMotion: checked }))} description="Turns off sliding and fading. Your device setting is also respected." />
          </div>
        </Card>

        <Card title="Roles and places" description="Where you hold a role and what the role includes." className="lg:col-span-2">
          <ul className="space-y-4">
            {persona.memberships.map((membership, index) => (
              <li key={index} className="rounded-xl border border-warm-200 p-4">
                <p className="font-semibold text-charcoal-950">{placeName(membership.scope.type, membership.scope.id)}</p>
                <p className="text-xs text-charcoal-600">{membership.scope.type === 'org' ? 'Applies to every institution in the organization' : 'Applies to this institution only'}</p>
                <ul className="mt-3 space-y-2">
                  {membership.roleIds.map((roleId) => {
                    const role = roles.find((candidate) => candidate.id === roleId);
                    return (
                      <li key={roleId} className="text-sm">
                        <Badge tone="brand">{role?.name ?? roleId}</Badge>
                        <span className="ml-2 text-charcoal-700">{role?.description}</span>
                      </li>
                    );
                  })}
                </ul>
                {(membership.grants?.length ?? 0) > 0 && <p className="mt-2 text-xs text-charcoal-700">Extra permissions: {membership.grants?.join(', ')}</p>}
                {(membership.denies?.length ?? 0) > 0 && <p className="mt-1 text-xs text-danger-700">Blocked: {membership.denies?.join(', ')}</p>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </PageContainer>
  );
}

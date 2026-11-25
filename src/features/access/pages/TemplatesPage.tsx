import { Link } from 'react-router-dom';
import { usePortal } from '../../../core/context/portalContext';
import { matrixCounts, matrixOf, permissionRows } from '../../../core/access/matrix';
import { ROLE_TEMPLATES } from '../../../core/access/templates';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import { Card, PageHeader } from '../../../shared/ui/Layout';
import SectionNav from '../components/SectionNav';
import { ROLE_PAGES } from '../sections';

/** ACC-10. Ready-made starting points. A template is copied into a new role, so the template itself never changes. */
export default function TemplatesPage() {
  const { scope, org, inst, can, path } = usePortal();
  const canCreate = can('access.roles.create').allowed;
  const templates = ROLE_TEMPLATES.filter((item) => scope === 'org' || item.level === 'inst');
  const modulesOf = (permissions: string[]) => {
    const matrix = matrixOf(permissions);
    return Array.from(new Set(permissionRows().filter((row) => row.actions.some((action) => matrix[`${row.featureKey}.${action}`] === 'allow')).map((row) => row.moduleLabel)));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Permission templates"
        eyebrow="ACC-10"
        description="Pick a template, adjust it in the role builder, save it as your own role."
        breadcrumbs={[{ label: inst?.shortName ?? org.name, to: path() }, { label: 'Templates' }]}
      />
      <SectionNav label="Role pages" items={ROLE_PAGES} />
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const counts = matrixCounts(matrixOf(template.permissions));
          const modules = modulesOf(template.permissions);
          return (
            <li key={template.id}>
              <Card className="h-full" title={template.name} description={template.description}>
                <p className="mb-2 flex flex-wrap items-center gap-2 text-sm text-charcoal-700">
                  <Badge tone={template.level === 'org' ? 'brand' : 'neutral'}>{template.level === 'org' ? 'Whole organization' : 'One institution'}</Badge>
                  {counts.allowed} permissions{counts.denied > 0 ? `, ${counts.denied} denied` : ''}
                </p>
                <details className="mb-4 text-sm text-charcoal-700">
                  <summary className="cursor-pointer font-medium text-primary-700">What it covers</summary>
                  <p className="mt-2">{modules.join(', ')}</p>
                </details>
                <Link to={`${path('roles/new')}?template=${template.id}`} aria-disabled={!canCreate} tabIndex={canCreate ? undefined : -1} className={canCreate ? 'btn-primary inline-flex' : 'btn-primary pointer-events-none inline-flex opacity-50'} aria-label={`Use the template ${template.name}`}>
                  Use this template
                </Link>
              </Card>
            </li>
          );
        })}
      </ul>
    </PageContainer>
  );
}

import { useNavigate } from 'react-router-dom';
import { afterInstitutionCreated } from '../../../core/api/worldStore';
import { usePortal } from '../../../core/context/portalContext';
import PageContainer from '../../../shared/layout/PageContainer';
import { Alert } from '../../../shared/ui/Feedback';
import { PageHeader } from '../../../shared/ui/Layout';
import InstitutionWizard from '../components/InstitutionWizard';

/** ORG-05. Adds an institution to this organization. */
export default function AddInstitutionPage() {
  const { org, persona, can, path } = usePortal();
  const navigate = useNavigate();

  return (
    <PageContainer>
      <PageHeader
        title="Add an institution"
        eyebrow="ORG-05"
        description={`A new institution inside ${org.name}. To bring in an institution that already exists on its own, send a linking request instead.`}
        breadcrumbs={[{ label: org.name, to: path() }, { label: 'Institutions', to: path('institutions') }, { label: 'Add' }]}
      />
      {!can('org.institutions.create').allowed ? (
        <Alert tone="warning" title="You cannot add institutions">
          Your role may view institutions but not create them.
        </Alert>
      ) : (
        <InstitutionWizard
          mode="in_org"
          org={org}
          actor={{ id: persona.id, name: persona.name }}
          onCancel={() => navigate(path('institutions'))}
          onCreated={({ instId }) => {
            afterInstitutionCreated(instId);
            navigate(path('institutions'));
          }}
        />
      )}
    </PageContainer>
  );
}

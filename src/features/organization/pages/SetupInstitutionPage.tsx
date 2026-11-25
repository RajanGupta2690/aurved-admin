import { Link, useNavigate } from 'react-router-dom';
import { afterInstitutionCreated } from '../../../core/api/worldStore';
import { accessStore, prefsStore } from '../../../core/api/stores';
import { useStore } from '../../../core/api/persistedStore';
import BrandLogo from '../../../shared/components/BrandLogo';
import { PageHeader } from '../../../shared/ui/Layout';
import InstitutionWizard from '../components/InstitutionWizard';

/**
 * ORG-15. Creates a new independent institution with an account of its own.
 * It is outside any institution, so it has no menu. The person who creates it becomes its administrator.
 */
export default function SetupInstitutionPage() {
  const prefs = useStore(prefsStore);
  const { personas } = useStore(accessStore);
  const navigate = useNavigate();
  const persona = personas.find((person) => person.id === prefs.personaId) ?? personas[0];

  return (
    <div className="min-h-screen bg-app">
      <header className="border-b border-warm-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} decorative className="rounded-lg" />
            <span className="text-lg font-bold text-charcoal-950">AURVED</span>
          </div>
          <Link to="/" className="text-sm font-medium text-primary-700 hover:underline">
            Back to the portal
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-4xl p-4 md:p-6">
        <PageHeader title="Create an institution" eyebrow="ORG-15" description="Set up a school, college, university or institute that runs on its own. You can link it to a group or university later." />
        <InstitutionWizard
          mode="independent"
          actor={{ id: persona.id, name: persona.name }}
          onCancel={() => navigate('/')}
          onCreated={({ instId }) => {
            afterInstitutionCreated(instId, persona.id);
            prefsStore.set((previous) => ({ ...previous, lastInstId: instId }));
            navigate(`/inst/${instId}`);
          }}
        />
      </main>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetAllDemoData } from '../../../core/api/persistedStore';
import PageContainer from '../../../shared/layout/PageContainer';
import Button from '../../../shared/ui/Button';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import { Card, PageHeader } from '../../../shared/ui/Layout';
import { useToast } from '../../../shared/ui/toastContext';

const SHORTCUTS: Array<[string, string]> = [
  ['Ctrl or Cmd + K', 'Open search'],
  ['Tab and Shift + Tab', 'Move between controls'],
  ['Esc', 'Close a dialog, panel or menu'],
  ['Arrow keys', 'Move in tabs and search results'],
  ['Enter', 'Open the highlighted search result'],
];

export default function HelpPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <PageContainer>
      <PageHeader title="Help centre" description="How to find your way, how access works, and how to use the demo." eyebrow="SH-07" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Finding your way">
          <ul className="list-disc space-y-2 pl-5 text-sm text-charcoal-800">
            <li>The menu on the left lists only what you may open here.</li>
            <li>The box at the top left switches organization, institution and campus. It is hidden when you only have one place.</li>
            <li>Search finds screens, students, institutions and tasks you may open.</li>
            <li>The tray icon shows items waiting for you. The bell shows notifications.</li>
          </ul>
        </Card>

        <Card title="How access works">
          <p className="mb-3 text-sm text-charcoal-700">A page opens only when all four checks pass. If one fails, the page says which.</p>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-charcoal-800">
            <li>
              <strong>Plan:</strong> the feature is part of what the institution bought.
            </li>
            <li>
              <strong>Organization rules:</strong> a trust or university may switch a feature off, or require it.
            </li>
            <li>
              <strong>Local choice:</strong> the institution switched it on and the features it needs are on.
            </li>
            <li>
              <strong>Your role and place:</strong> your role includes it, in this institution. A direct block always wins.
            </li>
          </ol>
          <p className="mt-3 text-xs text-charcoal-600">Hiding a link is not security. The same checks must run on the server when it exists.</p>
        </Card>

        <Card title="Keyboard">
          <table className="w-full text-sm">
            <caption className="sr-only">Keyboard shortcuts</caption>
            <tbody className="divide-y divide-warm-200">
              {SHORTCUTS.map(([keys, action]) => (
                <tr key={keys}>
                  <th scope="row" className="py-2 pr-4 text-left font-medium text-charcoal-900">
                    <kbd className="rounded border border-warm-300 bg-warm-50 px-1.5 py-0.5 text-xs">{keys}</kbd>
                  </th>
                  <td className="py-2 text-charcoal-700">{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="About this demo">
          <ul className="list-disc space-y-2 pl-5 text-sm text-charcoal-800">
            <li>All names, numbers and institutions are made up.</li>
            <li>Everything you change is saved only in this browser. Another browser or device starts from the sample data.</li>
            <li>There is no sign in. Use the account menu to act as another person and see how access changes.</li>
            <li>The Students, Student details and Parents screens still show the sample data of Sunrise International School, whichever institution you are in. They carry a note. Student names in other screens are typed as text and are not linked to them yet.</li>
            <li>Language and region in your profile change dates, numbers and money. Screen words stay in English.</li>
          </ul>
          <div className="mt-4">
            <Button variant="danger" onClick={() => setConfirmReset(true)}>
              Reset demo data
            </Button>
          </div>
        </Card>

        <Card title="Need help from a person?" className="lg:col-span-2">
          <p className="text-sm text-charcoal-800">Ask the administrator of your institution. The page that blocks you names who to ask.</p>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset demo data"
        message="Everything added or changed in this browser goes back to the sample data. This includes inbox decisions, calendar events, parent links, roles and your chosen person."
        confirmLabel="Reset everything"
        onConfirm={() => {
          resetAllDemoData();
          toast.success('Demo data is back to the start.');
          navigate('/', { replace: true });
        }}
      />
    </PageContainer>
  );
}

import { useState } from 'react';
import { Download } from 'lucide-react';
import { snapshot, commit, nowIso } from '../../../core/api/worldStore';
import { usePortal } from '../../../core/context/portalContext';
import { parseCsv } from '../../../core/staff/csv';
import { IMPORT_COLUMNS, importStaff } from '../../../core/staff/ops';
import type { ImportResult } from '../../../core/staff/ops';
import PageContainer from '../../../shared/layout/PageContainer';
import Button from '../../../shared/ui/Button';
import { TextareaField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { Card, PageHeader } from '../../../shared/ui/Layout';
import { useToast } from '../../../shared/ui/toastContext';
import StaffNav from '../components/StaffNav';
import { useInstStaff } from '../hooks';

const SAMPLE = `${IMPORT_COLUMNS.join(',')}\nAsha Verma,asha.verma@example.demo,+91 98444 55667,teaching,Teacher,Academics,2026-04-01,permanent,female,1990-05-12\n`;

/** STF-29. Paste or choose a CSV file. Check first, then import. */
export default function StaffImportPage() {
  const { can, persona, path } = usePortal();
  const { inst } = useInstStaff();
  const toast = useToast();
  const [text, setText] = useState('');
  const [parseError, setParseError] = useState('');
  const [check, setCheck] = useState<{ count: number; result: ImportResult } | null>(null);
  const canImport = can('staff.directory.import').allowed;
  const actor = { id: persona.id, name: persona.name };

  const parsed = () => {
    const csv = parseCsv(text);
    if (csv.error) {
      setParseError(csv.error);
      return null;
    }
    const missing = ['name', 'email', 'phone', 'category', 'designation', 'department', 'join_date'].filter((name) => !csv.header.includes(name));
    if (missing.length > 0) {
      setParseError(`These columns are missing: ${missing.join(', ')}.`);
      return null;
    }
    if (csv.rows.length === 0) {
      setParseError('There are no rows below the header.');
      return null;
    }
    if (csv.rows.length > 500) {
      setParseError('Import at most 500 people at a time.');
      return null;
    }
    setParseError('');
    return csv.rows;
  };

  const runCheck = () => {
    const rows = parsed();
    if (!rows) return setCheck(null);
    const { result } = importStaff(snapshot(), inst.id, rows, actor, nowIso());
    setCheck({ count: rows.length, result });
  };

  const runImport = () => {
    const rows = parsed();
    if (!rows) return;
    const { snap, result } = importStaff(snapshot(), inst.id, rows, actor, nowIso());
    if (result.created === 0) return setCheck({ count: rows.length, result });
    commit(snap);
    toast.success(`${result.created} ${result.created === 1 ? 'person' : 'people'} imported.`);
    setCheck({ count: rows.length, result });
    setText('');
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([SAMPLE], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'staff-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer>
      <PageHeader title="Import staff" eyebrow="STF-29" description="Add many people from a CSV file. Rows that are fine are added. Rows that are not are listed with the reason and left out." breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Import' }]} />
      <StaffNav />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Your file" className="lg:col-span-2">
          <div className="space-y-4">
            <div>
              <label htmlFor="csv-file" className="mb-1.5 block text-sm font-medium text-charcoal-800">Choose a CSV file</label>
              <input id="csv-file" type="file" accept=".csv,text/csv" disabled={!canImport} onChange={async (event) => { const file = event.target.files?.[0]; if (file) { setText(await file.text()); setCheck(null); } }} className="block w-full text-sm" />
            </div>
            <TextareaField label="Or paste the text" rows={8} value={text} onChange={(value) => { setText(value); setCheck(null); }} disabled={!canImport} />
            {parseError && <Alert tone="danger">{parseError}</Alert>}
            <div className="flex flex-wrap gap-3">
              <Button onClick={runCheck} disabled={!canImport || !text.trim()}>Check the file</Button>
              <Button variant="primary" onClick={runImport} disabled={!canImport || !text.trim()}>Import valid rows</Button>
            </div>
            {check && (
              <Alert tone={check.result.errors.length === 0 ? 'success' : 'warning'} title={`${check.count} rows read: ${check.count - check.result.errors.length} fine, ${check.result.errors.length} with a problem`}>
                {check.result.errors.length > 0 && (
                  <ul className="mt-1 list-disc pl-5">
                    {check.result.errors.map((item) => (
                      <li key={`${item.line}-${item.message}`}>Line {item.line}: {item.message}</li>
                    ))}
                  </ul>
                )}
              </Alert>
            )}
          </div>
        </Card>
        <Card title="Format">
          <p className="mb-2 text-sm text-charcoal-700">The first line names the columns:</p>
          <p className="mb-3 break-words rounded-lg bg-warm-100 p-2 font-mono text-xs text-charcoal-800">{IMPORT_COLUMNS.join(', ')}</p>
          <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-charcoal-700">
            <li>Category: teaching or non-teaching.</li>
            <li>Designation and department must already exist here, spelled the same.</li>
            <li>Type: permanent, contract, visiting or part time.</li>
            <li>Dates look like 2026-04-01.</li>
          </ul>
          <Button icon={<Download size={16} aria-hidden="true" />} onClick={download}>Download a template</Button>
        </Card>
      </div>
    </PageContainer>
  );
}

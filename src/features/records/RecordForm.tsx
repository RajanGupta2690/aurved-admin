import { useState } from 'react';
import { snapshot } from '../../core/api/worldStore';
import { usePortal } from '../../core/context/portalContext';
import { ruleContext, saveRecord, validateData } from '../../core/records/ops';
import type { CollectionDef, FieldDef, RecordRow } from '../../core/records/types';
import { isExited } from '../../core/staff/model';
import Button from '../../shared/ui/Button';
import { CheckboxField, SelectField, TextareaField, TextField } from '../../shared/ui/Field';
import { Alert } from '../../shared/ui/Feedback';
import { Dialog } from '../../shared/ui/Overlay';
import { useApply } from '../organization/hooks';

type Values = Record<string, string | boolean>;

function initial(def: CollectionDef, row?: RecordRow): Values {
  const values: Values = {};
  def.fields.forEach((field) => {
    if (field.computed) return;
    const stored = row?.data[field.key];
    if (field.type === 'boolean') values[field.key] = stored === undefined ? Boolean(field.default ?? false) : Boolean(stored);
    else values[field.key] = stored === undefined ? String(field.default ?? '') : String(stored);
  });
  return values;
}

/** Create or change one record. Field messages come from the same rules the data layer enforces. */
export default function RecordForm({ def, scopeId, row, open, onClose, onSaved }: { def: CollectionDef; scopeId: string; row?: RecordRow; open: boolean; onClose: () => void; onSaved?: (id: string) => void }) {
  const { institutions } = usePortal();
  const apply = useApply();
  const [values, setValues] = useState<Values>(() => initial(def, row));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const staff = snapshot().staff.members.filter((member) => member.instId === scopeId && !isExited(member.employment.status));
  const set = (key: string, value: string | boolean) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: '' }));
  };

  const submit = () => {
    const ctx = ruleContext(snapshot(), def, scopeId, new Date().toISOString(), row?.id, row?.status);
    const checked = validateData(def, values, ctx);
    if (Object.keys(checked.errors).length > 0) {
      setErrors(checked.errors);
      setFormError('');
      setTimeout(() => document.querySelector<HTMLElement>('[role=dialog] [aria-invalid="true"]')?.focus(), 0);
      return;
    }
    const result = apply((snap, now, actor) => saveRecord(snap, def, { id: row?.id, scopeId, data: values }, actor, now), row ? `${def.singular} saved.` : `${def.singular} added.`);
    if (result.ok) {
      onSaved?.(result.recordId);
      onClose();
    } else setFormError(result.error);
  };

  const visible = (field: FieldDef) => !field.computed && !(field.showWhen && String(values[field.showWhen.key] ?? 'false') !== field.showWhen.equals);
  const render = (field: FieldDef, index: number) => {
    const common = { label: field.label, required: field.required, error: errors[field.key] || undefined, hint: field.hint, disabled: Boolean(row && field.fixed) };
    const value = values[field.key];
    const wide = field.type === 'longtext' ? 'sm:col-span-2' : undefined;
    switch (field.type) {
      case 'longtext':
        return <TextareaField key={field.key} className={wide} rows={3} value={value} onChange={(next) => set(field.key, next)} {...common} />;
      case 'boolean':
        return <CheckboxField key={field.key} className="self-end pb-2" label={field.label} checked={Boolean(value)} onChange={(checked) => set(field.key, checked)} hint={field.hint} />;
      case 'select':
        return <SelectField key={field.key} placeholder="Choose" options={field.options ?? []} value={value} onChange={(next) => set(field.key, next)} {...common} />;
      case 'staff':
        return <SelectField key={field.key} placeholder="Choose" options={staff.map((member) => ({ value: member.id, label: member.person.fullName }))} value={value} onChange={(next) => set(field.key, next)} {...common} />;
      case 'institution':
        return <SelectField key={field.key} placeholder="Choose" options={institutions.filter((inst) => inst.id === scopeId || inst.orgId === scopeId).map((inst) => ({ value: inst.id, label: inst.name }))} value={value} onChange={(next) => set(field.key, next)} {...common} />;
      default:
        return <TextField key={field.key} type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'} min={field.min} max={field.max} autoFocus={index === 0 && !row} value={value} onChange={(next) => set(field.key, next)} {...common} />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={row ? `Edit ${def.singular.toLowerCase()}` : `New ${def.singular.toLowerCase()}`}
      description={def.sensitive}
      size="md"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form={`form-${def.key}`}>
            {row ? 'Save changes' : `Add ${def.singular.toLowerCase()}`}
          </Button>
        </>
      }
    >
      <form
        id={`form-${def.key}`}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        noValidate
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {formError && (
          <div className="sm:col-span-2">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
        {def.fields.filter(visible).map(render)}
      </form>
    </Dialog>
  );
}

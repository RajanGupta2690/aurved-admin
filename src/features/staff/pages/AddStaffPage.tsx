import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePortal } from '../../../core/context/portalContext';
import { EMPLOYMENT_LABEL, isExited, SHIFT_LABEL, WORK_AREAS } from '../../../core/staff/model';
import type { EmploymentType, Shift, StaffCategory } from '../../../core/staff/model';
import { addStaff, nextEmployeeId, policyOf } from '../../../core/staff/ops';
import { snapshot } from '../../../core/api/worldStore';
import PageContainer from '../../../shared/layout/PageContainer';
import Button from '../../../shared/ui/Button';
import { CheckboxField, SelectField, TextField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { Card, PageHeader, TabPanel, Tabs } from '../../../shared/ui/Layout';
import { useForm } from '../../../shared/ui/useForm';
import { email, phone, required } from '../../../shared/ui/validators';
import { useApply } from '../../organization/hooks';
import StaffNav from '../components/StaffNav';
import { useInstStaff } from '../hooks';

interface Values extends Record<string, unknown> {
  fullName: string;
  gender: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  category: string;
  designationId: string;
  departmentId: string;
  reportsToId: string;
  joinDate: string;
  type: string;
  campusId: string;
  employeeId: string;
  degree: string;
  degreeYear: string;
  area: string;
  shift: string;
}

/**
 * STF-05. Two tabs: teaching staff and non-teaching staff. The required fields are enough to add someone.
 * Documents, classes and duties are added on the profile after saving.
 */
export default function AddStaffPage() {
  const { can, path } = usePortal();
  const { inst, state, members, designations, departments } = useInstStaff();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const apply = useApply();
  const [error, setError] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const bank = state.banks[inst.id] ?? { groups: [], subjects: [] };
  const policy = policyOf(snapshot(), inst.id);
  const campuses = inst.campuses.filter((campus) => (campus.status ?? 'active') === 'active');
  const form = useForm<Values>(
    () => ({ fullName: '', gender: '', dob: '', phone: '', email: '', address: '', category: params.get('category') === 'non_teaching' ? 'non_teaching' : 'teaching', designationId: '', departmentId: '', reportsToId: '', joinDate: new Date().toISOString().slice(0, 10), type: 'permanent', campusId: campuses[0]?.id ?? '', employeeId: '', degree: '', degreeYear: '', area: '', shift: '' }),
    {
      fullName: [required('Enter the full name.')],
      phone: [required('Enter a phone number.'), phone()],
      email: [required('Enter an email address.'), email()],
      designationId: [required('Choose a designation.')],
      departmentId: [required('Choose a department.')],
      joinDate: [required('Choose the joining date.')],
    },
  );
  const { values } = form;
  const options = designations.filter((item) => item.active && item.category === values.category);

  const save = form.handleSubmit((v) => {
    const result = apply(
      (snap, now, actor) =>
        addStaff(snap, { instId: inst.id, fullName: v.fullName, gender: v.gender as '' | 'female' | 'male' | 'other', dob: v.dob, phone: v.phone, email: v.email, address: v.address, employeeId: v.employeeId, category: v.category as StaffCategory, designationId: v.designationId, departmentId: v.departmentId, reportsToId: v.reportsToId || null, joinDate: v.joinDate, type: v.type as EmploymentType, campusId: v.campusId, work: v.category === 'teaching' ? { subjects } : { area: v.area, shift: (v.shift || undefined) as Shift | undefined }, qualification: v.degree.trim() ? { degree: v.degree, year: v.degreeYear ? Number(v.degreeYear) : undefined } : undefined }, actor, now),
      `${v.fullName} was added.`,
    );
    if (result.ok) navigate(`${path(`staff/${result.staffId}`)}?tab=responsibilities`);
    else setError(result.error);
  });

  if (!can('staff.directory.create').allowed) {
    return (
      <PageContainer>
        <PageHeader title="Add staff" eyebrow="STF-05" breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Staff', to: path('staff') }, { label: 'Add' }]} />
        <Alert tone="warning" title="You cannot add staff">
          Your role may view staff but not add them.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Add staff" eyebrow="STF-05" description="Choose the kind of staff first. Required fields are enough. After saving you give them classes and duties, and add documents and a sign-in account." breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Staff', to: path('staff') }, { label: 'Add' }]} />
      <StaffNav />
      <Tabs
        label="Kind of staff"
        value={values.category}
        onChange={(value) => form.setValues({ ...values, category: value, designationId: '' })}
        items={[
          { id: 'teaching', label: 'Teaching staff' },
          { id: 'non_teaching', label: 'Non-teaching staff' },
        ]}
      />
      <TabPanel id={values.category} value={values.category}>
      <form onSubmit={save} noValidate className="grid gap-6">
        {error && <Alert tone="danger">{error}</Alert>}
        <Card title="Person">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField label="Full name" required autoFocus {...form.bind('fullName')} />
            <SelectField label="Gender" placeholder="Not stated" options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }, { value: 'other', label: 'Other' }]} {...form.bind('gender')} />
            <TextField label="Date of birth" type="date" {...form.bind('dob')} />
            <TextField label="Phone" type="tel" required {...form.bind('phone')} />
            <TextField label="Email" type="email" required hint="Also the sign-in name if an account is made." {...form.bind('email')} />
            <TextField label="Address" {...form.bind('address')} />
          </div>
        </Card>
        <Card title="Employment" description={`Probation is ${policy.probationMonths} months for permanent staff. Employee numbers start with ${policy.employeeIdPrefix}.`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField label="Designation" required placeholder="Choose" options={options.map((item) => ({ value: item.id, label: item.name }))} {...form.bind('designationId')} />
            <SelectField label="Department" required placeholder="Choose" options={departments.filter((item) => item.active).map((item) => ({ value: item.id, label: item.name }))} {...form.bind('departmentId')} />
            <SelectField label="Reports to" placeholder="Nobody" options={members.filter((member) => !isExited(member.employment.status)).map((member) => ({ value: member.id, label: member.person.fullName }))} {...form.bind('reportsToId')} />
            <TextField label="Joining date" type="date" required {...form.bind('joinDate')} />
            <SelectField label="Employment type" options={Object.entries(EMPLOYMENT_LABEL).map(([value, label]) => ({ value, label }))} {...form.bind('type')} />
            {campuses.length > 1 && <SelectField label="Campus" options={campuses.map((campus) => ({ value: campus.id, label: campus.name }))} {...form.bind('campusId')} />}
            <TextField label="Employee number" hint={`Leave empty for ${nextEmployeeId(snapshot(), inst.id)}.`} {...form.bind('employeeId')} />
          </div>
        </Card>
        <Card title="Qualification" description="The highest qualification. More can be added on the profile.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField label="Highest qualification" hint={values.category === 'teaching' ? 'For example M.Sc, B.Ed.' : 'For example B.Com, ITI.'} {...form.bind('degree')} />
            <TextField label="Year" type="number" min={1950} max={Number(values.joinDate.slice(0, 4)) || 2100} {...form.bind('degreeYear')} />
          </div>
        </Card>
        {values.category === 'teaching' ? (
          <Card title="Subjects" description="The subjects this teacher can take. Classes are given on the profile after saving.">
            {bank.subjects.length === 0 ? (
              <p className="text-sm text-charcoal-600">This institution has no subjects set up yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
                {bank.subjects.map((subject) => (
                  <CheckboxField key={subject} label={subject} checked={subjects.includes(subject)} onChange={(on) => setSubjects(on ? [...subjects, subject] : subjects.filter((item) => item !== subject))} />
                ))}
              </div>
            )}
          </Card>
        ) : (
          <Card title="Work" description="Where this person works and when.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SelectField label="Work area" placeholder="Not stated" options={WORK_AREAS.map((area) => ({ value: area, label: area }))} {...form.bind('area')} />
              <SelectField label="Shift" placeholder="Not stated" options={Object.entries(SHIFT_LABEL).map(([value, label]) => ({ value, label }))} {...form.bind('shift')} />
            </div>
          </Card>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <Button onClick={() => navigate(path('staff'))}>Cancel</Button>
          <Button variant="primary" type="submit">
            {values.category === 'teaching' ? 'Add teaching staff' : 'Add non-teaching staff'}
          </Button>
        </div>
      </form>
      </TabPanel>
    </PageContainer>
  );
}

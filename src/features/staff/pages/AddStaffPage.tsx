import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortal } from '../../../core/context/portalContext';
import { CATEGORY_LABEL, EMPLOYMENT_LABEL, isExited } from '../../../core/staff/model';
import type { EmploymentType, StaffCategory } from '../../../core/staff/model';
import { addStaff, nextEmployeeId, policyOf } from '../../../core/staff/ops';
import { snapshot } from '../../../core/api/worldStore';
import PageContainer from '../../../shared/layout/PageContainer';
import Button from '../../../shared/ui/Button';
import { SelectField, TextField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { Card, PageHeader } from '../../../shared/ui/Layout';
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
}

/** STF-05. The required fields are enough to add someone. Qualifications and documents are added on the profile. */
export default function AddStaffPage() {
  const { can, path } = usePortal();
  const { inst, members, designations, departments } = useInstStaff();
  const navigate = useNavigate();
  const apply = useApply();
  const [error, setError] = useState('');
  const policy = policyOf(snapshot(), inst.id);
  const campuses = inst.campuses.filter((campus) => (campus.status ?? 'active') === 'active');
  const form = useForm<Values>(
    () => ({ fullName: '', gender: '', dob: '', phone: '', email: '', address: '', category: 'teaching', designationId: '', departmentId: '', reportsToId: '', joinDate: new Date().toISOString().slice(0, 10), type: 'permanent', campusId: campuses[0]?.id ?? '', employeeId: '' }),
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
        addStaff(snap, { instId: inst.id, fullName: v.fullName, gender: v.gender as '' | 'female' | 'male' | 'other', dob: v.dob, phone: v.phone, email: v.email, address: v.address, employeeId: v.employeeId, category: v.category as StaffCategory, designationId: v.designationId, departmentId: v.departmentId, reportsToId: v.reportsToId || null, joinDate: v.joinDate, type: v.type as EmploymentType, campusId: v.campusId }, actor, now),
      `${v.fullName} was added.`,
    );
    if (result.ok) navigate(path(`staff/${result.staffId}`));
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
      <PageHeader title="Add staff" eyebrow="STF-05" description="Required fields are enough. After saving you can add qualifications, documents and a sign-in account on the profile." breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Staff', to: path('staff') }, { label: 'Add' }]} />
      <StaffNav />
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
            <SelectField label="Category" required options={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))} value={values.category} onChange={(value) => form.setValues({ ...values, category: value, designationId: '' })} />
            <SelectField label="Designation" required placeholder="Choose" options={options.map((item) => ({ value: item.id, label: item.name }))} {...form.bind('designationId')} />
            <SelectField label="Department" required placeholder="Choose" options={departments.filter((item) => item.active).map((item) => ({ value: item.id, label: item.name }))} {...form.bind('departmentId')} />
            <SelectField label="Reports to" placeholder="Nobody" options={members.filter((member) => !isExited(member.employment.status)).map((member) => ({ value: member.id, label: member.person.fullName }))} {...form.bind('reportsToId')} />
            <TextField label="Joining date" type="date" required {...form.bind('joinDate')} />
            <SelectField label="Employment type" options={Object.entries(EMPLOYMENT_LABEL).map(([value, label]) => ({ value, label }))} {...form.bind('type')} />
            {campuses.length > 1 && <SelectField label="Campus" options={campuses.map((campus) => ({ value: campus.id, label: campus.name }))} {...form.bind('campusId')} />}
            <TextField label="Employee number" hint={`Leave empty for ${nextEmployeeId(snapshot(), inst.id)}.`} {...form.bind('employeeId')} />
          </div>
        </Card>
        <div className="flex flex-wrap justify-end gap-3">
          <Button onClick={() => navigate(path('staff'))}>Cancel</Button>
          <Button variant="primary" type="submit">
            Add staff
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

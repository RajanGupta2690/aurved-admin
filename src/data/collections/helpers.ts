import type { FieldDef, Option, StatusDef, StatusTone } from '../../core/records/types';

/** Short builders, so a collection reads as its fields and rules. */
type Opts = Partial<Omit<FieldDef, 'key' | 'label' | 'type'>>;
const mk = (type: FieldDef['type']) => (key: string, label: string, o: Opts = {}): FieldDef => ({ key, label, type, ...o });

export const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
export const options = (list: Array<string | [string, string]>): Option[] => list.map((item) => (Array.isArray(item) ? { value: item[0], label: item[1] } : { value: slug(item), label: item }));

export const f = {
  text: mk('text'),
  long: mk('longtext'),
  num: mk('number'),
  date: mk('date'),
  email: mk('email'),
  phone: mk('phone'),
  bool: mk('boolean'),
  staff: mk('staff'),
  inst: mk('institution'),
  sel: (key: string, label: string, list: Array<string | [string, string]>, o: Opts = {}): FieldDef => ({ key, label, type: 'select', options: options(list), ...o }),
  money: (key: string, label: string, o: Opts = {}): FieldDef => ({ key, label, type: 'number', money: true, min: 0, ...o }),
};

export const st = (value: string, label: string, tone: StatusTone, o: Partial<StatusDef> = {}): StatusDef => ({ value, label, tone, ...o });

/** The statuses in order, and which may follow which. A linear path with optional exits. */
export function flow(path: string[], exits: Record<string, string[]> = {}): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  path.forEach((value, index) => {
    out[value] = [...(path[index + 1] ? [path[index + 1]] : []), ...(exits[value] ?? [])];
  });
  Object.keys(exits).forEach((value) => {
    if (!out[value]) out[value] = exits[value];
  });
  return out;
}

export const SUN = 'inst-sunrise';
export const GRN = 'inst-greenfield';
export const HZA = 'inst-horizon-a';
export const MER = 'org-meridian';
export const SCI = 'inst-mer-sci';
export const LAKE = 'inst-lakeside';
export const sunStaff = (n: number) => `staff-inst-sunrise-${n}`;
export const grnStaff = (n: number) => `staff-inst-greenfield-${n}`;
export const lakeStaff = (n: number) => `staff-inst-lakeside-${n}`;
export const sciStaff = (n: number) => `staff-inst-mer-sci-${n}`;
export const hzaStaff = (n: number) => `staff-inst-horizon-a-${n}`;
export const seed = (scopeId: string, data: Record<string, unknown>, status?: string) => ({ scopeId, data, status });
export const GRADES = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

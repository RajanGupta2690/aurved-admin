import SectionNav from '../../access/components/SectionNav';
import { STAFF_PAGES } from '../sections';

export default function StaffNav() {
  return <SectionNav label="Staff pages" items={STAFF_PAGES} />;
}

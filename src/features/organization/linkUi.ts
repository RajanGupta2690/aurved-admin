import { inboxActions } from '../../core/api/inboxStore';
import type { LinkRequest } from '../../core/org/model';
import { parentInstitutionOf } from '../../core/org/ops';
import type { Institution } from '../../core/org/types';

export const LINK_TONE: Record<LinkRequest['status'], 'warning' | 'info' | 'success' | 'danger' | 'neutral'> = {
  awaiting_consent: 'warning',
  in_verification: 'info',
  awaiting_approval: 'info',
  approved: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
};

/** Tells the people of an organization that something happened. Goes to its main institution, or the first one. */
export function notifyOrganization(institutions: Institution[], orgId: string, title: string, detail: string) {
  const target = parentInstitutionOf(institutions, orgId) ?? institutions.find((inst) => inst.orgId === orgId);
  if (target) inboxActions.notify(target.id, title, detail);
}

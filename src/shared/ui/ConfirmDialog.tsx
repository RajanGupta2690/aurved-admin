import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import Button from './Button';
import { TextareaField } from './Field';
import { Dialog } from './Overlay';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  /** Receives the reason when requireReason is set. */
  onConfirm: (reason: string) => void;
  title: string;
  message: string;
  /** Name of the record, shown in bold. */
  itemName?: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  /** Ask for a written reason before the action can be confirmed. Use for sensitive changes. */
  requireReason?: boolean;
  reasonLabel?: string;
  /** Extra line under the message, for example what can be undone. */
  note?: string;
}

/**
 * Confirmation for destructive and sensitive actions. Say what will happen, in the button too.
 * Records that must be kept are archived, so use confirmLabel="Archive" and not "Delete" for those.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  confirmLabel = 'Confirm',
  tone = 'danger',
  requireReason = false,
  reasonLabel = 'Reason',
  note,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const missing = requireReason && reason.trim().length < 3;

  const close = () => {
    setReason('');
    setTouched(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={title}
      size="sm"
      footer={
        <>
          <Button onClick={close} data-autofocus="true">
            Cancel
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              if (missing) {
                setTouched(true);
                return;
              }
              onConfirm(reason.trim());
              close();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div className={tone === 'danger' ? 'rounded-full bg-danger-50 p-3 h-fit' : 'rounded-full bg-primary-50 p-3 h-fit'}>
          <TriangleAlert size={22} className={tone === 'danger' ? 'text-danger-700' : 'text-primary-700'} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm text-charcoal-700">{message}</p>
          {itemName && <p className="text-sm font-semibold text-charcoal-950 break-words">{itemName}</p>}
          {note && <p className="text-xs text-charcoal-600">{note}</p>}
          {requireReason && (
            <TextareaField
              label={reasonLabel}
              required
              rows={3}
              value={reason}
              onChange={(value) => setReason(value)}
              error={touched && missing ? 'Write a reason (at least 3 characters).' : undefined}
            />
          )}
        </div>
      </div>
    </Dialog>
  );
}

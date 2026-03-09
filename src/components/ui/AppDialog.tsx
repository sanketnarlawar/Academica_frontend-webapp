type AppDialogProps = {
  open: boolean;
  title: string;
  message: string;
  mode?: 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose: () => void;
};

export default function AppDialog({
  open,
  title,
  message,
  mode = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onClose,
}: AppDialogProps) {
  if (!open) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content max-w-lg">
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-slate-300 leading-relaxed">{message}</p>

        <div className="flex gap-3 mt-6">
          {mode === 'confirm' && (
            <button onClick={onClose} className="btn-secondary flex-1">
              {cancelText}
            </button>
          )}
          <button onClick={handleConfirm} className="btn-primary flex-1">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

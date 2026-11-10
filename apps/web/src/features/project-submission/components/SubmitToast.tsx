interface SubmitToastProps {
  visible: boolean;
  message: string;
  onClose: () => void;
}

export function SubmitToast({ visible, message, onClose }: SubmitToastProps) {
  if (!visible) return null;

  return (
    <div className="toast toast-end toast-bottom z-50">
      <div role="status" className="alert alert-success">
        <span className="material-symbols-outlined">check_circle</span>
        <span>{message}</span>
        <button type="button" onClick={onClose} aria-label="Cerrar notificación" className="btn btn-ghost btn-xs">
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
}

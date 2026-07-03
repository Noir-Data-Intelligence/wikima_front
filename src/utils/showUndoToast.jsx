import { toast } from 'sonner';

export function showUndoToast({ message, onUndo, duration = 4000 }) {
  const toastId = toast.custom(
    (t) => (
      <div className="flex items-center justify-between gap-4 bg-[#0d1829] border border-border rounded-xl px-4 py-3 shadow-xl">
        <span className="text-foreground text-sm font-medium">{message}</span>
        <button
          onClick={() => {
            onUndo();
            toast.dismiss(t.id);
          }}
          className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          Undo
        </button>
      </div>
    ),
    {
      duration,
    }
  );
  return toastId;
}
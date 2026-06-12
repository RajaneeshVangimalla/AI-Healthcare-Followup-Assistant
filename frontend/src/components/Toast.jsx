function Toast({ toast, onClose }) {
  if (!toast) {
    return null;
  }

  const tone =
    toast.type === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm font-semibold shadow-lg ${tone}`}
      role="status"
    >
      <span>{toast.message}</span>
      <button
        type="button"
        className="rounded p-1 text-current hover:bg-white/70"
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        x
      </button>
    </div>
  );
}

export default Toast;

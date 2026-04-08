const toneClasses = {
  neutral:
    "border-slate-200 bg-white/90 text-slate-700 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100",
  danger:
    "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100",
};

const StatePanel = ({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  tone = "neutral",
}) => (
  <div
    className={`rounded-3xl border px-6 py-10 text-center shadow-sm ${toneClasses[tone]}`}
  >
    {eyebrow ? (
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
        {eyebrow}
      </p>
    ) : null}
    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-300">
      {description}
    </p>
    {actionLabel && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
      >
        {actionLabel}
      </button>
    ) : null}
  </div>
);

export default StatePanel;

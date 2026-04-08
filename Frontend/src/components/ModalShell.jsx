import { useEffect, useRef, useState } from "react";

const ANIMATION_DURATION_MS = 180;

const ModalShell = ({
  eyebrow,
  title,
  description,
  onClose,
  children,
  size = "max-w-xl",
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    const autoFocusTarget =
      document.querySelector('[data-autofocus="true"]') ??
      document.querySelector(
        '.modal-shell input, .modal-shell textarea, .modal-shell select, .modal-shell button'
      );

    autoFocusTarget?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleRequestClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleRequestClose = () => {
    setIsClosing(true);

    closeTimeoutRef.current = setTimeout(() => {
      onClose();
    }, ANIMATION_DURATION_MS);
  };

  return (
    <div
      className={`modal-shell fixed inset-0 z-50 flex items-center justify-center px-4 py-8 transition-all duration-200 ${
        isClosing
          ? "bg-slate-950/0 backdrop-blur-none"
          : "bg-slate-950/45 backdrop-blur-sm dark:bg-slate-950/70"
      }`}
      onMouseDown={handleRequestClose}
    >
      <div
        className={`w-full ${size} rounded-[32px] border border-white/70 bg-white p-6 shadow-2xl transition-all duration-200 dark:border-slate-700 dark:bg-slate-900 ${
          isClosing ? "scale-[0.98] opacity-0" : "scale-100 opacity-100"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                {eyebrow}
              </p>
            ) : null}
            <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{title}</h3>
            {description ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
          >
            Fechar
          </button>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
};

export default ModalShell;

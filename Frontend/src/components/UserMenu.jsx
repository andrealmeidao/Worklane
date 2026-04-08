import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

const getInitials = (name = "") =>
  String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join("") || "US";

const UserMenu = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-left text-white transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-950">
          {initials}
        </span>
        <span className="hidden sm:block">
          <span className="block text-xs uppercase tracking-[0.18em] text-slate-300">Conta</span>
          <span className="block text-sm font-semibold text-white">{user?.name ?? "Usuário"}</span>
        </span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-20 mt-3 w-64 overflow-hidden rounded-[28px] border border-slate-200 bg-white p-2 shadow-2xl animate-modal-in dark:border-slate-700 dark:bg-slate-900">
          <div className="rounded-[22px] bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Perfil</p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{user?.email}</p>
          </div>

          <div className="mt-2 space-y-1">
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Dashboard
            </Link>
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Perfil
            </Link>
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Configurações
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UserMenu;

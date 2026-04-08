import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import UserMenu from "../components/UserMenu";

const Settings = () => {
  const { user, logout, updateCurrentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [theme, setTheme] = useState(user?.theme ?? "system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notificationsEnabled ?? true
  );
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    setTheme(user.theme ?? "system");
    setNotificationsEnabled(user.notificationsEnabled ?? true);
  }, [navigate, user]);

  const handlePreferencesSubmit = async (event) => {
    event.preventDefault();
    setIsSavingPreferences(true);

    try {
      await updateCurrentUser(
        {
          theme,
          notificationsEnabled,
        },
        {
          successMessage: "Configuracoes atualizadas com sucesso!",
          errorMessage: "Erro ao atualizar configuracoes",
        }
      );
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setIsSavingPassword(true);

    try {
      await updateCurrentUser(
        { currentPassword, newPassword },
        {
          successMessage: "Senha atualizada com sucesso!",
          errorMessage: "Erro ao atualizar senha",
        }
      );
      setCurrentPassword("");
      setNewPassword("");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[36px] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-900/15 sm:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                <Link
                  to="/dashboard"
                  className="rounded-full border border-white/15 px-3 py-1.5 transition hover:border-white/30 hover:text-white"
                >
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-sky-300">Configuracoes</span>
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
                Preferencias
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                Controle a conta e o comportamento.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Configuracoes servem para definir seguranca, preferencia visual e operacao da
                conta.
              </p>
            </div>

            <UserMenu user={user} onLogout={logout} />
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Preferencias do sistema
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Experiencia do workspace</h2>
            <form onSubmit={handlePreferencesSubmit} className="mt-6 space-y-5">
              <div className="rounded-[28px] bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Tema</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Preferencia visual persistida na conta e recarregada em cada sessao.
                    </p>
                  </div>
                  <select
                    value={theme}
                    onChange={(event) => setTheme(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400"
                  >
                    <option value="system">Sistema</option>
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                  </select>
                </div>
              </div>

              <div className="rounded-[28px] bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Notificacoes basicas</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Mantem sua conta preparada para avisos de atribuicao, comentarios e prazo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificationsEnabled((currentValue) => !currentValue)}
                    className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                      notificationsEnabled
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {notificationsEnabled ? "Ativas" : "Pausadas"}
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Sessao</p>
                <p className="mt-1 text-sm text-slate-500">
                  Encerre rapidamente sua conta neste dispositivo quando terminar.
                </p>
                <button
                  type="button"
                  onClick={logout}
                  className="mt-4 inline-flex items-center justify-center rounded-2xl border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Sair da conta
                </button>
              </div>

              <button
                type="submit"
                disabled={isSavingPreferences}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSavingPreferences ? "Salvando..." : "Salvar configuracoes"}
              </button>
            </form>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Seguranca
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Alterar senha</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Configuracoes sao o lugar certo para decidir como a conta opera e como ela se
              protege.
            </p>

            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Senha atual</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Nova senha</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Minimo de 8 caracteres"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </label>

              <button
                type="submit"
                disabled={isSavingPassword}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSavingPassword ? "Salvando..." : "Atualizar senha"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;

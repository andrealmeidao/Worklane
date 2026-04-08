import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      // O erro já é tratado no contexto.
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/60 bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-[1.1fr_0.9fr] dark:border-slate-800 dark:bg-slate-900">
        <section className="hidden bg-slate-950 px-10 py-12 text-white lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
            Kanban Workspace
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight">
            Organize entregas com uma visão clara do fluxo.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
            Entre para acompanhar boards, mover tarefas entre colunas e manter o time sincronizado
            em uma experiência visual mais consistente.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm text-slate-300">Boards centralizados</p>
              <p className="mt-2 text-2xl font-semibold text-white">Projetos em um so lugar</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm text-slate-300">Fluxo visual</p>
              <p className="mt-2 text-2xl font-semibold text-white">Execução mais previsível</p>
            </div>
          </div>
        </section>

        <section className="px-6 py-8 sm:px-10 sm:py-12">
          <div className="mx-auto max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
              Acessar conta
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">Entrar no workspace</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">
              Use seu email e senha para abrir o dashboard e continuar de onde parou.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  autoFocus
                  placeholder="você@empresa.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Senha</span>
                <input
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
                  required
                />
              </label>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
              >
                Entrar
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500 dark:text-slate-300">
              Ainda não tem conta?{" "}
              <Link to="/register" className="font-semibold text-sky-700 transition hover:text-sky-900">
                Criar cadastro
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;

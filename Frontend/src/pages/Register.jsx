import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (error) {
      // O erro já é tratado no contexto.
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/60 bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-[1.1fr_0.9fr] dark:border-slate-800 dark:bg-slate-900">
        <section className="hidden bg-sky-950 px-10 py-12 text-white lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
            Novo acesso
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight">
            Configure seu espaço e comece a estruturar o trabalho.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-sky-100/80">
            Crie uma conta para abrir boards, organizar backlog e transformar tarefas dispersas em
            um fluxo mais confiável.
          </p>

          <div className="mt-10 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm text-sky-100/80">1. Crie seu primeiro board</p>
              <p className="mt-2 text-2xl font-semibold text-white">Planejamento centralizado</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm text-sky-100/80">2. Adicione colunas e tarefas</p>
              <p className="mt-2 text-2xl font-semibold text-white">Fluxo claro para o time</p>
            </div>
          </div>
        </section>

        <section className="px-6 py-8 sm:px-10 sm:py-12">
          <div className="mx-auto max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
              Criar conta
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">Abrir novo workspace</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">
              Preencha seus dados para iniciar o dashboard e criar seu primeiro board.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Nome</span>
                <input
                  type="text"
                  autoFocus
                  placeholder="Seu nome"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
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
                  placeholder="Mínimo de 8 caracteres"
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
                Criar conta
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-500 dark:text-slate-300">
              Ja possui conta?{" "}
              <Link to="/login" className="font-semibold text-sky-700 transition hover:text-sky-900">
                Fazer login
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;

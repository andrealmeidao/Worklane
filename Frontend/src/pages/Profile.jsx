import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import UserMenu from "../components/UserMenu";

const getInitials = (name = "") =>
  String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join("") || "US";

const Profile = () => {
  const { user, logout, updateCurrentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    setName(user.name ?? "");
    setBio(user.bio ?? "");
    setJobTitle(user.jobTitle ?? "");
    setAvatarUrl(user.avatarUrl ?? "");
  }, [navigate, user]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);

    try {
      await updateCurrentUser(
        {
          name,
          bio,
          jobTitle,
          avatarUrl,
        },
        {
          successMessage: "Perfil atualizado com sucesso!",
          errorMessage: "Erro ao atualizar perfil",
        }
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const displayedName = user?.name ?? name;
  const displayedJobTitle = user?.jobTitle || jobTitle || "Adicione seu cargo";
  const displayedBio =
    user?.bio ||
    bio ||
    "Adicione uma breve descrição profissional para contextualizar sua participação no workspace.";

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
                <span className="text-sky-300">Perfil</span>
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
                Identidade
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                Perfil do usuario.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Centralize informacoes que representam voce no workspace e deixe a conta mais
                profissional.
              </p>
            </div>

            <UserMenu user={user} onLogout={logout} />
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Identidade visual
            </p>
            <div className="mt-6 flex items-center gap-5">
              {user?.avatarUrl || avatarUrl ? (
                <img
                  src={user?.avatarUrl || avatarUrl}
                  alt={`Avatar de ${displayedName}`}
                  className="h-24 w-24 rounded-[28px] object-cover"
                />
              ) : (
                <div className="inline-flex h-24 w-24 items-center justify-center rounded-[28px] bg-slate-950 text-2xl font-semibold text-white">
                  {getInitials(displayedName)}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{displayedName}</h2>
                <p className="mt-2 text-sm text-slate-500">{user?.email}</p>
                <p className="mt-3 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Conta ativa
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4 rounded-[28px] bg-slate-50 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Cargo
                </p>
                <p className="mt-2 text-sm font-medium text-slate-700">{displayedJobTitle}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Bio
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{displayedBio}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Avatar
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Estrutura pronta para avatar real no futuro. Por enquanto, voce pode salvar uma
                  URL externa.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Editar perfil
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Atualize seus dados</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Perfil e a area sobre quem voce e. Aqui faz sentido ajustar nome, cargo, avatar e
              apresentacao.
            </p>

            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Nome</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Cargo</span>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                  placeholder="Ex.: Product Designer"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  URL do avatar
                </span>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Bio</span>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  value={user?.email ?? ""}
                  disabled
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSavingProfile ? "Salvando..." : "Salvar perfil"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;

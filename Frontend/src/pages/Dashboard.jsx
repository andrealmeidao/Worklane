import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ModalShell from "../components/ModalShell";
import StatePanel from "../components/StatePanel";
import UserMenu from "../components/UserMenu";
import AuthContext from "../context/AuthContext";
import api, { isSessionError } from "../lib/api";

const DashboardSkeleton = () => (
  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={index}
        className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="h-4 w-24 rounded-full bg-slate-200" />
        <div className="mt-4 h-7 w-40 rounded-full bg-slate-200" />
        <div className="mt-3 h-4 w-full rounded-full bg-slate-100" />
        <div className="mt-2 h-4 w-5/6 rounded-full bg-slate-100" />
        <div className="mt-8 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((__, statIndex) => (
            <div key={statIndex} className="rounded-2xl bg-slate-50 p-3">
              <div className="h-3 w-14 rounded-full bg-slate-200" />
              <div className="mt-2 h-5 w-8 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const StatCard = ({ label, value, accent }) => (
  <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className={`mt-3 text-3xl font-semibold ${accent}`}>{value}</p>
  </div>
);

const getColumnTasks = (column) => column?.tasks ?? [];
const normalizeText = (value) => String(value ?? "").toLowerCase();

const BoardCard = ({ board, currentUserId, isLastViewed, onEdit, onDelete }) => {
  const taskCount = board.columns.reduce((count, column) => count + getColumnTasks(column).length, 0);
  const completedTaskCount = board.columns.reduce((count, column) => {
    const normalizedTitle = normalizeText(column.title);
    const doneColumn =
      normalizedTitle.includes("done") ||
      normalizedTitle.includes("concluido") ||
      normalizedTitle.includes("finalizado");

    return count + (doneColumn ? getColumnTasks(column).length : 0);
  }, 0);
  const progress = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;
  const currentUserMembership = board.members.find((member) => member.userId === currentUserId);
  const canEdit = ["OWNER", "ADMIN"].includes(currentUserMembership?.role);
  const canDelete = currentUserMembership?.role === "OWNER";

  return (
    <article className={`group flex h-full flex-col rounded-3xl border bg-white p-6 shadow-sm transition-all duration-200 dark:bg-slate-900 ${
      isLastViewed
        ? "border-sky-300 shadow-lg shadow-sky-100 dark:border-sky-500 dark:shadow-sky-950/20"
        : "border-slate-200 dark:border-slate-800"
    } hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:hover:border-slate-700`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">Board</p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{board.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isLastViewed ? (
            <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:bg-sky-950/50 dark:text-sky-200">
              Continuar
            </span>
          ) : null}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {board.columns.length} colunas
          </span>
        </div>
      </div>

      <p className="mt-4 min-h-[48px] text-sm leading-6 text-slate-500 dark:text-slate-300">
        {board.description || "Organize etapas, tarefas e comentários do projeto em um fluxo visual."}
      </p>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
          <span>Progresso</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/80">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Membros</p>
          <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{board.members.length}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/80">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Tarefas</p>
          <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{taskCount}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/80">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Criado</p>
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
            {new Date(board.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Link
          to={`/board/${board.id}`}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
        >
          Abrir board
        </Link>

        {canEdit ? (
          <button
            type="button"
            onClick={() => onEdit(board)}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Editar
          </button>
        ) : null}

        {canDelete ? (
          <button
            type="button"
            onClick={() => onDelete(board)}
            className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/40"
          >
            Excluir
          </button>
        ) : null}
      </div>
    </article>
  );
};

const Dashboard = () => {
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingBoard, setIsUpdatingBoard] = useState(false);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [boardEditor, setBoardEditor] = useState(null);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [lastBoardId] = useState(() => localStorage.getItem("last-board-id"));
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchBoards = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await api.get("/boards");
      setBoards(res.data);
    } catch (error) {
      if (isSessionError(error)) {
        setErrorMessage("Sua sessão expirou. Faça login novamente.");
        return;
      }

      const nextError = error.response?.data?.error ?? "Não foi possível carregar os boards.";
      setErrorMessage(nextError);
      toast.error(nextError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchBoards();
  }, [fetchBoards, navigate, user]);

  const handleCreateBoard = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error("Informe um título para o board.");
      return;
    }

    setIsCreating(true);

    try {
      await api.post("/boards", {
        title,
        description,
      });
      setTitle("");
      setDescription("");
      await fetchBoards();
      toast.success("Board criado com sucesso.");
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao criar board.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveBoard = async (event) => {
    event.preventDefault();

    if (!boardEditor?.title.trim()) {
      toast.error("Informe o título do board.");
      return;
    }

    setIsUpdatingBoard(true);

    try {
      const res = await api.put(`/boards/${boardEditor.id}`, {
        title: boardEditor.title,
        description: boardEditor.description,
      });

      setBoards((currentBoards) =>
        currentBoards.map((board) => (board.id === res.data.id ? res.data : board))
      );
      setBoardEditor(null);
      toast.success("Board atualizado com sucesso.");
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao atualizar board.");
    } finally {
      setIsUpdatingBoard(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!boardToDelete) {
      return;
    }

    setIsDeletingBoard(true);

    try {
      await api.delete(`/boards/${boardToDelete.id}`);
      setBoards((currentBoards) => currentBoards.filter((board) => board.id !== boardToDelete.id));
      setBoardToDelete(null);
      toast.success("Board excluido com sucesso.");
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao excluir board.");
    } finally {
      setIsDeletingBoard(false);
    }
  };

  const totals = useMemo(() => {
    const totalBoards = boards.length;
    const totalColumns = boards.reduce((count, board) => count + board.columns.length, 0);
    const totalTasks = boards.reduce(
      (count, board) =>
        count +
        board.columns.reduce((columnCount, column) => columnCount + getColumnTasks(column).length, 0),
      0
    );
    const completedTasks = boards.reduce(
      (count, board) =>
        count +
        board.columns.reduce((columnCount, column) => {
          const normalizedTitle = normalizeText(column.title);
          const doneColumn =
            normalizedTitle.includes("done") ||
            normalizedTitle.includes("concluido") ||
            normalizedTitle.includes("finalizado");

          return columnCount + (doneColumn ? getColumnTasks(column).length : 0);
        }, 0),
      0
    );

    return {
      totalBoards,
      totalColumns,
      totalTasks,
      completionRate:
        totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : "0%",
    };
  }, [boards]);

  const lastViewedBoard = useMemo(
    () => boards.find((board) => board.id === lastBoardId) ?? null,
    [boards, lastBoardId]
  );

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[32px] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-900/15 sm:px-8 dark:border dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                Kanban Workspace
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                {user ? `Bem-vindo, ${user.name}.` : "Seu painel de trabalho."}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Acompanhe boards, edite prioridades e mantenha o fluxo do time claro em uma
                experiência mais profissional.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {lastViewedBoard ? (
                <Link
                  to={`/board/${lastViewedBoard.id}`}
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Retomar ultimo board
                </Link>
              ) : null}
              <button
                type="button"
                onClick={fetchBoards}
                className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Atualizar
              </button>
              <UserMenu user={user} onLogout={logout} />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Boards ativos" value={totals.totalBoards} accent="text-white" />
            <StatCard label="Colunas" value={totals.totalColumns} accent="text-sky-300" />
            <StatCard label="Tarefas" value={totals.totalTasks} accent="text-emerald-300" />
            <StatCard label="Entrega" value={totals.completionRate} accent="text-amber-300" />
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_2fr]">
          <form
            onSubmit={handleCreateBoard}
            className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Novo board
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Crie um espaço para o próximo projeto
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                Rápido
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Título</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex.: Redesign do produto"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Descrição</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  placeholder="Resuma objetivo, contexto ou time responsável."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isCreating ? "Criando board..." : "+ Criar board"}
            </button>
          </form>

          <section>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Boards
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Seus quadros recentes
                </h2>
              </div>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm">
                {boards.length} itens
              </span>
            </div>

            {isLoading ? <DashboardSkeleton /> : null}

            {!isLoading && errorMessage ? (
              <StatePanel
                eyebrow="Falha no carregamento"
                title="Não foi possível abrir o dashboard."
                description={errorMessage}
                actionLabel="Tentar novamente"
                onAction={fetchBoards}
                tone="danger"
              />
            ) : null}

            {!isLoading && !errorMessage && boards.length === 0 ? (
              <StatePanel
                eyebrow="Sem boards"
                title="Seu workspace esta vazio."
                description="Crie o primeiro board ao lado para organizar backlog, execução e entregas."
              />
            ) : null}

            {!isLoading && !errorMessage && boards.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
                {boards.map((board) => (
                  <BoardCard
                    key={board.id}
                    board={board}
                    currentUserId={user?.id}
                    isLastViewed={board.id === lastBoardId}
                    onEdit={(nextBoard) =>
                      setBoardEditor({
                        id: nextBoard.id,
                        title: nextBoard.title,
                        description: nextBoard.description ?? "",
                      })
                    }
                    onDelete={setBoardToDelete}
                  />
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </div>

      {boardEditor ? (
        <ModalShell
          eyebrow="Editar board"
          title="Atualize o contexto do board"
          description="Refine nome e descrição sem perder o histórico do trabalho."
          onClose={() => setBoardEditor(null)}
        >
          <form onSubmit={handleSaveBoard} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Título</span>
              <input
                type="text"
                value={boardEditor.title}
                onChange={(event) =>
                  setBoardEditor((currentValue) => ({
                    ...currentValue,
                    title: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Descrição</span>
              <textarea
                value={boardEditor.description}
                onChange={(event) =>
                  setBoardEditor((currentValue) => ({
                    ...currentValue,
                    description: event.target.value,
                  }))
                }
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
              />
            </label>

            <button
              type="submit"
              disabled={isUpdatingBoard}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isUpdatingBoard ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        </ModalShell>
      ) : null}

      {boardToDelete ? (
        <ModalShell
          eyebrow="Excluir board"
          title={`Excluir "${boardToDelete.title}"?`}
          description="Essa ação remove colunas, tarefas e comentários associados. Não é possível desfazer."
          onClose={() => setBoardToDelete(null)}
        >
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDeleteBoard}
              disabled={isDeletingBoard}
              className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
            >
              {isDeletingBoard ? "Excluindo..." : "Confirmar exclusão"}
            </button>
            <button
              type="button"
              onClick={() => setBoardToDelete(null)}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
};

export default Dashboard;

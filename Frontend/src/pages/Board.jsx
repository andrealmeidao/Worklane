import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import toast from "react-hot-toast";
import ModalShell from "../components/ModalShell";
import StatePanel from "../components/StatePanel";
import UserMenu from "../components/UserMenu";
import AuthContext from "../context/AuthContext";
import api, { isSessionError } from "../lib/api";

const isDoneColumnTitle = (title = "") => {
  const normalizedTitle = String(title ?? "").toLowerCase();

  return (
    normalizedTitle.includes("done") ||
    normalizedTitle.includes("concluido") ||
    normalizedTitle.includes("finalizado")
  );
};

const getAssigneeInitials = (name = "") =>
  String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join("") || "NA";

const getPriorityTone = (priority = "") => {
  const normalizedPriority = String(priority ?? "").toLowerCase();

  if (normalizedPriority.includes("alta") || normalizedPriority.includes("high")) {
    return {
      badge: "bg-rose-50 text-rose-700",
      rail: "bg-rose-400",
    };
  }

  if (normalizedPriority.includes("media") || normalizedPriority.includes("medium")) {
    return {
      badge: "bg-amber-50 text-amber-700",
      rail: "bg-amber-400",
    };
  }

  if (normalizedPriority.includes("baixa") || normalizedPriority.includes("low")) {
    return {
      badge: "bg-emerald-50 text-emerald-700",
      rail: "bg-emerald-400",
    };
  }

  return {
    badge: "bg-slate-100 text-slate-600",
    rail: "bg-slate-300",
  };
};

const getDueDateTone = (value) => {
  if (!value) {
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(value);
  dueDate.setHours(0, 0, 0, 0);
  const diffInDays = Math.round((dueDate - today) / 86400000);

  if (diffInDays < 0) {
    return "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200";
  }

  if (diffInDays <= 2) {
    return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200";
  }

  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
};

const getColumnTasks = (column) => column?.tasks ?? [];
const getTaskSortableId = (taskId) => `task-${taskId}`;
const getColumnSortableId = (columnId) => `column-${columnId}`;
const getColumnDropId = (columnId) => `column-drop-${columnId}`;
const extractSortableEntityId = (value, prefix) =>
  String(value ?? "").startsWith(prefix) ? String(value).slice(prefix.length) : null;
const formatDueDate = (value) =>
  value ? new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : null;
const getRoleLabel = (role) =>
  ({
    OWNER: "Owner",
    ADMIN: "Admin",
    MEMBER: "Member",
  })[role] ?? role;
const managerRoles = ["OWNER", "ADMIN"];
const priorityFilterOptions = [
  { value: "", label: "Todas as prioridades" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
const dueDateFilterOptions = [
  { value: "", label: "Todos os prazos" },
  { value: "none", label: "Sem prazo" },
  { value: "overdue", label: "Atrasadas" },
  { value: "today", label: "Vencem hoje" },
  { value: "upcoming", label: "Proximas" },
];

const FilterChipGroup = ({ label, value, options, onChange }) => (
  <div>
    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
      {label}
    </p>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value || "all"}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
              isActive
                ? "border-sky-500 bg-sky-500 text-white shadow-sm shadow-sky-500/20"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  </div>
);

const BoardSkeleton = () => (
  <div className="overflow-x-auto pb-4">
    <div className="flex min-w-full gap-5">
      {Array.from({ length: 4 }).map((_, columnIndex) => (
        <div
          key={columnIndex}
          className="h-[calc(100vh-18rem)] min-h-[620px] w-[340px] min-w-[340px] animate-pulse rounded-[30px] border border-slate-200 bg-white/85 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="h-4 w-16 rounded-full bg-slate-200" />
              <div className="mt-3 h-6 w-32 rounded-full bg-slate-200" />
            </div>
            <div className="h-8 w-20 rounded-full bg-slate-100" />
          </div>

          <div className="mt-5 h-11 rounded-2xl bg-slate-100" />

          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((__, taskIndex) => (
              <div
                key={taskIndex}
                className="rounded-[28px] border border-slate-100 bg-slate-50 p-4"
              >
                <div className="h-4 w-28 rounded-full bg-slate-200" />
                <div className="mt-3 h-4 w-full rounded-full bg-slate-100" />
                <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-100" />
                <div className="mt-4 flex gap-2">
                  <div className="h-7 w-16 rounded-full bg-slate-100" />
                  <div className="h-7 w-20 rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const getDueDateFilterMatch = (dueDate, dueStatus) => {
  if (!dueStatus) {
    return true;
  }

  if (!dueDate) {
    return dueStatus === "none";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const normalizedDueDate = new Date(dueDate);
  normalizedDueDate.setHours(0, 0, 0, 0);

  if (dueStatus === "none") {
    return false;
  }

  if (dueStatus === "overdue") {
    return normalizedDueDate < today;
  }

  if (dueStatus === "today") {
    return normalizedDueDate.getTime() === today.getTime();
  }

  if (dueStatus === "upcoming") {
    return normalizedDueDate >= tomorrow;
  }

  return true;
};

const taskMatchesFilters = (task, filters) => {
  const assigneeMatch =
    !filters.assigneeId || (task.assigneeId ?? task.assignee?.id ?? "") === filters.assigneeId;
  const priorityMatch = !filters.priority || String(task.priority ?? "") === filters.priority;
  const dueDateMatch = getDueDateFilterMatch(task.dueDate, filters.dueStatus);

  return assigneeMatch && priorityMatch && dueDateMatch;
};

const BoardFilters = ({
  filters,
  members,
  hiddenTaskCount,
  visibleTaskCount,
  onChange,
  onClear,
}) => (
  <div className="mb-4 rounded-[28px] border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="grid gap-4 xl:flex-1">
        <div className="overflow-x-auto pb-1">
          <FilterChipGroup
            label="Responsavel"
            value={filters.assigneeId}
            options={[
              { value: "", label: "Todos" },
              ...members.map((member) => ({
                value: member.userId,
                label: member.user.name,
              })),
            ]}
            onChange={(value) => onChange("assigneeId", value)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <FilterChipGroup
            label="Prioridade"
            value={filters.priority}
            options={priorityFilterOptions}
            onChange={(value) => onChange("priority", value)}
          />
          <FilterChipGroup
            label="Prazo"
            value={filters.dueStatus}
            options={dueDateFilterOptions}
            onChange={(value) => onChange("dueStatus", value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 xl:justify-end">
        <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {visibleTaskCount} visiveis
          {hiddenTaskCount > 0 ? ` · ${hiddenTaskCount} ocultas` : ""}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  </div>
);

const SortableTask = ({
  task,
  isDeleting,
  isRecentlyCreated,
  onEdit,
  onDelete,
  onViewComments,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: getTaskSortableId(task.id),
  });

  const priorityTone = getPriorityTone(task.priority);
  const dueDateTone = getDueDateTone(task.dueDate);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 ${
        isRecentlyCreated ? "animate-task-in" : ""
      } ${isDeleting ? "animate-task-out pointer-events-none" : ""} ${
        isDragging
          ? "scale-[1.02] rotate-[1deg] border-sky-300 shadow-2xl shadow-sky-200/60 dark:border-sky-500 dark:shadow-sky-900/30"
          : "hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/70 dark:hover:border-slate-700 dark:hover:shadow-black/20"
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${priorityTone.rail}`} />

      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Tarefa
            </span>
            {task.priority ? (
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityTone.badge}`}>
                {task.priority}
              </span>
            ) : null}
          </div>
          <h4 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{task.title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
            {task.description || "Sem descrição adicional para esta entrega."}
          </p>
        </div>

        <button
          type="button"
          {...attributes}
          {...listeners}
          className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-2xl border border-slate-200 text-slate-400 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-500 dark:hover:border-slate-600 dark:hover:text-slate-200"
          aria-label={`Mover tarefa ${task.title}`}
        >
          ::
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 pl-2">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-xs font-semibold text-white dark:bg-sky-500 dark:text-slate-950">
            {task.assignee ? getAssigneeInitials(task.assignee.name) : "NA"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Responsável
            </p>
            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
              {task.assignee?.name ?? "Não atribuído"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onViewComments(task)}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          Comentários
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 pl-2">
        {task.dueDate ? (
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${dueDateTone}`}>
            Prazo {formatDueDate(task.dueDate)}
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 pl-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-full bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="rounded-full border border-rose-200 px-3.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/40"
        >
          Excluir
        </button>
      </div>
    </article>
  );
};

const MemberAvatarCluster = ({ members, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-3 py-2 transition hover:border-white/30 hover:bg-white/15"
  >
    <div className="flex -space-x-2">
      {members.slice(0, 4).map((member) => (
        <span
          key={member.id}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-950 bg-white text-xs font-semibold text-slate-950"
        >
          {getAssigneeInitials(member.user?.name)}
        </span>
      ))}
    </div>
    <div className="text-left text-white">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Time</p>
      <p className="text-sm font-semibold">{members.length} membros</p>
    </div>
  </button>
);

const TaskComposer = ({
  columnId,
  draft,
  members,
  onDraftChange,
  onToggleComposer,
  onCreateTask,
}) => {
  if (!draft.isOpen) {
    return (
      <button
        type="button"
        onClick={() => onToggleComposer(columnId, true)}
        className="inline-flex w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
      >
        + Nova tarefa
      </button>
    );
  }

  return (
    <div className="animate-task-in rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/80">
      <input
        type="text"
        autoFocus
        data-autofocus="true"
        value={draft.title}
        onChange={(event) => onDraftChange(columnId, "title", event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onCreateTask(columnId);
          }
        }}
        placeholder="Título da tarefa"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
      />
      <textarea
        value={draft.description}
        onChange={(event) => onDraftChange(columnId, "description", event.target.value)}
        rows={3}
        placeholder="Contexto rápido ou descrição opcional"
        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
      />

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            Prioridade
          </span>
          <select
            value={draft.priority}
            onChange={(event) => onDraftChange(columnId, "priority", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">Sem prioridade</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            Prazo
          </span>
          <input
            type="date"
            value={draft.dueDate}
            onChange={(event) => onDraftChange(columnId, "dueDate", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
          Responsável
        </span>
        <select
          value={draft.assigneeId}
          onChange={(event) => onDraftChange(columnId, "assigneeId", event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <option value="">Sem responsável</option>
          {members.map((member) => (
            <option key={member.id} value={member.userId}>
              {member.user.name} · {getRoleLabel(member.role)}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCreateTask(columnId)}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
        >
          Criar tarefa
        </button>
        <button
          type="button"
          onClick={() => onToggleComposer(columnId, false)}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-950"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

const BoardColumn = ({
  column,
  draft,
  members,
  canManageColumn,
  filteredTasks,
  hasActiveFilters,
  hasHiddenTasks,
  deletingTaskId,
  recentlyCreatedTaskId,
  onDraftChange,
  onToggleComposer,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onOpenComments,
  onRenameColumn,
  onRequestDeleteColumn,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: getColumnSortableId(column.id),
  });
  const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
    id: getColumnDropId(column.id),
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`flex h-[calc(100vh-18rem)] min-h-[620px] w-[340px] min-w-[340px] flex-col rounded-[30px] border bg-white/92 p-5 shadow-sm backdrop-blur transition-all duration-200 dark:bg-slate-950/90 ${
        isDragging
          ? "border-sky-300 shadow-xl shadow-sky-100 dark:border-sky-500 dark:shadow-sky-950/30"
          : isOver
            ? "border-sky-300 shadow-lg shadow-sky-100 dark:border-sky-500 dark:shadow-sky-950/30"
            : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="sticky top-0 z-10 -mx-5 rounded-t-[30px] border-b border-slate-100 bg-white/95 px-5 pb-4 pt-1 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            Coluna
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{column.title}</h2>
        </div>
        <div className="relative flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {getColumnTasks(column).length} tarefas
          </span>
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-500 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-white"
            aria-label={`Mover coluna ${column.title}`}
          >
            ::
          </button>
          {canManageColumn ? (
            <>
              <button
                type="button"
                onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-lg font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-500 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-white"
              >
                ⋮
              </button>
              {isMenuOpen ? (
                <div className="absolute right-0 top-12 z-10 w-44 rounded-3xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRenameColumn(column);
                    }}
                    className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Editar nome
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRequestDeleteColumn(column);
                    }}
                    className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                  >
                    Excluir coluna
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
      </div>

      <div className="mt-5">
        <TaskComposer
          columnId={column.id}
          draft={draft}
          members={members}
          onDraftChange={onDraftChange}
          onToggleComposer={onToggleComposer}
          onCreateTask={onCreateTask}
        />
      </div>

      <SortableContext
        items={filteredTasks.map((task) => getTaskSortableId(task.id))}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setDropNodeRef} className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
          {filteredTasks.length === 0 ? (
            <div
              className={`rounded-[28px] border border-dashed px-4 py-10 text-center text-sm transition ${
                isOver
                  ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-950/30 dark:text-sky-200"
                  : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400"
              }`}
            >
              {isOver
                ? "Solte a tarefa aqui."
                : hasActiveFilters
                  ? "Nenhuma tarefa corresponde aos filtros."
                  : "Nenhuma tarefa nesta coluna ainda. Crie sua primeira tarefa."}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                isDeleting={deletingTaskId === task.id}
                isRecentlyCreated={recentlyCreatedTaskId === task.id}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onViewComments={onOpenComments}
              />
            ))
          )}
          {hasHiddenTasks ? (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
              Algumas tarefas desta coluna estao ocultas pelos filtros ativos.
            </div>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
};

const AddColumnLane = ({
  newColumnTitle,
  isCreatingColumn,
  onTitleChange,
  onCreateColumn,
}) => (
  <section className="flex h-[calc(100vh-18rem)] min-h-[620px] w-[340px] min-w-[340px] flex-col rounded-[30px] border border-dashed border-slate-300 bg-white/65 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/55">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
        Expandir fluxo
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Adicionar nova coluna</h2>
      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">
        Crie uma nova etapa para backlog, execução, revisão ou entrega.
      </p>
    </div>

    <form onSubmit={onCreateColumn} className="mt-6 space-y-3">
      <input
        type="text"
        value={newColumnTitle}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Ex.: Em revisão"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
      />
      <button
        type="submit"
        disabled={isCreatingColumn}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400 dark:disabled:bg-slate-700"
      >
        {isCreatingColumn ? "Criando..." : "+ Nova coluna"}
      </button>
    </form>

    <div className="mt-auto rounded-[24px] bg-slate-50 p-4 dark:bg-slate-900/90">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Dica</p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        Boards melhores costumam ter etapas curtas e objetivas para manter o time alinhado.
      </p>
    </div>
  </section>
);

const EmptyBoardLane = () => (
  <div className="flex h-[calc(100vh-18rem)] min-h-[620px] w-[460px] min-w-[460px] flex-col justify-center rounded-[30px] border border-dashed border-slate-300 bg-white/70 p-8 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-950/60">
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Board vazio</p>
    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
      Monte a estrutura inicial do fluxo.
    </h2>
    <p className="mt-4 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-300">
      Adicione a primeira coluna ao lado e transforme este espaço em um quadro de trabalho real,
      com etapas claras e tarefas distribuídas.
    </p>
  </div>
);

const Board = () => {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [members, setMembers] = useState([]);
  const [boardError, setBoardError] = useState("");
  const [isBoardLoading, setIsBoardLoading] = useState(true);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [filters, setFilters] = useState({
    assigneeId: "",
    priority: "",
    dueStatus: "",
  });
  const [taskDrafts, setTaskDrafts] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("MEMBER");
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [boardEditor, setBoardEditor] = useState(null);
  const [isSavingBoard, setIsSavingBoard] = useState(false);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);
  const [columnEditor, setColumnEditor] = useState(null);
  const [isSavingColumn, setIsSavingColumn] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [isDeletingColumn, setIsDeletingColumn] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState("");
  const [recentlyCreatedTaskId, setRecentlyCreatedTaskId] = useState("");
  const [taskEditor, setTaskEditor] = useState(null);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isReorderingColumns, setIsReorderingColumns] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const boardScrollRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchBoard = useCallback(async () => {
    if (!id) {
      setBoardError("Board inválido.");
      setIsBoardLoading(false);
      return;
    }

    setIsBoardLoading(true);
    setBoardError("");

    try {
      const res = await api.get(`/boards/${id}`);
      setBoard(res.data);
      setColumns(res.data.columns ?? []);
      setMembers(res.data.members ?? []);
    } catch (error) {
      if (isSessionError(error)) {
        setBoardError("Sua sessão expirou. Faça login novamente.");
        return;
      }

      const nextError = error.response?.data?.error ?? "Não foi possível carregar o board.";
      setBoardError(nextError);
      toast.error(nextError);
    } finally {
      setIsBoardLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchBoard();
  }, [fetchBoard, navigate, user]);

  useEffect(() => {
    if (!id) {
      return;
    }

    localStorage.setItem("last-board-id", id);
  }, [id]);

  useEffect(() => {
    if (!id || !boardScrollRef.current) {
      return;
    }

    const storedScroll = localStorage.getItem(`board-scroll-${id}`);
    if (storedScroll) {
      boardScrollRef.current.scrollLeft = Number(storedScroll);
    }
  }, [columns.length, id]);

  useEffect(() => {
    if (!id || !boardScrollRef.current) {
      return undefined;
    }

    const scroller = boardScrollRef.current;
    const handleScroll = () => {
      localStorage.setItem(`board-scroll-${id}`, String(scroller.scrollLeft));
    };

    scroller.addEventListener("scroll", handleScroll);
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, [id]);

  useEffect(() => {
    if (!recentlyCreatedTaskId) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setRecentlyCreatedTaskId("");
    }, 1400);

    return () => window.clearTimeout(timeout);
  }, [recentlyCreatedTaskId]);

  const boardStats = useMemo(() => {
    const taskCount = columns.reduce((count, column) => count + getColumnTasks(column).length, 0);
    const completedTaskCount = columns.reduce(
      (count, column) =>
        count + (isDoneColumnTitle(column.title) ? getColumnTasks(column).length : 0),
      0
    );

    return {
      columnCount: columns.length,
      taskCount,
      memberCount: members.length,
      completedTaskCount,
      completionRate:
        taskCount > 0 ? `${Math.round((completedTaskCount / taskCount) * 100)}%` : "0%",
    };
  }, [columns, members.length]);

  const currentMember = useMemo(
    () => members.find((member) => member.userId === user?.id) ?? null,
    [members, user?.id]
  );
  const currentMemberRole = currentMember?.role ?? null;
  const canManageBoard = managerRoles.includes(currentMemberRole);
  const canDeleteBoard = currentMemberRole === "OWNER";
  const canManageMembers = managerRoles.includes(currentMemberRole);
  const hasActiveFilters = Boolean(filters.assigneeId || filters.priority || filters.dueStatus);

  const filteredColumns = useMemo(
    () =>
      columns.map((column) => {
        const allTasks = getColumnTasks(column);
        const visibleTasks = allTasks.filter((task) => taskMatchesFilters(task, filters));

        return {
          ...column,
          filteredTasks: visibleTasks,
          hiddenTaskCount: allTasks.length - visibleTasks.length,
        };
      }),
    [columns, filters]
  );

  const filteredTaskStats = useMemo(() => {
    const visibleTaskCount = filteredColumns.reduce(
      (count, column) => count + column.filteredTasks.length,
      0
    );
    const totalTaskCount = columns.reduce((count, column) => count + getColumnTasks(column).length, 0);

    return {
      visibleTaskCount,
      hiddenTaskCount: totalTaskCount - visibleTaskCount,
    };
  }, [columns, filteredColumns]);

  const setTaskDraft = (columnId, key, value) => {
    setTaskDrafts((currentDrafts) => ({
      ...currentDrafts,
      [columnId]: {
        ...currentDrafts[columnId],
        [key]: value,
      },
    }));
  };

  const toggleTaskComposer = (columnId, isOpen) => {
    setTaskDrafts((currentDrafts) => ({
      ...currentDrafts,
      [columnId]: {
        title: currentDrafts[columnId]?.title ?? "",
        description: currentDrafts[columnId]?.description ?? "",
        priority: currentDrafts[columnId]?.priority ?? "",
        dueDate: currentDrafts[columnId]?.dueDate ?? "",
        assigneeId: currentDrafts[columnId]?.assigneeId ?? "",
        isOpen,
      },
    }));
  };

  const resetTaskDraft = (columnId) => {
    setTaskDrafts((currentDrafts) => ({
      ...currentDrafts,
      [columnId]: {
        title: "",
        description: "",
        priority: "",
        dueDate: "",
        assigneeId: "",
        isOpen: false,
      },
    }));
  };

  const fetchMembers = useCallback(async () => {
    setIsMembersLoading(true);

    try {
      const res = await api.get(`/members/board/${id}`);
      setMembers(res.data);
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao carregar membros.");
    } finally {
      setIsMembersLoading(false);
    }
  }, [id]);

  const updateFilter = (key, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      assigneeId: "",
      priority: "",
      dueStatus: "",
    });
  };

  const getDropIndex = (tasks, overId) => {
    const matchedIndex = tasks.findIndex((task) => task.id === overId);
    return matchedIndex >= 0 ? matchedIndex : tasks.length;
  };

  const persistTaskOrder = async (tasksToPersist) => {
    if (tasksToPersist.length === 0) {
      return;
    }

    await Promise.all(
      tasksToPersist.map((task) =>
        api.put(`/tasks/${task.id}`, {
          columnId: task.columnId,
          order: task.order,
        })
      )
    );
  };

  const persistColumnOrder = async (nextColumns) => {
    await api.put(`/columns/board/${id}/reorder`, {
      columnIds: nextColumns.map((column) => column.id),
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeTaskId = extractSortableEntityId(active.id, "task-");
    const overTaskId = extractSortableEntityId(over.id, "task-");
    const activeColumnId = extractSortableEntityId(active.id, "column-");
    const overColumnId = extractSortableEntityId(over.id, "column-");
    const overDropColumnId = extractSortableEntityId(over.id, "column-drop-");

    if (activeColumnId && overColumnId) {
      const oldIndex = columns.findIndex((column) => column.id === activeColumnId);
      const newIndex = columns.findIndex((column) => column.id === overColumnId);

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return;
      }

      const reorderedColumns = arrayMove(columns, oldIndex, newIndex).map((column, index) => ({
        ...column,
        order: index + 1,
      }));

      setColumns(reorderedColumns);
      setIsReorderingColumns(true);

      try {
        await persistColumnOrder(reorderedColumns);
        toast.success("Ordem das colunas atualizada.");
      } catch (error) {
        if (isSessionError(error)) {
          return;
        }

        toast.error(error.response?.data?.error ?? "Erro ao reordenar colunas.");
        await fetchBoard();
      } finally {
        setIsReorderingColumns(false);
      }

      return;
    }

    if (!activeTaskId) {
      return;
    }

    let sourceColumn = null;
    let destinationColumn = null;

    for (const column of columns) {
      if (getColumnTasks(column).some((task) => task.id === activeTaskId)) {
        sourceColumn = column;
      }

      if (
        column.id === overColumnId ||
        column.id === overDropColumnId ||
        getColumnTasks(column).some((task) => task.id === overTaskId)
      ) {
        destinationColumn = column;
      }
    }

    if (!sourceColumn || !destinationColumn) {
      return;
    }

    try {
      if (hasActiveFilters && sourceColumn.id === destinationColumn.id) {
        toast("Limpe os filtros para reordenar tarefas dentro da mesma coluna.", {
          icon: "i",
        });
        return;
      }

      if (sourceColumn.id === destinationColumn.id) {
        const sourceColumnTasks = getColumnTasks(sourceColumn);
        const destinationColumnTasks = getColumnTasks(destinationColumn);
        const oldIndex = sourceColumnTasks.findIndex((task) => task.id === activeTaskId);
        const newIndex = getDropIndex(destinationColumnTasks, overTaskId);

        if (oldIndex === newIndex || oldIndex < 0) {
          return;
        }

        const reorderedTasks = arrayMove(sourceColumnTasks, oldIndex, newIndex).map((task, index) => ({
          ...task,
          order: index + 1,
          columnId: sourceColumn.id,
        }));

        setColumns((currentColumns) =>
          currentColumns.map((column) =>
            column.id === sourceColumn.id ? { ...column, tasks: reorderedTasks } : column
          )
        );

        await persistTaskOrder(reorderedTasks);
        return;
      }

      const sourceColumnTasks = getColumnTasks(sourceColumn);
      const destinationColumnTasks = getColumnTasks(destinationColumn);
      const movedTask = sourceColumnTasks.find((task) => task.id === activeTaskId);

      if (!movedTask) {
        return;
      }

      const sourceTasks = sourceColumnTasks
        .filter((task) => task.id !== activeTaskId)
        .map((task, index) => ({
          ...task,
          order: index + 1,
          columnId: sourceColumn.id,
        }));

      const destinationTasksBase = [...destinationColumnTasks];
      const destinationIndex = hasActiveFilters
        ? destinationTasksBase.length
        : getDropIndex(destinationTasksBase, overTaskId);
      destinationTasksBase.splice(destinationIndex, 0, {
        ...movedTask,
        columnId: destinationColumn.id,
      });

      const destinationTasks = destinationTasksBase.map((task, index) => ({
        ...task,
        order: index + 1,
        columnId: destinationColumn.id,
      }));

      setColumns((currentColumns) =>
        currentColumns.map((column) => {
          if (column.id === sourceColumn.id) {
            return { ...column, tasks: sourceTasks };
          }

          if (column.id === destinationColumn.id) {
            return { ...column, tasks: destinationTasks };
          }

          return column;
        })
      );

      await persistTaskOrder([...sourceTasks, ...destinationTasks]);
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao mover tarefa.");
      await fetchBoard();
    }
  };

  const handleCreateColumn = async (event) => {
    event.preventDefault();

    if (!newColumnTitle.trim()) {
      toast.error("Informe o nome da coluna.");
      return;
    }

    setIsCreatingColumn(true);

    try {
      await api.post(`/columns/board/${id}`, { title: newColumnTitle });
      setNewColumnTitle("");
      await fetchBoard();
      toast.success("Coluna criada com sucesso.");
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao criar coluna.");
    } finally {
      setIsCreatingColumn(false);
    }
  };

  const handleSaveColumn = async (event) => {
    event.preventDefault();

    if (!columnEditor?.title.trim()) {
      toast.error("Informe o nome da coluna.");
      return;
    }

    setIsSavingColumn(true);

    try {
      const res = await api.put(`/columns/${columnEditor.id}`, {
        title: columnEditor.title,
      });

      setColumns((currentColumns) =>
        currentColumns.map((column) => (column.id === res.data.id ? res.data : column))
      );
      setColumnEditor(null);
      toast.success("Coluna atualizada com sucesso.");
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao atualizar coluna.");
    } finally {
      setIsSavingColumn(false);
    }
  };

  const handleDeleteColumn = async () => {
    if (!columnToDelete) {
      return;
    }

    setIsDeletingColumn(true);

    try {
      await api.delete(`/columns/${columnToDelete.id}`);
      setColumns((currentColumns) =>
        currentColumns.filter((column) => column.id !== columnToDelete.id)
      );
      setColumnToDelete(null);
      toast.success("Coluna excluida com sucesso.");
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao excluir coluna.");
    } finally {
      setIsDeletingColumn(false);
    }
  };

  const handleCreateTask = async (columnId) => {
    const draft = taskDrafts[columnId] ?? {
      title: "",
      description: "",
      priority: "",
      dueDate: "",
      assigneeId: "",
      isOpen: false,
    };

    if (!draft.title?.trim()) {
      toast.error("Informe o título da tarefa.");
      return;
    }

    try {
      const res = await api.post(`/tasks/column/${columnId}`, {
        title: draft.title,
        description: draft.description,
        priority: draft.priority,
        dueDate: draft.dueDate || null,
        assigneeId: draft.assigneeId || null,
      });
      resetTaskDraft(columnId);
      setRecentlyCreatedTaskId(res.data.id);
      await fetchBoard();
      toast.success("Tarefa criada com sucesso.");
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao criar tarefa.");
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) {
      return;
    }

    setIsDeletingTask(true);
    setDeletingTaskId(taskToDelete.id);

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 160);
      });
      await api.delete(`/tasks/${taskToDelete.id}`);
      await fetchBoard();
      setTaskToDelete(null);
      setDeletingTaskId("");
      toast.success("Tarefa excluída.");
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao excluir tarefa.");
    } finally {
      setDeletingTaskId("");
      setIsDeletingTask(false);
    }
  };

  const handleOpenTaskEditor = (task) => {
    setTaskEditor({
      id: task.id,
      title: task.title,
      description: task.description ?? "",
      priority: task.priority ?? "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
      assigneeId: task.assigneeId ?? "",
    });
  };

  const handleSaveTask = async (event) => {
    event.preventDefault();

    if (!taskEditor?.title.trim()) {
      toast.error("Informe o título da tarefa.");
      return;
    }

    setIsSavingTask(true);

    try {
      await api.put(`/tasks/${taskEditor.id}`, {
        title: taskEditor.title,
        description: taskEditor.description,
        priority: taskEditor.priority,
        dueDate: taskEditor.dueDate || null,
        assigneeId: taskEditor.assigneeId || null,
      });
      setTaskEditor(null);
      await fetchBoard();
      toast.success("Tarefa atualizada.");
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao atualizar tarefa.");
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleOpenComments = async (task) => {
    setSelectedTask(task);
    setComments([]);
    setNewComment("");
    setIsCommentsLoading(true);

    try {
      const res = await api.get(`/comments/task/${task.id}`);
      setComments(res.data);
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao carregar comentários.");
    } finally {
      setIsCommentsLoading(false);
    }
  };

  const handleAddComment = async (event) => {
    event.preventDefault();

    if (!selectedTask || !newComment.trim()) {
      toast.error("Digite um comentário antes de enviar.");
      return;
    }

    try {
      await api.post(`/comments/task/${selectedTask.id}`, { content: newComment });
      setNewComment("");
      await handleOpenComments(selectedTask);
      toast.success("Comentário adicionado.");
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao adicionar comentário.");
    }
  };

  const handleSaveBoard = async (event) => {
    event.preventDefault();

    if (!boardEditor?.title.trim()) {
      toast.error("Informe o título do board.");
      return;
    }

    setIsSavingBoard(true);

    try {
      const res = await api.put(`/boards/${boardEditor.id}`, {
        title: boardEditor.title,
        description: boardEditor.description,
      });

      setBoard(res.data);
      setColumns(res.data.columns ?? []);
      setMembers(res.data.members ?? []);
      setBoardEditor(null);
      toast.success("Board atualizado com sucesso.");
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao atualizar board.");
    } finally {
      setIsSavingBoard(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!board) {
      return;
    }

    setIsDeletingBoard(true);

    try {
      await api.delete(`/boards/${board.id}`);
      toast.success("Board excluido com sucesso.");
      navigate("/dashboard");
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao excluir board.");
    } finally {
      setIsDeletingBoard(false);
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();

    if (!newMemberEmail.trim()) {
      toast.error("Informe o email do membro.");
      return;
    }

    setIsSavingMember(true);

    try {
      await api.post(`/members/board/${id}`, {
        email: newMemberEmail,
        role: newMemberRole,
      });
      setNewMemberEmail("");
      setNewMemberRole("MEMBER");
      await fetchMembers();
      await fetchBoard();
      toast.success("Membro adicionado com sucesso.");
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao adicionar membro.");
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleUpdateMemberRole = async (member) => {
    try {
      await api.put(`/members/board/${id}/user/${member.userId}`, {
        role: member.role,
      });
      await fetchMembers();
      await fetchBoard();
      toast.success("Permissão atualizada.");
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao atualizar permissão.");
    }
  };

  const handleRemoveMember = async (member) => {
    try {
      await api.delete(`/members/board/${id}/user/${member.userId}`);
      await fetchMembers();
      await fetchBoard();
      toast.success("Membro removido.");
    } catch (error) {
      if (isSessionError(error)) {
        return;
      }

      toast.error(error.response?.data?.error ?? "Erro ao remover membro.");
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1760px]">
        <div className="rounded-[36px] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-900/15 sm:px-8 dark:border dark:border-slate-800 dark:bg-slate-950/95">
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
                <span className="text-sky-300">{board?.title ?? "Board"}</span>
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
                Workspace do board
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                {board?.title ?? "Carregando board"}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                {board?.description ||
                  "Planeje, distribua e conclua tarefas em um fluxo horizontal mais claro, com colunas fixas e movimento contínuo."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <MemberAvatarCluster
                members={members}
                onClick={async () => {
                  setIsMembersModalOpen(true);
                  await fetchMembers();
                }}
              />
              {canManageMembers ? (
                <button
                  type="button"
                  onClick={async () => {
                    setIsMembersModalOpen(true);
                    await fetchMembers();
                  }}
                  className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  Gerenciar membros
                </button>
              ) : null}
              {canManageBoard ? (
                <button
                  type="button"
                  onClick={() =>
                    setBoardEditor({
                      id: board.id,
                      title: board.title,
                      description: board.description ?? "",
                    })
                  }
                  className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  Editar board
                </button>
              ) : null}
              <button
                type="button"
                onClick={fetchBoard}
                className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Atualizar board
              </button>
              <Link
                to="/dashboard"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Voltar
              </Link>
              <UserMenu user={user} onLogout={logout} />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4">
              <p className="text-sm text-slate-300">Colunas</p>
              <p className="mt-2 text-3xl font-semibold text-white">{boardStats.columnCount}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4">
              <p className="text-sm text-slate-300">Tarefas</p>
              <p className="mt-2 text-3xl font-semibold text-white">{boardStats.taskCount}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4">
              <p className="text-sm text-slate-300">Membros</p>
              <p className="mt-2 text-3xl font-semibold text-white">{boardStats.memberCount}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4">
              <p className="text-sm text-slate-300">Entrega</p>
              <p className="mt-2 text-3xl font-semibold text-sky-300">
                {boardStats.completionRate}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          {isBoardLoading ? <BoardSkeleton /> : null}

          {!isBoardLoading && boardError ? (
            <StatePanel
              eyebrow="Erro no board"
              title="Não foi possível abrir este board."
              description={boardError}
              actionLabel="Tentar novamente"
              onAction={fetchBoard}
              tone="danger"
            />
          ) : null}

          {!isBoardLoading && !boardError ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="rounded-[32px] border border-slate-200 bg-slate-100/70 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                      Quadro
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                      Fluxo horizontal do projeto
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-300">
                    <p>Arraste tarefas e colunas para manter o andamento sempre visível.</p>
                    {isReorderingColumns ? (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Salvando ordem...
                      </span>
                    ) : null}
                  </div>
                </div>

                <BoardFilters
                  filters={filters}
                  members={members}
                  visibleTaskCount={filteredTaskStats.visibleTaskCount}
                  hiddenTaskCount={filteredTaskStats.hiddenTaskCount}
                  onChange={updateFilter}
                  onClear={clearFilters}
                />

                <div ref={boardScrollRef} className="overflow-x-auto pb-4">
                  <div className="flex min-w-full items-stretch gap-5">
                    {columns.length === 0 ? <EmptyBoardLane /> : null}

                    <SortableContext
                      items={columns.map((column) => getColumnSortableId(column.id))}
                      strategy={horizontalListSortingStrategy}
                    >
                      {filteredColumns.map((column) => {
                        const draft = taskDrafts[column.id] ?? {
                          title: "",
                          description: "",
                          priority: "",
                          dueDate: "",
                          assigneeId: "",
                          isOpen: false,
                        };

                        return (
                          <BoardColumn
                            key={column.id}
                            column={column}
                            draft={draft}
                            members={members}
                            filteredTasks={column.filteredTasks}
                            hasActiveFilters={hasActiveFilters}
                            hasHiddenTasks={column.hiddenTaskCount > 0}
                            deletingTaskId={deletingTaskId}
                            recentlyCreatedTaskId={recentlyCreatedTaskId}
                            canManageColumn={canManageBoard}
                            onDraftChange={setTaskDraft}
                            onToggleComposer={toggleTaskComposer}
                            onCreateTask={handleCreateTask}
                            onEditTask={handleOpenTaskEditor}
                            onDeleteTask={setTaskToDelete}
                            onOpenComments={handleOpenComments}
                            onRenameColumn={(selectedColumn) =>
                              setColumnEditor({
                                id: selectedColumn.id,
                                title: selectedColumn.title,
                              })
                            }
                            onRequestDeleteColumn={setColumnToDelete}
                          />
                        );
                      })}
                    </SortableContext>

                    {canManageBoard ? (
                      <AddColumnLane
                        newColumnTitle={newColumnTitle}
                        isCreatingColumn={isCreatingColumn}
                        onTitleChange={setNewColumnTitle}
                        onCreateColumn={handleCreateColumn}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </DndContext>
          ) : null}
        </div>
      </div>

      {selectedTask ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/30 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-xl flex-col bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Comentários
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{selectedTask.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Fechar
              </button>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto">
              {isCommentsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="animate-pulse rounded-3xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="h-4 w-28 rounded-full bg-slate-200" />
                      <div className="mt-3 h-4 w-full rounded-full bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : null}

              {!isCommentsLoading && comments.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Ainda não existem comentários para esta tarefa.
                </div>
              ) : null}

              {!isCommentsLoading && comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <strong className="text-sm text-slate-900">{comment.author.name}</strong>
                        <span className="text-xs text-slate-400">
                          {new Date(comment.createdAt).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <form onSubmit={handleAddComment} className="mt-6 border-t border-slate-200 pt-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Novo comentário</span>
                <textarea
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  rows={4}
                  placeholder="Compartilhe contexto, decisão ou atualização."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
                />
              </label>
              <button
                type="submit"
                className="mt-3 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Adicionar comentário
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {isMembersModalOpen ? (
        <ModalShell
          eyebrow="Membros"
          title="Gerencie quem participa do board"
          description="Convide pessoas por email e ajuste o papel de cada uma no fluxo."
          onClose={() => setIsMembersModalOpen(false)}
          size="max-w-3xl"
        >
          {canManageMembers ? (
            <form onSubmit={handleAddMember} className="grid gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.2fr_0.7fr_auto]">
              <input
                type="email"
                value={newMemberEmail}
                onChange={(event) => setNewMemberEmail(event.target.value)}
                placeholder="email@empresa.com"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              />
              <select
                value={newMemberRole}
                onChange={(event) => setNewMemberRole(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button
                type="submit"
                disabled={isSavingMember}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSavingMember ? "Adicionando..." : "Adicionar"}
              </button>
            </form>
          ) : null}

          <div className="mt-5 space-y-3">
            {isMembersLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-[28px] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="h-4 w-36 rounded-full bg-slate-200" />
                  <div className="mt-3 h-4 w-28 rounded-full bg-slate-100" />
                </div>
              ))
            ) : null}

            {!isMembersLoading && members.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Nenhum membro foi adicionado a este board ainda.
              </div>
            ) : null}

            {!isMembersLoading &&
              members.map((member) => {
                const canUpdateRole =
                  currentMemberRole === "OWNER" &&
                  member.role !== "OWNER" &&
                  member.userId !== user?.id;
                const canRemove =
                  member.role !== "OWNER" &&
                  ((currentMemberRole === "OWNER" && member.userId !== user?.id) ||
                    (currentMemberRole === "ADMIN" && member.role === "MEMBER"));

                return (
                  <div
                    key={member.id}
                    className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                        {getAssigneeInitials(member.user?.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{member.user?.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{member.user?.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {canUpdateRole ? (
                        <select
                          value={member.role}
                          onChange={(event) =>
                            handleUpdateMemberRole({ ...member, role: event.target.value })
                          }
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400"
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="MEMBER">Member</option>
                        </select>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                          {getRoleLabel(member.role)}
                        </span>
                      )}

                      {canRemove ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member)}
                          className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600 transition hover:bg-rose-50"
                        >
                          Remover
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
          </div>
        </ModalShell>
      ) : null}

      {columnEditor ? (
        <ModalShell
          eyebrow="Coluna"
          title="Editar nome da coluna"
          description="Use nomes curtos e objetivos para manter o fluxo fácil de ler."
          onClose={() => setColumnEditor(null)}
        >
          <form onSubmit={handleSaveColumn} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Nome da coluna</span>
              <input
                type="text"
                value={columnEditor.title}
                onChange={(event) =>
                  setColumnEditor((currentValue) => ({
                    ...currentValue,
                    title: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
              />
            </label>

            <button
              type="submit"
              disabled={isSavingColumn}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSavingColumn ? "Salvando..." : "Salvar coluna"}
            </button>
          </form>
        </ModalShell>
      ) : null}

      {columnToDelete ? (
        <ModalShell
          eyebrow="Excluir coluna"
          title={`Excluir "${columnToDelete.title}"?`}
          description="Por segurança, só é permitido excluir colunas vazias. Se houver tarefas, mova ou remova antes."
          onClose={() => setColumnToDelete(null)}
        >
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDeleteColumn}
              disabled={isDeletingColumn}
              className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
            >
              {isDeletingColumn ? "Excluindo..." : "Confirmar exclusão"}
            </button>
            <button
              type="button"
              onClick={() => setColumnToDelete(null)}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </ModalShell>
      ) : null}

      {boardEditor ? (
        <ModalShell
          eyebrow="Board"
          title="Editar contexto do board"
          description="Atualize nome, descricao e configuracoes principais do quadro."
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

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSavingBoard}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSavingBoard ? "Salvando..." : "Salvar alterações"}
              </button>

              {canDeleteBoard ? (
                <button
                  type="button"
                  onClick={handleDeleteBoard}
                  disabled={isDeletingBoard}
                  className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                >
                  {isDeletingBoard ? "Excluindo..." : "Excluir board"}
                </button>
              ) : null}
            </div>
          </form>
        </ModalShell>
      ) : null}

      {taskToDelete ? (
        <ModalShell
          eyebrow="Excluir tarefa"
          title={`Excluir "${taskToDelete.title}"?`}
          description="Essa ação remove a tarefa do board. Use esta opção apenas quando a entrega realmente não for mais necessária."
          onClose={() => setTaskToDelete(null)}
        >
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDeleteTask}
              disabled={isDeletingTask}
              className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
            >
              {isDeletingTask ? "Excluindo..." : "Confirmar exclusão"}
            </button>
            <button
              type="button"
              onClick={() => setTaskToDelete(null)}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </ModalShell>
      ) : null}

      {taskEditor ? (
        <ModalShell
          eyebrow="Editar tarefa"
          title="Atualize os detalhes"
          description="Ajuste prioridade, prazo e responsável sem sair do board."
          onClose={() => setTaskEditor(null)}
        >
            <form onSubmit={handleSaveTask} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Título</span>
                <input
                  type="text"
                  value={taskEditor.title}
                  onChange={(event) =>
                    setTaskEditor((currentTask) => ({ ...currentTask, title: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Descrição</span>
                <textarea
                  value={taskEditor.description}
                  onChange={(event) =>
                    setTaskEditor((currentTask) => ({
                      ...currentTask,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Prioridade</span>
                  <select
                    value={taskEditor.priority}
                    onChange={(event) =>
                      setTaskEditor((currentTask) => ({
                        ...currentTask,
                        priority: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  >
                    <option value="">Sem prioridade</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Prazo</span>
                  <input
                    type="date"
                    value={taskEditor.dueDate}
                    onChange={(event) =>
                      setTaskEditor((currentTask) => ({
                        ...currentTask,
                        dueDate: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Responsável</span>
                <select
                  value={taskEditor.assigneeId}
                  onChange={(event) =>
                    setTaskEditor((currentTask) => ({
                      ...currentTask,
                      assigneeId: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                >
                  <option value="">Sem responsável</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.userId}>
                      {member.user.name} · {getRoleLabel(member.role)}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={isSavingTask}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSavingTask ? "Salvando..." : "Salvar alterações"}
              </button>
            </form>
        </ModalShell>
      ) : null}
    </div>
  );
};

export default Board;

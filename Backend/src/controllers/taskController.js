import prisma from "../prisma/client.js";
import {
  BOARD_ROLES,
  hasBoardPermission,
  publicUserSelect,
} from "../utils/boardAccess.js";

const memberRoles = [BOARD_ROLES.OWNER, BOARD_ROLES.ADMIN, BOARD_ROLES.MEMBER];

const parseDate = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? "invalid" : parsedDate;
};

const ensureAssigneeIsBoardMember = async (boardId, assigneeId) => {
  if (!assigneeId) {
    return true;
  }

  const member = await prisma.boardMember.findFirst({
    where: {
      boardId,
      userId: assigneeId,
    },
    select: { id: true },
  });

  return Boolean(member);
};

export const getTasks = async (req, res) => {
  const { columnId } = req.params;

  try {
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      select: { id: true, boardId: true },
    });

    if (!column) {
      return res.status(404).json({ error: "Coluna não encontrada" });
    }

    const hasPermission = await hasBoardPermission(column.boardId, req.user.id, memberRoles);

    if (!hasPermission) {
      return res.status(403).json({ error: "Permissão negada" });
    }

    const tasks = await prisma.task.findMany({
      where: { columnId },
      include: {
        assignee: {
          select: publicUserSelect,
        },
      },
      orderBy: { order: "asc" },
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const createTask = async (req, res) => {
  const { columnId } = req.params;
  const title = req.body.title?.trim();
  const description = req.body.description?.trim();
  const { priority, assigneeId } = req.body;
  const dueDate = parseDate(req.body.dueDate);

  if (!title) {
    return res.status(400).json({ error: "Título é obrigatório" });
  }

  if (dueDate === "invalid") {
    return res.status(400).json({ error: "Data de entrega inválida" });
  }

  try {
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      select: { id: true, boardId: true },
    });

    if (!column) {
      return res.status(404).json({ error: "Coluna não encontrada" });
    }

    const hasPermission = await hasBoardPermission(column.boardId, req.user.id, memberRoles);

    if (!hasPermission) {
      return res.status(403).json({ error: "Permissão negada" });
    }

    const isAssigneeValid = await ensureAssigneeIsBoardMember(column.boardId, assigneeId);

    if (!isAssigneeValid) {
      return res.status(400).json({ error: "Responsável não pertence ao board" });
    }

    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        priority: priority?.trim() || null,
        dueDate,
        assigneeId: assigneeId || null,
        order: lastTask ? lastTask.order + 1 : 1,
        columnId,
      },
      include: {
        assignee: {
          select: publicUserSelect,
        },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const updateTask = async (req, res) => {
  const { id } = req.params;
  const title = req.body.title?.trim();
  const description = req.body.description?.trim();
  const { priority, assigneeId, columnId, order } = req.body;
  const dueDate = parseDate(req.body.dueDate);

  if (dueDate === "invalid") {
    return res.status(400).json({ error: "Data de entrega inválida" });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        columnId: true,
        column: {
          select: {
            boardId: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: "Tarefa não encontrada" });
    }

    const hasPermission = await hasBoardPermission(task.column.boardId, req.user.id, memberRoles);

    if (!hasPermission) {
      return res.status(403).json({ error: "Permissão negada" });
    }

    let destinationColumnId = task.columnId;

    if (columnId && columnId !== task.columnId) {
      const destinationColumn = await prisma.column.findUnique({
        where: { id: columnId },
        select: { id: true, boardId: true },
      });

      if (!destinationColumn) {
        return res.status(404).json({ error: "Coluna de destino não encontrada" });
      }

      if (destinationColumn.boardId !== task.column.boardId) {
        return res.status(400).json({ error: "Não é permitido mover tarefas entre boards" });
      }

      destinationColumnId = destinationColumn.id;
    }

    const isAssigneeValid = await ensureAssigneeIsBoardMember(task.column.boardId, assigneeId);

    if (!isAssigneeValid) {
      return res.status(400).json({ error: "Responsável não pertence ao board" });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(priority !== undefined ? { priority: priority?.trim() || null } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
        ...(assigneeId !== undefined ? { assigneeId: assigneeId || null } : {}),
        ...(columnId !== undefined ? { columnId: destinationColumnId } : {}),
        ...(order !== undefined ? { order } : {}),
      },
      include: {
        assignee: {
          select: publicUserSelect,
        },
      },
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        column: {
          select: {
            boardId: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: "Tarefa não encontrada" });
    }

    const hasPermission = await hasBoardPermission(task.column.boardId, req.user.id, memberRoles);

    if (!hasPermission) {
      return res.status(403).json({ error: "Permissão negada" });
    }

    await prisma.$transaction([
      prisma.comment.deleteMany({
        where: { taskId: id },
      }),
      prisma.task.delete({
        where: { id },
      }),
    ]);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

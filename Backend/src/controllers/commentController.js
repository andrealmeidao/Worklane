import prisma from "../prisma/client.js";
import {
  BOARD_ROLES,
  hasBoardPermission,
  publicUserSelect,
} from "../utils/boardAccess.js";

const memberRoles = [BOARD_ROLES.OWNER, BOARD_ROLES.ADMIN, BOARD_ROLES.MEMBER];

export const getComments = async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
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

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        author: {
          select: publicUserSelect,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const createComment = async (req, res) => {
  const { taskId } = req.params;
  const content = req.body.content?.trim();

  if (!content) {
    return res.status(400).json({ error: "Conteúdo é obrigatório" });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
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

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        authorId: req.user.id,
      },
      include: {
        author: {
          select: publicUserSelect,
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

import prisma from "../prisma/client.js";
import { BOARD_ROLES, hasBoardPermission } from "../utils/boardAccess.js";
import { reorderColumnsForBoard } from "../services/columnService.js";

const memberRoles = [BOARD_ROLES.OWNER, BOARD_ROLES.ADMIN, BOARD_ROLES.MEMBER];
const managerRoles = [BOARD_ROLES.OWNER, BOARD_ROLES.ADMIN];

export const getColumns = async (req, res) => {
  const { boardId } = req.params;

  try {
    const hasPermission = await hasBoardPermission(boardId, req.user.id, memberRoles);

    if (!hasPermission) {
      return res.status(403).json({ error: "Permissão negada" });
    }

    const columns = await prisma.column.findMany({
      where: { boardId },
      include: {
        tasks: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    res.json(columns);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const createColumn = async (req, res) => {
  const { boardId } = req.params;
  const title = req.body.title?.trim();

  if (!title) {
    return res.status(400).json({ error: "Título é obrigatório" });
  }

  try {
    const hasPermission = await hasBoardPermission(boardId, req.user.id, managerRoles);

    if (!hasPermission) {
      return res.status(403).json({ error: "Permissão negada" });
    }

    const lastColumn = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const column = await prisma.column.create({
      data: {
        title,
        order: lastColumn ? lastColumn.order + 1 : 1,
        boardId,
      },
      include: {
        tasks: true,
      },
    });

    res.status(201).json(column);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const updateColumn = async (req, res) => {
  const { id } = req.params;
  const title = req.body.title?.trim();
  const { order } = req.body;

  try {
    const column = await prisma.column.findUnique({
      where: { id },
      select: { id: true, boardId: true },
    });

    if (!column) {
      return res.status(404).json({ error: "Coluna não encontrada" });
    }

    const hasPermission = await hasBoardPermission(column.boardId, req.user.id, managerRoles);

    if (!hasPermission) {
      return res.status(403).json({ error: "Permissão negada" });
    }

    const updatedColumn = await prisma.column.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(order !== undefined ? { order } : {}),
      },
      include: {
        tasks: {
          orderBy: { order: "asc" },
        },
      },
    });

    res.json(updatedColumn);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const reorderColumns = async (req, res) => {
  const { boardId } = req.params;
  const columnIds = Array.isArray(req.body.columnIds) ? req.body.columnIds : [];

  if (columnIds.length === 0) {
    return res.status(400).json({ error: "Informe a nova ordem das colunas" });
  }

  try {
    const hasPermission = await hasBoardPermission(boardId, req.user.id, managerRoles);

    if (!hasPermission) {
      return res.status(403).json({ error: "Permissao negada" });
    }

    const reorderedColumns = await reorderColumnsForBoard(prisma, boardId, columnIds);

    if (!reorderedColumns) {
      return res.status(400).json({ error: "Ordem de colunas invalida" });
    }

    res.json(reorderedColumns);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const deleteColumn = async (req, res) => {
  const { id } = req.params;

  try {
    const column = await prisma.column.findUnique({
      where: { id },
      select: { id: true, boardId: true },
    });

    if (!column) {
      return res.status(404).json({ error: "Coluna não encontrada" });
    }

    const hasPermission = await hasBoardPermission(column.boardId, req.user.id, managerRoles);

    if (!hasPermission) {
      return res.status(403).json({ error: "Permissão negada" });
    }

    const taskCount = await prisma.task.count({
      where: { columnId: id },
    });

    if (taskCount > 0) {
      return res.status(400).json({
        error: "A coluna precisa estar vazia para ser excluída",
      });
    }

    await prisma.column.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

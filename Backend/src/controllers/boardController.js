import prisma from "../prisma/client.js";
import {
  BOARD_ROLES,
  boardInclude,
  hasBoardPermission,
} from "../utils/boardAccess.js";

const listBoardInclude = {
  ...boardInclude,
};

const findAccessibleBoard = async (boardId, userId) =>
  prisma.board.findFirst({
    where: {
      id: boardId,
      members: {
        some: {
          userId,
        },
      },
    },
    include: boardInclude,
  });

export const getBoards = async (req, res) => {
  try {
    const boards = await prisma.board.findMany({
      where: {
        members: {
          some: {
            userId: req.user.id,
          },
        },
      },
      include: listBoardInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const getBoardById = async (req, res) => {
  try {
    const board = await findAccessibleBoard(req.params.id, req.user.id);

    if (!board) {
      return res.status(404).json({ error: "Board não encontrado" });
    }

    res.json(board);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const createBoard = async (req, res) => {
  const title = req.body.title?.trim();
  const description = req.body.description?.trim() || null;

  if (!title) {
    return res.status(400).json({ error: "Título é obrigatório" });
  }

  try {
    const board = await prisma.$transaction(async (tx) => {
      const createdBoard = await tx.board.create({
        data: {
          title,
          description,
          ownerId: req.user.id,
        },
      });

      await tx.boardMember.create({
        data: {
          boardId: createdBoard.id,
          userId: req.user.id,
          role: BOARD_ROLES.OWNER,
        },
      });

      return tx.board.findUnique({
        where: { id: createdBoard.id },
        include: boardInclude,
      });
    });

    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const updateBoard = async (req, res) => {
  const { id } = req.params;
  const title = req.body.title?.trim();
  const description = req.body.description?.trim();

  try {
    const hasPermission = await hasBoardPermission(id, req.user.id, [
      BOARD_ROLES.OWNER,
      BOARD_ROLES.ADMIN,
    ]);

    if (!hasPermission) {
      return res.status(403).json({ error: "Permissão negada" });
    }

    const updatedBoard = await prisma.board.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
      },
      include: boardInclude,
    });

    res.json(updatedBoard);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const deleteBoard = async (req, res) => {
  const { id } = req.params;

  try {
    const hasPermission = await hasBoardPermission(id, req.user.id, [BOARD_ROLES.OWNER]);

    if (!hasPermission) {
      return res.status(403).json({ error: "Permissão negada" });
    }

    await prisma.$transaction(async (tx) => {
      const columns = await tx.column.findMany({
        where: { boardId: id },
        select: { id: true },
      });

      const columnIds = columns.map((column) => column.id);
      const tasks = columnIds.length
        ? await tx.task.findMany({
            where: {
              columnId: { in: columnIds },
            },
            select: { id: true },
          })
        : [];
      const taskIds = tasks.map((task) => task.id);

      if (taskIds.length) {
        await tx.comment.deleteMany({
          where: {
            taskId: { in: taskIds },
          },
        });
      }

      if (columnIds.length) {
        await tx.task.deleteMany({
          where: {
            columnId: { in: columnIds },
          },
        });
      }

      await tx.column.deleteMany({
        where: { boardId: id },
      });

      await tx.boardMember.deleteMany({
        where: { boardId: id },
      });

      await tx.board.delete({
        where: { id },
      });
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

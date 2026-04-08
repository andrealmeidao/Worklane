import prisma from "../prisma/client.js";
import {
  BOARD_ROLES,
  hasBoardPermission,
  publicUserSelect,
} from "../utils/boardAccess.js";

const allowedRoles = Object.values(BOARD_ROLES);

const memberInclude = {
  user: {
    select: publicUserSelect,
  },
};

export const getMembers = async (req, res) => {
  const { boardId } = req.params;

  try {
    const hasPermission = await hasBoardPermission(boardId, req.user.id, allowedRoles);

    if (!hasPermission) {
      return res.status(403).json({ error: "Permissão negada" });
    }

    const members = await prisma.boardMember.findMany({
      where: { boardId },
      include: memberInclude,
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    res.json(members);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const addMember = async (req, res) => {
  const { boardId } = req.params;
  const email = req.body.email?.trim().toLowerCase();
  const role = req.body.role ?? BOARD_ROLES.MEMBER;

  if (!email) {
    return res.status(400).json({ error: "Email é obrigatório" });
  }

  if (!allowedRoles.includes(role) || role === BOARD_ROLES.OWNER) {
    return res.status(400).json({ error: "Função inválida" });
  }

  try {
    const hasPermission = await hasBoardPermission(boardId, req.user.id, [
      BOARD_ROLES.OWNER,
      BOARD_ROLES.ADMIN,
    ]);

    if (!hasPermission) {
      return res.status(403).json({ error: "Permissão negada" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: publicUserSelect,
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const existingMember = await prisma.boardMember.findFirst({
      where: { boardId, userId: user.id },
      select: { id: true },
    });

    if (existingMember) {
      return res.status(409).json({ error: "Usuário já é membro" });
    }

    const member = await prisma.boardMember.create({
      data: {
        boardId,
        userId: user.id,
        role,
      },
      include: memberInclude,
    });

    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const updateMemberRole = async (req, res) => {
  const { boardId, userId } = req.params;
  const { role } = req.body;

  if (!allowedRoles.includes(role) || role === BOARD_ROLES.OWNER) {
    return res.status(400).json({ error: "Função inválida" });
  }

  try {
    const hasPermission = await hasBoardPermission(boardId, req.user.id, [BOARD_ROLES.OWNER]);

    if (!hasPermission) {
      return res.status(403).json({ error: "Apenas o dono pode alterar funções" });
    }

    const member = await prisma.boardMember.findFirst({
      where: { boardId, userId },
      select: { id: true, role: true, userId: true },
    });

    if (!member) {
      return res.status(404).json({ error: "Membro não encontrado" });
    }

    if (member.userId === req.user.id) {
      return res.status(400).json({ error: "O dono não pode alterar a própria função" });
    }

    const updatedMember = await prisma.boardMember.update({
      where: { id: member.id },
      data: { role },
      include: memberInclude,
    });

    res.json(updatedMember);
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const removeMember = async (req, res) => {
  const { boardId, userId } = req.params;

  try {
    const actingMember = await prisma.boardMember.findFirst({
      where: { boardId, userId: req.user.id },
      select: { role: true },
    });

    if (!actingMember || ![BOARD_ROLES.OWNER, BOARD_ROLES.ADMIN].includes(actingMember.role)) {
      return res.status(403).json({ error: "Permissão negada" });
    }

    const targetMember = await prisma.boardMember.findFirst({
      where: { boardId, userId },
      select: { id: true, role: true, userId: true },
    });

    if (!targetMember) {
      return res.status(404).json({ error: "Membro não encontrado" });
    }

    if (targetMember.role === BOARD_ROLES.OWNER) {
      return res.status(400).json({ error: "O dono do board não pode ser removido" });
    }

    if (actingMember.role === BOARD_ROLES.ADMIN && targetMember.role === BOARD_ROLES.ADMIN) {
      return res.status(403).json({ error: "Admins não podem remover outros admins" });
    }

    await prisma.boardMember.delete({
      where: { id: targetMember.id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

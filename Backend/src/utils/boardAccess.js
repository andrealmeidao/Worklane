import prisma from "../prisma/client.js";

export const BOARD_ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
};

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  bio: true,
  jobTitle: true,
  avatarUrl: true,
  createdAt: true,
};

export const authUserSelect = {
  ...publicUserSelect,
  theme: true,
  notificationsEnabled: true,
};

export const boardInclude = {
  columns: {
    orderBy: { order: "asc" },
    include: {
      tasks: {
        orderBy: { order: "asc" },
        include: {
          assignee: {
            select: publicUserSelect,
          },
        },
      },
    },
  },
  members: {
    include: {
      user: {
        select: publicUserSelect,
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  },
};

export const getBoardMembership = async (boardId, userId) =>
  prisma.boardMember.findFirst({
    where: { boardId, userId },
  });

export const hasBoardPermission = async (boardId, userId, roles) => {
  const membership = await getBoardMembership(boardId, userId);
  return Boolean(membership && roles.includes(membership.role));
};

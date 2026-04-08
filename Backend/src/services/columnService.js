export const reorderColumnsForBoard = async (prisma, boardId, columnIds) => {
  const columns = await prisma.column.findMany({
    where: { boardId },
    select: { id: true },
    orderBy: { order: "asc" },
  });

  if (columns.length !== columnIds.length) {
    return null;
  }

  const knownIds = new Set(columns.map((column) => column.id));
  const uniqueRequestedIds = new Set(columnIds);

  if (
    uniqueRequestedIds.size !== columnIds.length ||
    columnIds.some((columnId) => !knownIds.has(columnId))
  ) {
    return null;
  }

  await prisma.$transaction(async (tx) => {
    for (let index = 0; index < columnIds.length; index += 1) {
      await tx.column.update({
        where: { id: columnIds[index] },
        data: { order: columnIds.length + index + 1 },
      });
    }

    for (let index = 0; index < columnIds.length; index += 1) {
      await tx.column.update({
        where: { id: columnIds[index] },
        data: { order: index + 1 },
      });
    }
  });

  return prisma.column.findMany({
    where: { boardId },
    include: {
      tasks: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });
};

import prisma from "../prisma/client.js";
import { authUserSelect } from "../utils/boardAccess.js";
import { verifyAccessToken } from "../utils/auth.js";

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const [scheme, token] = authHeader ? authHeader.split(" ") : [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  try {
    const payload = verifyAccessToken(token);
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.id },
      select: authUserSelect,
    });

    if (!dbUser) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    req.user = dbUser;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(403).json({ error: "Token inválido" });
    }

    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

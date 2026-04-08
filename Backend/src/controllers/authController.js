import prisma from "../prisma/client.js";
import { signAccessToken } from "../utils/auth.js";
import { authUserSelect } from "../utils/boardAccess.js";
import {
  comparePassword,
  ensurePasswordStrength,
  hashPassword,
  normalizeEmail,
  sanitizeUser,
} from "../services/userService.js";

export const register = async (req, res) => {
  const name = req.body.name?.trim();
  const email = normalizeEmail(req.body.email);
  const password = req.body.password;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nome, email e senha são obrigatórios" });
  }

  if (!ensurePasswordStrength(password)) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres" });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email já cadastrado" });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        ...authUserSelect,
      },
    });

    const token = signAccessToken({ id: user.id, email: user.email });

    res.status(201).json({
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const login = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = signAccessToken({ id: user.id, email: user.email });

    res.json({
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

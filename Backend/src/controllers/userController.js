import prisma from "../prisma/client.js";
import { register } from "./authController.js";
import { authUserSelect } from "../utils/boardAccess.js";
import {
  allowedThemes,
  comparePassword,
  ensurePasswordStrength,
  hashPassword,
  normalizeOptionalText,
  normalizeTheme,
  sanitizeUser,
} from "../services/userService.js";

export { register };

export const getCurrentUser = async (req, res) => {
  res.json({
    user: sanitizeUser(req.user),
  });
};

export const updateCurrentUser = async (req, res) => {
  const name = req.body.name?.trim();
  const bio = normalizeOptionalText(req.body.bio);
  const jobTitle = normalizeOptionalText(req.body.jobTitle);
  const avatarUrl = normalizeOptionalText(req.body.avatarUrl);
  const theme = normalizeTheme(req.body.theme);
  const notificationsEnabled = req.body.notificationsEnabled;
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;

  if (name !== undefined && !name) {
    return res.status(400).json({ error: "Nome nao pode ser vazio" });
  }

  if (req.body.theme !== undefined && theme === null) {
    return res.status(400).json({
      error: `Tema invalido. Use: ${allowedThemes.join(", ")}`,
    });
  }

  if (
    notificationsEnabled !== undefined &&
    typeof notificationsEnabled !== "boolean"
  ) {
    return res.status(400).json({
      error: "A preferencia de notificacoes deve ser true ou false",
    });
  }

  if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
    return res.status(400).json({
      error: "Informe a senha atual e a nova senha para alterar a senha",
    });
  }

  if (newPassword && !ensurePasswordStrength(newPassword)) {
    return res.status(400).json({
      error: "A nova senha deve ter pelo menos 8 caracteres",
    });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "Usuario nao encontrado" });
    }

    if (currentPassword && newPassword) {
      const isPasswordValid = await comparePassword(
        currentPassword,
        currentUser.password
      );

      if (!isPasswordValid) {
        return res.status(400).json({ error: "Senha atual invalida" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(jobTitle !== undefined ? { jobTitle } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(theme !== undefined ? { theme } : {}),
        ...(notificationsEnabled !== undefined ? { notificationsEnabled } : {}),
        ...(newPassword ? { password: await hashPassword(newPassword) } : {}),
      },
      select: authUserSelect,
    });

    res.json({
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

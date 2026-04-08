import bcrypt from "bcrypt";

export const SALT_ROUNDS = 10;
export const MIN_PASSWORD_LENGTH = 8;

export const normalizeEmail = (email) => email?.trim().toLowerCase();

export const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  bio: user.bio ?? "",
  jobTitle: user.jobTitle ?? "",
  avatarUrl: user.avatarUrl ?? "",
  theme: user.theme ?? "system",
  notificationsEnabled: user.notificationsEnabled ?? true,
  createdAt: user.createdAt,
});

export const allowedThemes = ["light", "dark", "system"];

export const normalizeOptionalText = (value) => {
  if (value === undefined) {
    return undefined;
  }

  const trimmedValue = String(value ?? "").trim();
  return trimmedValue ? trimmedValue : null;
};

export const normalizeTheme = (theme) => {
  if (theme === undefined) {
    return undefined;
  }

  return allowedThemes.includes(theme) ? theme : null;
};

export const ensurePasswordStrength = (password) =>
  typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH;

export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = (password, hashedPassword) =>
  bcrypt.compare(password, hashedPassword);

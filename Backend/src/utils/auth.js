import jwt from "jsonwebtoken";

const TOKEN_EXPIRATION = "7d";

export const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return process.env.JWT_SECRET;
};

export const signAccessToken = (payload) =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRATION });

export const verifyAccessToken = (token) => jwt.verify(token, getJwtSecret());

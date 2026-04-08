import express from "express";
import { getCurrentUser, register, updateCurrentUser } from "../controllers/userController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.get("/me", authenticateToken, getCurrentUser);
router.put("/me", authenticateToken, updateCurrentUser);

export default router;

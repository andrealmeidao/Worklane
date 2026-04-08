import express from "express";
import {
  getBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
} from "../controllers/boardController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getBoards);
router.get("/:id", getBoardById);
router.post("/", createBoard);
router.put("/:id", updateBoard);
router.delete("/:id", deleteBoard);

export default router;

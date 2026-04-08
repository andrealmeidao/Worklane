import express from "express";
import {
  getColumns,
  createColumn,
  updateColumn,
  reorderColumns,
  deleteColumn,
} from "../controllers/columnController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/board/:boardId", getColumns);
router.post("/board/:boardId", createColumn);
router.put("/board/:boardId/reorder", reorderColumns);
router.put("/:id", updateColumn);
router.delete("/:id", deleteColumn);

export default router;

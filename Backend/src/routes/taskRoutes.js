import express from "express";
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/taskController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/column/:columnId", getTasks);
router.post("/column/:columnId", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
import express from "express";
import { getComments, createComment } from "../controllers/commentController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/task/:taskId", getComments);
router.post("/task/:taskId", createComment);

export default router;
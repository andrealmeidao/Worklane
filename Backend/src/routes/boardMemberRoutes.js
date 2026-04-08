import express from "express";
import { getMembers, addMember, updateMemberRole, removeMember } from "../controllers/boardMemberController.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/board/:boardId", getMembers);
router.post("/board/:boardId", addMember);
router.put("/board/:boardId/user/:userId", updateMemberRole);
router.delete("/board/:boardId/user/:userId", removeMember);

export default router;
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import columnRoutes from "./routes/columnRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import boardMemberRoutes from "./routes/boardMemberRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/columns", columnRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/members", boardMemberRoutes);
app.use("/api/comments", commentRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

export default app;

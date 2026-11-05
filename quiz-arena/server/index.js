import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import questionRoutes from "./routes/questions.js";
import quizRoutes from "./routes/quiz.js";
import { attachRooms } from "./rooms.js";
import { ensureAdmin, ensureSampleQuestions } from "./bootstrap.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/quiz-arena";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/quiz", quizRoutes);

// Serve the built React app in production.
const dist = path.join(__dirname, "..", "dist");
app.use(express.static(dist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) return next();
  res.sendFile(path.join(dist, "index.html"), (err) => err && next());
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
attachRooms(io);

try {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log("Connected to MongoDB");
  await ensureAdmin();
  await ensureSampleQuestions();
} catch (e) {
  console.error("\nMongoDB connection failed:", e.message);
  console.error("Start MongoDB locally, or set MONGODB_URI in your .env file (see .env.example).\n");
  process.exit(1);
}

server.listen(PORT, () => console.log(`Quiz Arena server running on http://localhost:${PORT}`));

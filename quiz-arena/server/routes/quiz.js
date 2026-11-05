import { Router } from "express";
import Question from "../models/Question.js";
import Result from "../models/Result.js";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Candidate: get a random set of questions WITHOUT the correct answers.
router.get("/start", requireRole("candidate"), async (req, res) => {
  const count = Math.min(Math.max(parseInt(req.query.count) || 10, 1), 50);
  const match = req.query.category && req.query.category !== "all" ? { category: req.query.category } : {};
  const questions = await Question.aggregate([{ $match: match }, { $sample: { size: count } }]);
  if (!questions.length) return res.status(404).json({ error: "No questions available yet. Ask your admin to add some." });
  res.json(
    questions.map((q) => ({ id: q._id, text: q.text, options: q.options, category: q.category, difficulty: q.difficulty }))
  );
});

// Candidate: submit answers, grade on the server, save the result.
router.post("/submit", requireRole("candidate"), async (req, res) => {
  try {
    const { answers = [], timeTaken = 0, category = "All" } = req.body;
    const ids = answers.map((a) => a.questionId);
    const questions = await Question.find({ _id: { $in: ids } });
    const byId = new Map(questions.map((q) => [String(q._id), q]));
    let correct = 0;
    const review = answers.map((a) => {
      const q = byId.get(String(a.questionId));
      if (!q) return null;
      const isCorrect = a.selected === q.correctIndex;
      if (isCorrect) correct++;
      return { id: q._id, text: q.text, options: q.options, selected: a.selected, correctIndex: q.correctIndex, isCorrect };
    }).filter(Boolean);
    const total = review.length;
    const score = correct * 100;
    const result = await Result.create({
      user: req.user._id, userName: req.user.name, mode: "solo", category, score, correct, total, timeTaken
    });
    res.json({ resultId: result._id, score, correct, total, review });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/results/me", async (req, res) => {
  const results = await Result.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30);
  res.json(results);
});

router.get("/leaderboard", async (_req, res) => {
  const rows = await Result.aggregate([
    { $group: { _id: "$user", name: { $first: "$userName" }, best: { $max: "$score" }, total: { $sum: "$score" }, games: { $sum: 1 } } },
    { $sort: { total: -1 } },
    { $limit: 20 }
  ]);
  res.json(rows);
});

// Admin: dashboard numbers + all results.
router.get("/admin/stats", requireRole("admin"), async (_req, res) => {
  const [questions, candidates, results, avg] = await Promise.all([
    Question.countDocuments(),
    User.countDocuments({ role: "candidate" }),
    Result.countDocuments(),
    Result.aggregate([{ $match: { total: { $gt: 0 } } }, { $group: { _id: null, pct: { $avg: { $divide: ["$correct", "$total"] } } } }])
  ]);
  const byCategory = await Question.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  res.json({ questions, candidates, results, avgPercent: Math.round((avg[0]?.pct || 0) * 100), byCategory });
});

router.get("/admin/results", requireRole("admin"), async (_req, res) => {
  res.json(await Result.find().sort({ createdAt: -1 }).limit(200));
});

export default router;

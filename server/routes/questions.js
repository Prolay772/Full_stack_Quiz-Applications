import { Router } from "express";
import Question from "../models/Question.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Categories are visible to everyone logged in (used by the candidate dashboard).
router.get("/categories", async (_req, res) => {
  const rows = await Question.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  res.json(rows.map((r) => ({ name: r._id, count: r.count })));
});

// Everything below is admin-only.
router.use(requireRole("admin"));

router.get("/", async (req, res) => {
  const { search, category, difficulty } = req.query;
  const filter = {};
  if (search) filter.text = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  if (category && category !== "all") filter.category = category;
  if (difficulty && difficulty !== "all") filter.difficulty = difficulty;
  const questions = await Question.find(filter).sort({ createdAt: -1 });
  res.json(questions);
});

router.post("/", async (req, res) => {
  try {
    const { text, options, correctIndex, category, difficulty } = req.body;
    const q = await Question.create({
      text, options, correctIndex, category: category || "General", difficulty, createdBy: req.user._id
    });
    res.status(201).json(q);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ error: "Question not found." });
    const { text, options, correctIndex, category, difficulty } = req.body;
    Object.assign(q, { text, options, correctIndex, category: category || "General", difficulty });
    await q.save();
    res.json(q);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  const q = await Question.findByIdAndDelete(req.params.id);
  if (!q) return res.status(404).json({ error: "Question not found." });
  res.json({ ok: true });
});

export default router;
